<script lang="ts" setup>
import type { PermissionManagementApi, RoleManagementApi } from '#/api';
import type { TableColumnsType } from 'ant-design-vue';

import { computed, h, onMounted, reactive, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  Checkbox,
  Col,
  Drawer,
  Empty,
  Form,
  Input,
  InputNumber,
  Radio,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  Tooltip,
  message,
} from 'ant-design-vue';

import {
  createNavigationEntryApi,
  getRoleNavigationApi,
  listNavigationEntriesApi,
  listRolesApi,
  resolveNavigationPreviewApi,
  setRoleLandingPoliciesApi,
  setRoleNavigationVisibilityApi,
  updateNavigationEntryApi,
} from '#/api';
import { useAuthStore } from '#/store';
import { useAuthContextStore } from '#/store/auth-context';
import {
  buildNavigationPreviewEntryRows,
  buildNavigationTerminalList,
  buildRoleOptionLabel,
  buildRoleNavigationEditorModel,
  buildRoleNavigationSavePayload,
  inferNavigationPreviewScopeLevel,
} from './navigation-management.helpers';

type EntryFormMode = 'create' | 'edit';

interface EntryFilterState {
  enabled: '' | 'false' | 'true';
  keyword: string;
  terminal: string;
}

interface EntryFormState {
  description: string;
  enabled: boolean;
  entryKey: string;
  entryType: string;
  featureKey: string;
  name: string;
  registryPriority: number;
  supportedTerminals: string[];
}

interface RoleFormState {
  editorTerminal: string;
  previewRoleIds: string[];
  roleId: string;
  terminal: string;
}

interface SelectOption {
  label: string;
  value: string;
}

interface RoleSelectOption extends SelectOption {
  role: RoleManagementApi.Role;
}

const authContextStore = useAuthContextStore();
const authStore = useAuthStore();
const entryStatusOptions: SelectOption[] = [
  { label: '全部状态', value: '' },
  { label: '启用', value: 'true' },
  { label: '停用', value: 'false' },
];
const activeTab = ref('entries');
const entries = ref<PermissionManagementApi.NavigationEntry[]>([]);
const registryEntries = ref<PermissionManagementApi.NavigationEntry[]>([]);
const selectedEntry = ref<PermissionManagementApi.NavigationEntry | null>(null);
const entryFormMode = ref<EntryFormMode>('create');
const entryDrawerOpen = ref(false);
const entryLoading = ref(false);
const entrySaving = ref(false);
const roleLoading = ref(false);
const roleSaving = ref(false);
const roleOptionsLoading = ref(false);
const previewLoading = ref(false);
const previewRequestVersion = ref(0);
const roleNavigation = ref<PermissionManagementApi.RoleNavigationConfig | null>(null);
const previewResult = ref<PermissionManagementApi.ResolveNavigationPreviewResult | null>(null);
const roleOptions = ref<RoleSelectOption[]>([]);
const roleEditorVisibleEntryKeys = ref<string[]>([]);
const roleEditorLandingEntryKey = ref('');

const entryFilters = reactive<EntryFilterState>({
  enabled: '',
  keyword: '',
  terminal: 'WEB',
});
const entryPagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
});
const entryForm = reactive<EntryFormState>({
  description: '',
  enabled: true,
  entryKey: '',
  entryType: 'page',
  featureKey: '',
  name: '',
  registryPriority: 100,
  supportedTerminals: ['WEB'],
});
const roleForm = reactive<RoleFormState>({
  editorTerminal: 'DEFAULT',
  roleId: '',
  previewRoleIds: [],
  terminal: 'WEB',
});

const canCreateEntry = computed(() =>
  authContextStore.actionCodes.includes('permission.navigation.entry.create'),
);
const canUpdateEntry = computed(() =>
  authContextStore.actionCodes.includes('permission.navigation.entry.update'),
);
const canUpdateRole = computed(() =>
  authContextStore.actionCodes.includes('permission.role_instance.update'),
);
const canPreview = computed(() =>
  authContextStore.actionCodes.includes('permission.navigation.resolve_preview'),
);
const loadedLandingPolicyCount = computed(
  () => roleNavigation.value?.landingPolicies?.length ?? 0,
);
const loadedVisibilityCount = computed(
  () => roleNavigation.value?.visibility?.length ?? 0,
);
const previewVisibleCount = computed(
  () => previewResult.value?.visibleEntries?.length ?? 0,
);
const selectedRoleOption = computed(() =>
  roleOptions.value.find((option) => option.value === roleForm.roleId) ?? null,
);
const selectedPreviewRoles = computed(() =>
  roleOptions.value
    .filter((option) => roleForm.previewRoleIds.includes(option.value))
    .map((option) => option.role),
);
const managedTerminalOptions = computed<SelectOption[]>(() =>
  buildNavigationTerminalList(registryEntries.value).map((terminal) => ({
    label: terminal,
    value: terminal,
  })),
);
const entryTerminalOptions = computed<SelectOption[]>(() => [
  { label: '全部终端', value: '' },
  ...managedTerminalOptions.value,
]);
const roleEditorTerminalOptions = computed<SelectOption[]>(() => [
  { label: 'DEFAULT', value: 'DEFAULT' },
  ...buildNavigationTerminalList(registryEntries.value).map((terminal) => ({
    label: terminal,
    value: terminal,
  })),
]);
const roleEditorEntries = computed(() =>
  buildRoleNavigationEditorModel({
    entries: registryEntries.value,
    landingPolicies: roleNavigation.value?.landingPolicies ?? [],
    terminal: roleForm.editorTerminal,
    visibility: roleNavigation.value?.visibility ?? [],
  }).entries,
);
const previewEntryRows = computed(() =>
  buildNavigationPreviewEntryRows({
    entries: registryEntries.value,
    previewResult: previewResult.value,
  }),
);
const previewEmptyHint = computed(() => {
  if (!previewResult.value) {
    return '运行预览后，在这里查看默认落点与可见 Entry。';
  }

  if (previewResult.value.fallbackReason === 'NO_VISIBLE_ENTRIES') {
    return `当前 ${roleForm.terminal} 没有可见 Entry。DEFAULT 只会作用到支持该前端的 Entry。`;
  }

  return '当前结果没有可见 Entry';
});

const entryColumns = computed<TableColumnsType>(() => [
  {
    dataIndex: 'entryKey',
    title: 'Entry Key',
  },
  {
    dataIndex: 'name',
    title: '名称',
  },
  {
    dataIndex: 'featureKey',
    title: 'Feature',
  },
  {
    dataIndex: 'supportedTerminals',
    title: '终端',
    customRender: ({ record }) =>
      h(
        Space,
        { size: 4 },
        () =>
          ((record as PermissionManagementApi.NavigationEntry).supportedTerminals ?? []).map(
            (terminal) => h(Tag, { key: terminal }, () => terminal),
          ),
      ),
  },
  {
    dataIndex: 'registryPriority',
    title: '优先级',
    width: 90,
  },
  {
    dataIndex: 'enabled',
    title: '状态',
    width: 90,
    customRender: ({ record }) =>
      h(
        Tag,
        {
          color: (record as PermissionManagementApi.NavigationEntry).enabled
            ? 'green'
            : 'default',
        },
        () => ((record as PermissionManagementApi.NavigationEntry).enabled ? '启用' : '停用'),
      ),
  },
  {
    key: 'actions',
    title: '操作',
    width: 120,
    customRender: ({ record }) =>
      h(
        Button,
        {
          disabled: !canUpdateEntry.value,
          size: 'small',
          type: 'link',
          onClick: () =>
            openEntryDrawer('edit', record as PermissionManagementApi.NavigationEntry),
        },
        () => '编辑',
      ),
  },
]);
const roleEditorColumns = computed<TableColumnsType>(() => [
  {
    key: 'visible',
    title: '可见',
    width: 76,
    customRender: ({ record }) =>
      h(Checkbox, {
        checked: roleEditorVisibleEntryKeys.value.includes(
          (record as PermissionManagementApi.NavigationEntry).entryKey,
        ),
        onChange: (event: { target?: { checked?: boolean } }) =>
          toggleRoleEditorVisibility(
            (record as PermissionManagementApi.NavigationEntry).entryKey,
            event.target?.checked === true,
          ),
      }),
  },
  {
    key: 'landing',
    title: '默认',
    width: 76,
    customRender: ({ record }) => {
      const entry = record as PermissionManagementApi.NavigationEntry;
      const checked = roleEditorLandingEntryKey.value === entry.entryKey;
      const disabled = !roleEditorVisibleEntryKeys.value.includes(entry.entryKey);

      return h(Radio, {
        checked,
        disabled,
        onChange: () => {
          roleEditorLandingEntryKey.value = entry.entryKey;
        },
      });
    },
  },
  {
    dataIndex: 'name',
    title: '名称',
    width: 180,
  },
  {
    dataIndex: 'entryKey',
    title: 'Entry Key',
  },
  {
    dataIndex: 'supportedTerminals',
    title: '终端',
    width: 140,
    customRender: ({ record }) =>
      h(
        Space,
        { size: 4 },
        () =>
          ((record as PermissionManagementApi.NavigationEntry).supportedTerminals ?? []).map(
            (terminal) => h(Tag, { key: terminal }, () => terminal),
          ),
      ),
  },
  {
    dataIndex: 'registryPriority',
    title: '优先级',
    width: 90,
  },
]);

const tablePagination = computed(() => ({
  current: entryPagination.current,
  pageSize: entryPagination.pageSize,
  showQuickJumper: true,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条`,
  total: entryPagination.total,
}));

// Normalizes unknown request failures into a stable user-facing message.
function getErrorMessage(error: unknown, fallback: string) {
  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string' &&
    error.message.trim()
  ) {
    return error.message;
  }

  return fallback;
}

// Normalizes editable terminal arrays into a stable terminal list.
function normalizeTerminalList(value: string[]) {
  return value
    .map((item) => item.trim())
    .filter(Boolean);
}

// Refreshes the current operator menu state after managed navigation changes take effect.
async function refreshCurrentSessionNavigation() {
  try {
    await authStore.refreshCurrentSessionAccess();
  } catch (error) {
    message.warning(
      getErrorMessage(error, '配置已保存，但当前会话导航未能自动刷新，请手动刷新页面。'),
    );
  }
}

// Merges freshly queried role options without dropping the current selected role.
function mergeRoleOptions(roles: RoleManagementApi.Role[]) {
  const merged = new Map<string, RoleSelectOption>();

  for (const option of roleOptions.value) {
    merged.set(option.value, option);
  }

  for (const role of roles) {
    merged.set(role.id, {
      label: buildRoleOptionLabel(role),
      role,
      value: role.id,
    });
  }

  roleOptions.value = [...merged.values()];
}

// Loads selectable roles for the single-role navigation editor.
async function loadRoleOptions(keyword = '') {
  roleOptionsLoading.value = true;

  try {
    const result = await listRolesApi({
      keyword: keyword.trim() || undefined,
      page: 1,
      pageSize: 20,
      scopeLevel: authContextStore.isPlatformScope ? undefined : 'TENANT',
      tenantId: authContextStore.isPlatformScope
        ? undefined
        : authContextStore.sessionContext?.tenant?.tenantId,
    });

    mergeRoleOptions(result.roles ?? []);
  } catch (error) {
    message.error(getErrorMessage(error, '加载角色选项失败'));
  } finally {
    roleOptionsLoading.value = false;
  }
}

// Resets loaded single-role config when the administrator switches the selected role.
function handleRoleSelectionChange(value: unknown) {
  roleForm.roleId = typeof value === 'string' ? value : '';
  roleNavigation.value = null;
  roleEditorVisibleEntryKeys.value = [];
  roleEditorLandingEntryKey.value = '';
}

// Normalizes the multi-role preview selector into a stable string-id list.
function handlePreviewRoleSelectionChange(value: unknown) {
  roleForm.previewRoleIds = Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

// Loads the full navigation registry so terminal selectors and previews are not constrained by the paged table slice.
async function loadRegistryEntries() {
  const pageSize = 200;
  const collected: PermissionManagementApi.NavigationEntry[] = [];
  let currentPage = 1;
  let total = 0;

  try {
    do {
      const result = await listNavigationEntriesApi({
        page: currentPage,
        pageSize,
      });

      collected.push(...(result.entries ?? []));
      total = result.total ?? collected.length;
      currentPage += 1;
    } while (collected.length < total);

    registryEntries.value = collected;
  } catch (error) {
    registryEntries.value = [];
    message.error(getErrorMessage(error, '加载导航终端目录失败'));
  }
}

// Loads one page of managed navigation entry registry records.
async function loadEntries(options?: { page?: number }) {
  entryLoading.value = true;

  try {
    const result = await listNavigationEntriesApi({
      enabled:
        entryFilters.enabled === '' ? undefined : entryFilters.enabled === 'true',
      keyword: entryFilters.keyword.trim() || undefined,
      page: options?.page ?? entryPagination.current,
      pageSize: entryPagination.pageSize,
      terminal: entryFilters.terminal.trim() || undefined,
    });

    entries.value = result.entries ?? [];
    entryPagination.current = result.page || options?.page || entryPagination.current;
    entryPagination.pageSize = result.pageSize || entryPagination.pageSize;
    entryPagination.total = result.total || 0;
  } catch (error) {
    entries.value = [];
    entryPagination.total = 0;
    message.error(getErrorMessage(error, '加载 Navigation Entry 失败'));
  } finally {
    entryLoading.value = false;
  }
}

// Applies the current entry filters and reloads from the first page.
async function searchEntries() {
  entryPagination.current = 1;
  await loadEntries({ page: 1 });
}

// Resets the entry filter shell back to its default managed-web view.
async function resetEntryFilters() {
  entryFilters.enabled = '';
  entryFilters.keyword = '';
  entryFilters.terminal = 'WEB';
  await searchEntries();
}

// Opens the navigation entry drawer with create or edit state.
function openEntryDrawer(
  mode: EntryFormMode,
  entry?: PermissionManagementApi.NavigationEntry,
) {
  if (
    (mode === 'create' && !canCreateEntry.value) ||
    (mode === 'edit' && !canUpdateEntry.value)
  ) {
    return;
  }

  entryFormMode.value = mode;
  selectedEntry.value = entry ?? null;
  entryForm.description = entry?.description ?? '';
  entryForm.enabled = entry?.enabled ?? true;
  entryForm.entryKey = entry?.entryKey ?? '';
  entryForm.entryType = entry?.entryType ?? 'page';
  entryForm.featureKey = entry?.featureKey ?? '';
  entryForm.name = entry?.name ?? '';
  entryForm.registryPriority = entry?.registryPriority ?? 100;
  entryForm.supportedTerminals = [...(entry?.supportedTerminals ?? ['WEB'])];
  entryDrawerOpen.value = true;
}

// Validates required navigation entry fields before persistence.
function validateEntryForm() {
  if (entryFormMode.value === 'create' && !entryForm.entryKey.trim()) {
    message.warning('请填写 Entry Key');
    return false;
  }

  if (!entryForm.name.trim()) {
    message.warning('请填写名称');
    return false;
  }

  if (normalizeTerminalList(entryForm.supportedTerminals).length === 0) {
    message.warning('请至少填写一个终端');
    return false;
  }

  return true;
}

// Persists create or edit changes for one managed navigation entry.
async function submitEntryForm() {
  if (
    (entryFormMode.value === 'create' && !canCreateEntry.value) ||
    (entryFormMode.value === 'edit' && !canUpdateEntry.value)
  ) {
    return;
  }

  if (!validateEntryForm()) {
    return;
  }

  entrySaving.value = true;

  try {
    const payload = {
      description: entryForm.description.trim() || undefined,
      enabled: entryForm.enabled,
      entryType: entryForm.entryType.trim() || 'page',
      featureKey: entryForm.featureKey.trim() || undefined,
      name: entryForm.name.trim(),
      registryPriority: entryForm.registryPriority,
      supportedTerminals: normalizeTerminalList(entryForm.supportedTerminals),
    };

    if (entryFormMode.value === 'create') {
      await createNavigationEntryApi({
        ...payload,
        entryKey: entryForm.entryKey.trim(),
      });
      message.success('Navigation Entry 已创建');
    } else if (selectedEntry.value) {
      await updateNavigationEntryApi(selectedEntry.value.entryKey, payload);
      message.success('Navigation Entry 已更新');
    }

    entryDrawerOpen.value = false;
    await loadRegistryEntries();
    await loadEntries();
    await refreshCurrentSessionNavigation();
  } catch (error) {
    message.error(getErrorMessage(error, '保存 Navigation Entry 失败'));
  } finally {
    entrySaving.value = false;
  }
}

// Keeps table pagination state aligned with Ant Design table changes.
async function handleEntryTableChange(pager: { current?: number; pageSize?: number }) {
  entryPagination.current = pager.current ?? 1;
  entryPagination.pageSize = pager.pageSize ?? entryPagination.pageSize;
  await loadEntries({ page: entryPagination.current });
}

// Loads the current navigation config for one role.
async function loadRoleNavigation() {
  const roleId = roleForm.roleId.trim();
  if (!roleId) {
    message.warning('请选择角色');
    return;
  }

  roleLoading.value = true;

  try {
    const result = await getRoleNavigationApi(roleId);
    roleNavigation.value = result;
    syncRoleNavigationEditor();
  } catch (error) {
    roleNavigation.value = null;
    roleEditorVisibleEntryKeys.value = [];
    roleEditorLandingEntryKey.value = '';
    message.error(getErrorMessage(error, '加载 Role Navigation 失败'));
  } finally {
    roleLoading.value = false;
  }
}

// Synchronizes the list-based editor state with the currently loaded role navigation record.
function syncRoleNavigationEditor() {
  if (!roleNavigation.value) {
    roleEditorVisibleEntryKeys.value = [];
    roleEditorLandingEntryKey.value = '';
    return;
  }

  const editorModel = buildRoleNavigationEditorModel({
    entries: registryEntries.value,
    landingPolicies: roleNavigation.value.landingPolicies ?? [],
    terminal: roleForm.editorTerminal,
    visibility: roleNavigation.value.visibility ?? [],
  });

  roleEditorVisibleEntryKeys.value = [...editorModel.visibleEntryKeys];
  roleEditorLandingEntryKey.value = editorModel.landingEntryKey;
}

// Toggles one entry in the role editor list and clears an invalid landing selection when needed.
function toggleRoleEditorVisibility(entryKey: string, checked: boolean) {
  const nextEntryKeys = checked
    ? [...new Set([...roleEditorVisibleEntryKeys.value, entryKey])]
    : roleEditorVisibleEntryKeys.value.filter((item) => item !== entryKey);

  roleEditorVisibleEntryKeys.value = nextEntryKeys;

  if (!nextEntryKeys.includes(roleEditorLandingEntryKey.value)) {
    roleEditorLandingEntryKey.value = '';
  }
}

// Saves the current terminal list editor as one complete role-navigation configuration.
async function saveRoleNavigationConfig() {
  if (!canUpdateRole.value) {
    return;
  }

  const roleId = roleForm.roleId.trim();
  if (!roleId) {
    message.warning('请选择角色');
    return;
  }

  if (!roleNavigation.value) {
    message.warning('请先加载当前角色配置');
    return;
  }

  const payload = buildRoleNavigationSavePayload({
    entries: registryEntries.value,
    landingEntryKey: roleEditorLandingEntryKey.value,
    landingPolicies: roleNavigation.value.landingPolicies ?? [],
    terminal: roleForm.editorTerminal,
    visibility: roleNavigation.value.visibility ?? [],
    visibleEntryKeys: roleEditorVisibleEntryKeys.value,
  });

  if (!payload.valid) {
    message.warning(payload.message);
    return;
  }

  roleSaving.value = true;

  try {
    await setRoleNavigationVisibilityApi(roleId, {
      visibility: payload.visibility,
    });
    roleNavigation.value = await setRoleLandingPoliciesApi(roleId, {
      landingPolicies: payload.landingPolicies,
    });
    message.success('角色导航已保存');
    await loadRoleNavigation();
    await refreshCurrentSessionNavigation();
  } catch (error) {
    message.error(getErrorMessage(error, '保存角色导航失败'));
  } finally {
    roleSaving.value = false;
  }
}

// Calls the resolver preview endpoint for one or more role ids.
async function runResolverPreview() {
  if (!canPreview.value) {
    return;
  }

  const roleIds = roleForm.previewRoleIds;

  if (roleIds.length === 0) {
    message.warning('请至少选择一个角色');
    return;
  }

  const requestVersion = previewRequestVersion.value + 1;
  previewRequestVersion.value = requestVersion;
  previewLoading.value = true;
  previewResult.value = null;

  try {
    const result = await resolveNavigationPreviewApi({
      roleIds,
      scopeLevel: inferNavigationPreviewScopeLevel(selectedPreviewRoles.value),
      terminal: roleForm.terminal,
    });

    if (previewRequestVersion.value !== requestVersion) {
      return;
    }

    previewResult.value = {
      ...result,
      visibleEntries: result.visibleEntries ?? [],
    };
  } catch (error) {
    if (previewRequestVersion.value !== requestVersion) {
      return;
    }

    previewResult.value = null;
    message.error(getErrorMessage(error, 'Resolver Preview 失败'));
  } finally {
    if (previewRequestVersion.value === requestVersion) {
      previewLoading.value = false;
    }
  }
}

onMounted(() => {
  void loadRoleOptions();
  void loadRegistryEntries();
  void loadEntries({ page: 1 });
});

watch(
  [() => roleNavigation.value, () => roleForm.editorTerminal, () => registryEntries.value],
  () => {
    if (roleNavigation.value) {
      syncRoleNavigationEditor();
    }
  },
  { deep: true },
);

watch(
  [() => roleForm.terminal, () => roleForm.previewRoleIds.join('|')],
  () => {
    previewRequestVersion.value += 1;
    previewLoading.value = false;
    previewResult.value = null;
  },
);
</script>

<template>
  <Page auto-content-height title="导航管理">
    <div class="navigation-management-page">
      <Card :bordered="false" class="navigation-management__panel">
        <div class="navigation-management__header">
          <div class="navigation-management__title-row">
            <div class="navigation-management__section-title navigation-management__section-title--primary">
              导航治理
            </div>
            <Tooltip title="统一维护 Entry 目录、角色可见性与默认落点。">
              <span class="navigation-management__help-dot">?</span>
            </Tooltip>
          </div>
        </div>

        <Tabs v-model:active-key="activeTab">
          <Tabs.TabPane key="entries" tab="Entry 目录">
            <div class="space-y-4">
              <div class="navigation-management__pane-header">
                <div class="navigation-management__section-title">
                  Entry 目录
                </div>
                <Button
                  v-access:code="'permission.navigation.entry.create'"
                  v-if="canCreateEntry"
                  type="primary"
                  @click="openEntryDrawer('create')"
                >
                  新建 Entry
                </Button>
              </div>

              <Form layout="vertical" class="navigation-management__filter-shell">
                <Row :gutter="[10, 10]" class="navigation-management__filter-row">
                  <Col :lg="10" :md="24" :xs="24" :xl="11">
                    <Form.Item label="关键词">
                      <Input
                        v-model:value="entryFilters.keyword"
                        allow-clear
                        class="navigation-management__filter-control"
                        placeholder="按 Entry Key 或名称搜索"
                        @press-enter="searchEntries"
                      />
                    </Form.Item>
                  </Col>
                  <Col :lg="4" :md="8" :xs="24" :xl="4">
                    <Form.Item label="终端">
                      <Select
                        v-model:value="entryFilters.terminal"
                        class="navigation-management__filter-control"
                        :options="entryTerminalOptions"
                      />
                    </Form.Item>
                  </Col>
                  <Col :lg="4" :md="8" :xs="24" :xl="4">
                    <Form.Item label="状态">
                      <Select
                        v-model:value="entryFilters.enabled"
                        class="navigation-management__filter-control"
                        :options="entryStatusOptions"
                      />
                    </Form.Item>
                  </Col>
                  <Col
                    :lg="6"
                    :md="8"
                    :xs="24"
                    :xl="5"
                    class="navigation-management__filter-actions-col"
                  >
                    <Form.Item label=" ">
                      <div class="navigation-management__filter-buttons">
                        <Button class="navigation-management__filter-button" type="primary" @click="searchEntries">查询</Button>
                        <Button class="navigation-management__filter-button" @click="resetEntryFilters">重置</Button>
                      </div>
                    </Form.Item>
                  </Col>
                </Row>
              </Form>

              <Table
                row-key="entryKey"
                :columns="entryColumns"
                :data-source="entries"
                :loading="entryLoading"
                :pagination="tablePagination"
                size="middle"
                @change="handleEntryTableChange"
              />
            </div>
          </Tabs.TabPane>

          <Tabs.TabPane key="roles" tab="角色导航">
            <div class="space-y-4">
              <div class="navigation-management__pane-header navigation-management__pane-header--stacked">
                <div>
                  <div class="navigation-management__section-title">角色导航</div>
                  <div class="navigation-management__section-description">
                    这里用于给角色配置两件事：这个角色能看到哪些导航入口，以及这个角色默认落到哪个入口。
                  </div>
                </div>
              </div>

              <Row :gutter="[24, 24]">
                <Col :xl="10" :xs="24">
                  <div class="navigation-management__editor-block">
                    <div class="navigation-management__block-header">
                      <div>
                        <div class="navigation-management__section-title">单角色配置</div>
                        <div class="navigation-management__section-description">
                          先选择一个角色并加载，再分别保存“可见入口列表”和“默认落点规则”。
                        </div>
                      </div>
                      <Tag v-if="roleNavigation?.roleId" color="blue">
                        {{ selectedRoleOption?.role.name || roleNavigation.roleId }}
                      </Tag>
                    </div>

                    <Form layout="vertical">
                      <Form.Item
                        label="选择角色"
                        extra="按角色名称搜索并选择，然后加载当前配置。"
                      >
                        <Select
                          v-model:value="roleForm.roleId"
                          allow-clear
                          show-search
                          :filter-option="false"
                          :loading="roleOptionsLoading"
                          :options="roleOptions"
                          placeholder="搜索角色名称"
                          @change="handleRoleSelectionChange"
                          @focus="loadRoleOptions()"
                          @search="loadRoleOptions"
                        />
                      </Form.Item>
                      <div class="navigation-management__action-row">
                        <Button :loading="roleLoading" type="primary" @click="loadRoleNavigation">
                          加载配置
                        </Button>
                      </div>
                      <div v-if="roleNavigation" class="navigation-management__meta mb-4">
                        <span class="navigation-management__meta-item">
                          Visible {{ loadedVisibilityCount }}
                        </span>
                        <span class="navigation-management__meta-item">
                          Landing {{ loadedLandingPolicyCount }}
                        </span>
                      </div>
                      <template v-if="roleNavigation">
                        <Form.Item
                          label="前端配置"
                          extra="DEFAULT 表示通用配置；其余前端在未单独配置时继承 DEFAULT。"
                        >
                          <Select
                            v-model:value="roleForm.editorTerminal"
                            :options="roleEditorTerminalOptions"
                          />
                        </Form.Item>
                        <div class="navigation-management__entry-list-shell">
                          <div class="navigation-management__entry-list-header">
                            <div>
                              <div class="navigation-management__section-title">
                                可见 Entry
                              </div>
                              <div class="navigation-management__section-description">
                                按优先级排序；勾选可见入口，并在当前可见入口里选择默认落点。
                              </div>
                            </div>
                            <Tag color="blue">{{ roleForm.editorTerminal }}</Tag>
                          </div>
                          <Table
                            row-key="entryKey"
                            :columns="roleEditorColumns"
                            :data-source="roleEditorEntries"
                            :pagination="false"
                            size="small"
                          />
                        </div>
                        <div class="navigation-management__action-row mt-4">
                          <Button
                            v-access:code="'permission.role_instance.update'"
                            v-if="canUpdateRole"
                            :loading="roleSaving"
                            type="primary"
                            @click="saveRoleNavigationConfig"
                          >
                            保存角色导航
                          </Button>
                        </div>
                      </template>
                      <Empty
                        v-else
                        description="选择角色并加载后，在这里配置可见入口与默认落点。"
                      />
                    </Form>
                  </div>
                </Col>

              <Col :xl="14" :xs="24">
                <div class="navigation-management__editor-block">
                  <div class="navigation-management__block-header">
                    <div>
                      <div class="navigation-management__section-title">结果预览</div>
                      <div class="navigation-management__section-description">
                        输入一个或多个角色后，预览在指定终端下最终会显示哪些入口，以及默认进入哪个入口。
                      </div>
                    </div>
                  </div>

                    <Form layout="vertical">
                      <Form.Item
                        label="预览角色"
                        extra="选择要参与解析的角色组合。"
                      >
                        <Select
                          v-model:value="roleForm.previewRoleIds"
                          allow-clear
                          mode="multiple"
                          show-search
                          :filter-option="false"
                          :loading="roleOptionsLoading"
                          :options="roleOptions"
                          placeholder="选择一个或多个角色"
                          @change="handlePreviewRoleSelectionChange"
                          @focus="loadRoleOptions()"
                          @search="loadRoleOptions"
                        />
                      </Form.Item>
                    <Row :gutter="16">
                      <Col :md="8" :xs="24">
                        <Form.Item label="Terminal">
                          <Select
                            v-model:value="roleForm.terminal"
                            :options="managedTerminalOptions"
                          />
                        </Form.Item>
                      </Col>
                      <Col
                        :md="16"
                        :xs="24"
                        class="navigation-management__filter-actions-col"
                      >
                        <Form.Item label=" ">
                          <div class="navigation-management__filter-actions">
                            <Button
                              v-access:code="'permission.navigation.resolve_preview'"
                              v-if="canPreview"
                              :loading="previewLoading"
                              type="primary"
                              @click="runResolverPreview"
                            >
                              运行预览
                            </Button>
                          </div>
                        </Form.Item>
                      </Col>
                    </Row>
                  </Form>

                  <div v-if="previewResult" class="navigation-management__preview-surface">
                    <div class="navigation-management__preview-grid">
                      <div class="navigation-management__preview-item">
                        <div class="navigation-management__preview-label">默认落点</div>
                        <div class="navigation-management__preview-value">
                          {{ previewResult.defaultEntry || '-' }}
                        </div>
                      </div>
                      <div class="navigation-management__preview-item">
                        <div class="navigation-management__preview-label">Visible Entries</div>
                        <div class="navigation-management__preview-value">
                          {{ previewVisibleCount }}
                        </div>
                      </div>
                      <div class="navigation-management__preview-item">
                        <div class="navigation-management__preview-label">解析来源</div>
                        <div class="navigation-management__preview-value">
                          {{
                            previewResult.resolvedByRoleId ||
                            previewResult.fallbackReason ||
                            '-'
                          }}
                        </div>
                      </div>
                    </div>

                    <div class="navigation-management__preview-section">
                      <div class="navigation-management__preview-label">可见 Entry</div>
                      <div
                        v-if="previewEntryRows.length > 0"
                        class="navigation-management__preview-list"
                      >
                        <div class="navigation-management__preview-list-head">
                          <span>默认</span>
                          <span>导航入口</span>
                          <span>优先级</span>
                          <span>终端</span>
                        </div>
                        <div
                          v-for="entry in previewEntryRows"
                          :key="entry.entryKey"
                          class="navigation-management__preview-list-row"
                        >
                          <div class="navigation-management__preview-list-flag">
                            <Tag v-if="entry.isDefault" color="blue">默认</Tag>
                            <span v-else class="navigation-management__preview-list-placeholder">
                              -
                            </span>
                          </div>
                          <div class="navigation-management__preview-list-main">
                            <div class="navigation-management__preview-entry-name">
                              {{ entry.name }}
                            </div>
                            <div class="navigation-management__preview-entry-key">
                              {{ entry.entryKey }}
                            </div>
                          </div>
                          <div class="navigation-management__preview-list-priority">
                            {{
                              entry.registryPriority >= 0
                                ? `Priority ${entry.registryPriority}`
                                : '-'
                            }}
                          </div>
                          <div class="navigation-management__preview-list-terminals">
                            <Tag
                              v-for="terminal in entry.supportedTerminals"
                              :key="`${entry.entryKey}-${terminal}`"
                            >
                              {{ terminal }}
                            </Tag>
                          </div>
                        </div>
                      </div>
                      <div v-else class="navigation-management__empty-hint">
                        {{ previewEmptyHint }}
                      </div>
                    </div>
                  </div>

                  <Empty
                    v-else
                    :description="previewEmptyHint"
                  />
                </div>
              </Col>
              </Row>
            </div>
          </Tabs.TabPane>
        </Tabs>
      </Card>

      <Drawer
        v-model:open="entryDrawerOpen"
        :title="entryFormMode === 'create' ? '新建 Entry' : '编辑 Entry'"
        width="520"
      >
        <Form layout="vertical">
          <Form.Item label="Entry Key">
            <Input v-model:value="entryForm.entryKey" :disabled="entryFormMode === 'edit'" />
          </Form.Item>
          <Form.Item label="名称">
            <Input v-model:value="entryForm.name" />
          </Form.Item>
          <Form.Item label="描述">
            <Input.TextArea v-model:value="entryForm.description" :auto-size="{ minRows: 3 }" />
          </Form.Item>
          <Form.Item label="Feature Key">
            <Input v-model:value="entryForm.featureKey" />
          </Form.Item>
          <Form.Item label="Supported Terminals">
            <Select
              v-model:value="entryForm.supportedTerminals"
              mode="tags"
              :options="managedTerminalOptions"
              :token-separators="[',']"
              placeholder="输入或选择终端编码"
            />
          </Form.Item>
          <Row :gutter="12">
            <Col :span="12">
              <Form.Item label="Priority">
                <InputNumber
                  v-model:value="entryForm.registryPriority"
                  style="width: 100%"
                />
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item label="Entry Type">
                <Input v-model:value="entryForm.entryType" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="启用">
            <Switch v-model:checked="entryForm.enabled" />
          </Form.Item>
        </Form>
        <template #footer>
          <div class="navigation-management__drawer-footer">
            <Space>
              <Button @click="entryDrawerOpen = false">取消</Button>
              <Button :loading="entrySaving" type="primary" @click="submitEntryForm">
                保存
              </Button>
            </Space>
          </div>
        </template>
      </Drawer>
    </div>
  </Page>
</template>

<style scoped>
.navigation-management-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  --navigation-border: hsl(var(--border));
  --navigation-card-bg: hsl(var(--card));
  --navigation-card-bg-soft: hsl(var(--muted) / 0.55);
  --navigation-card-bg-strong: hsl(var(--muted) / 0.82);
  --navigation-title: hsl(var(--foreground));
  --navigation-text: hsl(var(--foreground) / 0.92);
  --navigation-muted: hsl(var(--muted-foreground));
}

.navigation-management__panel :deep(.ant-card-body) {
  padding: 16px;
}

.navigation-management__panel {
  border: 1px solid var(--navigation-border);
  background: var(--navigation-card-bg);
  box-shadow: 0 18px 40px rgb(15 23 42 / 0.05);
}

.navigation-management__header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
}

.navigation-management__title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.navigation-management__section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--navigation-text);
}

.navigation-management__section-title--primary {
  font-size: 18px;
  color: var(--navigation-title);
}

.navigation-management__section-description {
  margin-top: 6px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--navigation-muted);
}

.navigation-management__help-dot {
  display: inline-flex;
  width: 18px;
  height: 18px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--navigation-border);
  border-radius: 999px;
  cursor: help;
  font-size: 11px;
  line-height: 1;
  background: var(--navigation-card-bg-strong);
  color: var(--navigation-muted);
}

.navigation-management__filter-shell,
.navigation-management__editor-block {
  border: 1px solid var(--navigation-border);
  border-radius: 8px;
  background: var(--navigation-card-bg-soft);
}

.navigation-management__filter-row {
  align-items: center;
}

.navigation-management__pane-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.navigation-management__pane-header--stacked {
  align-items: flex-start;
}

.navigation-management__filter-shell {
  padding: 12px;
}

.navigation-management__editor-block {
  padding: 16px;
}

.navigation-management__filter-shell :deep(.ant-form-item) {
  margin-bottom: 0;
}

.navigation-management__filter-control {
  width: 100%;
}

.navigation-management__filter-actions-col,
.navigation-management__drawer-footer {
  display: flex;
  justify-content: flex-end;
}

.navigation-management__action-row {
  display: flex;
  justify-content: flex-end;
  width: 100%;
}

.navigation-management__filter-buttons {
  display: grid;
  grid-template-columns: minmax(84px, 1fr) minmax(84px, 1fr);
  gap: 8px;
  margin-left: auto;
  width: min(100%, 184px);
}

.navigation-management__filter-button {
  min-width: 0;
  width: 100%;
}

.navigation-management__block-header,
.navigation-management__preview-grid {
  display: flex;
  gap: 12px;
}

.navigation-management__block-header {
  align-items: flex-start;
  justify-content: space-between;
}

.navigation-management__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.navigation-management__meta-item {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 12px;
  border: 1px solid var(--navigation-border);
  border-radius: 8px;
  background: var(--navigation-card-bg-strong);
  color: var(--navigation-muted);
  font-size: 12px;
}

.navigation-management__entry-list-shell {
  margin-top: 16px;
  border: 1px solid var(--navigation-border);
  border-radius: 8px;
  background: var(--navigation-card-bg);
  overflow: hidden;
}

.navigation-management__entry-list-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px 0;
}

.navigation-management__code-editor :deep(textarea) {
  font-family:
    ui-monospace, SFMono-Regular, SFMono-Regular, Menlo, Monaco, Consolas,
    Liberation Mono, Courier New, monospace;
  font-size: 12px;
  line-height: 1.7;
}

.navigation-management__preview-surface {
  margin-top: 16px;
  border: 1px solid var(--navigation-border);
  border-radius: 8px;
  background: var(--navigation-card-bg-strong);
  padding: 16px;
}

.navigation-management__preview-grid {
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.navigation-management__preview-item {
  flex: 1 1 180px;
  min-width: 0;
  border: 1px solid var(--navigation-border);
  border-radius: 8px;
  background: var(--navigation-card-bg);
  padding: 12px;
}

.navigation-management__preview-label {
  margin-bottom: 6px;
  font-size: 12px;
  color: var(--navigation-muted);
}

.navigation-management__preview-value {
  word-break: break-word;
  font-size: 14px;
  font-weight: 600;
  color: var(--navigation-title);
}

.navigation-management__preview-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.navigation-management__preview-list {
  border: 1px solid var(--navigation-border);
  border-radius: 8px;
  background: var(--navigation-card-bg);
  overflow: hidden;
}

.navigation-management__preview-list-head,
.navigation-management__preview-list-row {
  display: grid;
  grid-template-columns: 72px minmax(0, 1.8fr) 120px minmax(0, 1fr);
  gap: 12px;
  padding: 12px 14px;
}

.navigation-management__preview-list-head {
  align-items: center;
  background: var(--navigation-card-bg-strong);
  color: var(--navigation-muted);
  font-size: 12px;
  line-height: 18px;
}

.navigation-management__preview-list-row + .navigation-management__preview-list-row {
  border-top: 1px solid var(--navigation-border);
}

.navigation-management__preview-list-row {
  align-items: flex-start;
}

.navigation-management__preview-list-flag {
  display: flex;
  align-items: center;
  min-height: 22px;
}

.navigation-management__preview-list-placeholder {
  color: var(--navigation-muted);
  font-size: 12px;
}

.navigation-management__preview-list-main {
  min-width: 0;
}

.navigation-management__preview-entry-name {
  color: var(--navigation-title);
  font-size: 13px;
  font-weight: 600;
  line-height: 20px;
}

.navigation-management__preview-entry-key {
  color: var(--navigation-muted);
  font-size: 12px;
  line-height: 18px;
  margin-top: 2px;
  word-break: break-word;
}

.navigation-management__preview-list-priority {
  color: var(--navigation-title);
  font-size: 12px;
  line-height: 18px;
  white-space: nowrap;
}

.navigation-management__preview-list-terminals {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.navigation-management__empty-hint {
  font-size: 13px;
  color: var(--navigation-muted);
}

:deep(.navigation-management__panel .ant-table),
:deep(.navigation-management__panel .ant-table-container) {
  background: transparent;
}

.navigation-management__entry-list-shell :deep(.ant-table-thead > tr > th),
.navigation-management__entry-list-shell :deep(.ant-table-tbody > tr > td) {
  vertical-align: middle;
}

:deep(.navigation-management__panel .ant-table-thead > tr > th) {
  background: var(--navigation-card-bg-strong);
  color: var(--navigation-text);
}

:deep(.navigation-management__filter-shell .ant-input),
:deep(.navigation-management__filter-shell .ant-input-affix-wrapper),
:deep(.navigation-management__filter-shell .ant-select-selector),
:deep(.navigation-management__editor-block .ant-input),
:deep(.navigation-management__editor-block .ant-input-affix-wrapper),
:deep(.navigation-management__editor-block .ant-select-selector) {
  background: hsl(var(--input-background));
  border-color: hsl(var(--input));
  color: var(--navigation-text);
}

:deep(.navigation-management__filter-shell .ant-input),
:deep(.navigation-management__filter-shell .ant-input-affix-wrapper),
:deep(.navigation-management__filter-shell .ant-select-selector) {
  min-height: 36px;
  border-radius: 10px;
}

:deep(.navigation-management__filter-shell .ant-select-selector) {
  align-items: center;
  display: flex;
}

:deep(.navigation-management__filter-shell .ant-input-affix-wrapper) {
  padding-top: 0;
  padding-bottom: 0;
}

:deep(.navigation-management__filter-shell .ant-btn) {
  height: 36px;
  border-radius: 10px;
}

@media (max-width: 768px) {
  .navigation-management__header,
  .navigation-management__block-header,
  .navigation-management__pane-header {
    flex-direction: column;
  }

  .navigation-management__filter-actions-col {
    justify-content: flex-end;
  }

  .navigation-management__drawer-footer {
    justify-content: flex-start;
  }

  .navigation-management__filter-buttons {
    width: min(100%, 184px);
  }

  .navigation-management__preview-list-head {
    display: none;
  }

  .navigation-management__preview-list-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}
</style>
