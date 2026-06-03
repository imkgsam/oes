<script lang="ts" setup>
import type { PermissionManagementApi, RoleManagementApi } from '#/api';
import type { TableColumnsType } from 'ant-design-vue';

import { computed, h, onBeforeUnmount, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import {
  Button,
  Card,
  Checkbox,
  Col,
  Drawer,
  Dropdown,
  Form,
  Input,
  Menu,
  Modal,
  Radio,
  Row,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  message,
  Tooltip,
} from 'ant-design-vue';

import {
  assignRolePermissionApi,
  assignRoleTemplatePermissionApi,
  createRoleApi,
  createRoleTemplateApi,
  deleteRoleApi,
  deleteRoleTemplateApi,
  getRoleNavigationApi,
  getRoleByIdApi,
  getRoleTerminalAccessApi,
  getRoleTemplateByIdApi,
  instantiateRoleTemplateApi,
  listNavigationEntriesApi,
  listPermissionsApi,
  listRolePermissionsApi,
  listRoleTenantOptionsApi,
  listRolesApi,
  listRoleTemplatePermissionsApi,
  listRoleTemplatesApi,
  revokeRolePermissionApi,
  revokeRoleTemplatePermissionApi,
  setRoleEnabledApi,
  setRoleLandingPoliciesApi,
  setRoleNavigationVisibilityApi,
  setRoleTerminalAccessApi,
  syncRoleNavigationFromTemplateApi,
  setRoleTemplateEnabledApi,
  updateRoleApi,
  updateRoleTemplateApi,
} from '#/api';
import { useAuthStore } from '#/store';
import { useAuthContextStore } from '#/store/auth-context';
import {
  buildPermissionModuleSelectOptions,
  collectPermissionModuleOptions,
} from './permission-management.helpers';
import {
  buildActiveRoleTemplateSelectOptions,
  buildVisibilityPayloadFromEditor,
  buildLandingPoliciesFromEditor,
  buildRoleTablePagination,
  deriveLandingEditorState,
  deriveVisibilityEditorState,
  getRoleKindLabel,
  getRoleScopeLabel,
  groupNavigationEntriesByFeature,
  isRoleCodeFormatValid,
  validateNavigationEditorState,
} from './role-management.helpers';

type ActiveTabKey = 'instances' | 'templates';
type CreateRoleMenuKey = 'instantiate' | 'role';
type PermissionOwnerType = 'role' | 'template';
type PermissionColumnKey = 'assigned' | 'code' | 'description' | 'module';
type RoleOwnerPermissionAction =
  | 'assign_permissions'
  | 'delete'
  | 'get_by_id'
  | 'update';
type RoleActionKey =
  | 'delete'
  | 'edit'
  | 'navigation'
  | 'permissions'
  | 'terminalAccess'
  | 'toggle';
type RoleColumnKey =
  | 'actions'
  | 'code'
  | 'isEnabled'
  | 'name'
  | 'roleKind'
  | 'scope'
  | 'templateRoleName'
  | 'tenantName';
type RoleTerminal = 'KIOSK' | 'PDA' | 'WEB';

interface TableActionMenuItem<ActionKey extends string = string> {
  danger?: boolean;
  disabled?: boolean;
  hidden?: boolean;
  key: ActionKey;
  label: string;
  testId?: string;
}
type TemplateActionKey =
  | 'delete'
  | 'edit'
  | 'instantiate'
  | 'navigation'
  | 'permissions'
  | 'terminalAccess'
  | 'toggle';

interface InstanceFilterState {
  keyword: string;
  scopeLevel: '' | 'SYSTEM' | 'TENANT';
  tenantId: string;
}

interface TemplateFilterState {
  keyword: string;
}

interface RoleCreateFormState {
  code: string;
  description: string;
  name: string;
  scopeLevel: 'SYSTEM' | 'TENANT';
  tenantId: string;
}

interface RoleTemplateCreateFormState {
  code: string;
  description: string;
  name: string;
}

interface RoleEditFormState {
  description: string;
  name: string;
}

interface InstantiateFormState {
  code: string;
  description: string;
  name: string;
  tenantId: string;
}

interface PermissionFilterState {
  keyword: string;
  module: string;
}

interface NavigationVisibilityOverrideState {
  entryKeys: string[];
  terminal: string;
}

interface NavigationLandingOverrideState {
  defaultEntryKey: string;
  terminal: string;
}

const authContextStore = useAuthContextStore();
const operationColumnTitle = '操作';
const authStore = useAuthStore();
const DEFAULT_NAVIGATION_TAB_KEY = 'DEFAULT';

const activeTab = ref<ActiveTabKey>('instances');
const instancesLoading = ref(false);
const templatesLoading = ref(false);
const roleSaving = ref(false);
const templateSaving = ref(false);
const editSaving = ref(false);
const instantiateSaving = ref(false);
const navigationLoading = ref(false);
const navigationSaving = ref(false);
const navigationEntryLoading = ref(false);
const permissionLoading = ref(false);
const permissionMutating = ref(false);
const terminalAccessLoading = ref(false);
const terminalAccessSaving = ref(false);
const tenantOptionsLoading = ref(false);
const createRoleModalOpen = ref(false);
const createTemplateModalOpen = ref(false);
const editDrawerOpen = ref(false);
const instantiateModalOpen = ref(false);
const navigationDrawerOpen = ref(false);
const permissionDrawerOpen = ref(false);
const terminalAccessDrawerOpen = ref(false);
const instantiateTemplateId = ref('');
const editTargetType = ref<PermissionOwnerType>('role');
const permissionOwnerType = ref<PermissionOwnerType>('role');
const navigationOwnerType = ref<PermissionOwnerType>('role');
const moduleSearch = ref('');

const instances = ref<RoleManagementApi.Role[]>([]);
const templates = ref<RoleManagementApi.Role[]>([]);
const selectedRole = ref<RoleManagementApi.Role | null>(null);
const navigationRole = ref<RoleManagementApi.Role | null>(null);
const instantiateTemplate = ref<RoleManagementApi.Role | null>(null);
const assignedPermissions = ref<RoleManagementApi.Permission[]>([]);
const availablePermissions = ref<PermissionManagementApi.Permission[]>([]);
const roleNavigationConfig = ref<PermissionManagementApi.RoleNavigationConfig | null>(null);
const navigationEntries = ref<PermissionManagementApi.NavigationEntry[]>([]);
const navigationVisibilityBaseEntryKeys = ref<string[]>([]);
const navigationVisibilityOverrides = ref<NavigationVisibilityOverrideState[]>([]);
const navigationLandingBaseEntryKey = ref('');
const navigationLandingOverrides = ref<NavigationLandingOverrideState[]>([]);
const navigationOverrideActiveTab = ref('');
const terminalAccessRole = ref<RoleManagementApi.Role | null>(null);
const roleTerminalAccessValues = ref<RoleTerminal[]>([]);
const moduleOptions = ref<{ label: string; value: string }[]>([]);
const tenantOptions = ref<RoleManagementApi.TenantOption[]>([]);
let tenantOptionSearchTimer: ReturnType<typeof setTimeout> | null = null;
let activePermissionColumnCleanup: null | (() => void) = null;
let activeRoleColumnCleanup: null | (() => void) = null;

const instanceFilters = reactive<InstanceFilterState>({
  keyword: '',
  scopeLevel: '',
  tenantId: '',
});
const templateFilters = reactive<TemplateFilterState>({
  keyword: '',
});
const permissionFilters = reactive<PermissionFilterState>({
  keyword: '',
  module: '',
});
const permissionColumnMinWidths: Record<PermissionColumnKey, number> = {
  assigned: 72,
  code: 220,
  description: 220,
  module: 160,
};
const permissionColumnWidths = reactive<Record<PermissionColumnKey, number>>({
  assigned: 88,
  code: 360,
  description: 380,
  module: 220,
});
const roleColumnMinWidths: Record<RoleColumnKey, number> = {
  actions: 72,
  code: 220,
  isEnabled: 88,
  name: 120,
  roleKind: 100,
  scope: 96,
  templateRoleName: 120,
  tenantName: 150,
};
const roleColumnWidths = reactive<Record<RoleColumnKey, number>>({
  actions: 72,
  code: 330,
  isEnabled: 96,
  name: 140,
  roleKind: 112,
  scope: 120,
  templateRoleName: 150,
  tenantName: 190,
});

const instancePagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
});
const templatePagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
});
const permissionPagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
});

const roleCreateForm = reactive<RoleCreateFormState>({
  code: '',
  description: '',
  name: '',
  scopeLevel: 'SYSTEM',
  tenantId: '',
});
const templateCreateForm = reactive<RoleTemplateCreateFormState>({
  code: '',
  description: '',
  name: '',
});
const roleEditForm = reactive<RoleEditFormState>({
  description: '',
  name: '',
});
const instantiateForm = reactive<InstantiateFormState>({
  code: '',
  description: '',
  name: '',
  tenantId: '',
});

// Checks the current session action summary against one permission action code.
function hasActionCode(code: string) {
  return authContextStore.actionCodes.includes(code);
}

const roleOwnerPermissionPrefixes: Record<PermissionOwnerType, string> = {
  role: 'permission.role_instance',
  template: 'permission.role_template',
};

// Resolves owner-specific role permission checks for split instance/template action codes.
function hasRoleOwnerAction(
  ownerType: PermissionOwnerType,
  action: RoleOwnerPermissionAction,
) {
  return hasActionCode(`${roleOwnerPermissionPrefixes[ownerType]}.${action}`);
}

function canReadRoleOwner(ownerType: PermissionOwnerType) {
  return hasRoleOwnerAction(ownerType, 'get_by_id');
}

function canUpdateRoleOwner(ownerType: PermissionOwnerType) {
  return hasRoleOwnerAction(ownerType, 'update');
}

function canDeleteRoleOwner(ownerType: PermissionOwnerType) {
  return hasRoleOwnerAction(ownerType, 'delete');
}

function canAssignRoleOwnerPermissions(ownerType: PermissionOwnerType) {
  return hasRoleOwnerAction(ownerType, 'assign_permissions');
}

const canCreateRoleInstance = computed(() =>
  hasActionCode('permission.role_instance.create'),
);
const canCreateRoleFromTemplate = computed(() =>
  hasActionCode('permission.role_instance.create_from_template'),
);
const canCreateRoleTemplate = computed(() =>
  hasActionCode('permission.role_template.create'),
);
const canCreateRole = computed(
  () => canCreateRoleInstance.value || canCreateRoleFromTemplate.value,
);
const canListRoleInstances = computed(() =>
  hasActionCode('permission.role_instance.list'),
);
const canListRoleTemplates = computed(() =>
  hasActionCode('permission.role_template.list'),
);
const canAssignSelectedRolePermissions = computed(() =>
  canAssignRoleOwnerPermissions(permissionOwnerType.value),
);
const canUpdateNavigationOwner = computed(() =>
  canUpdateRoleOwner(navigationOwnerType.value),
);
const canSyncRoleInstanceFromTemplate = computed(() =>
  hasActionCode('permission.role_instance.sync_from_template'),
);
const canViewTerminalAccess = computed(() =>
  hasActionCode('permission.terminal_access.view'),
);
const canManageRoleTerminalAccess = computed(() =>
  hasActionCode('permission.terminal_access.role.manage'),
);
const terminalAccessSubtitle = computed(() =>
  terminalAccessRole.value?.roleKind === 'SYSTEM_TEMPLATE'
    ? '选择模板默认开放的登录终端。'
    : '选择该角色允许登录的终端。',
);
const terminalAccessSelectedSummary = computed(() =>
  roleTerminalAccessValues.value.length > 0
    ? `已允许 ${roleTerminalAccessValues.value.length} 个终端`
    : '未开放终端',
);
const isPlatformScope = computed(() => authContextStore.isPlatformScope);
const showTemplateTab = computed(() => isPlatformScope.value);
const currentTenantId = computed(
  () => authContextStore.sessionContext?.tenant?.tenantId ?? '',
);
const currentTenantLabel = computed(
  () => authContextStore.tenantName || currentTenantId.value || '-',
);
const templateSelectOptions = computed(() =>
  buildActiveRoleTemplateSelectOptions(templates.value),
);
const tenantSelectOptions = computed(() =>
  tenantOptions.value.map((tenant) => ({
    label: `${tenant.name} (${tenant.code})`,
    value: tenant.id,
  })),
);
const tenantFilterSelectOptions = computed(() => [
  { label: '全部租户', value: '' },
  ...tenantSelectOptions.value,
]);
const assignedPermissionIds = computed(
  () => new Set(assignedPermissions.value.map((permission) => permission.id)),
);
const permissionFilterModuleOptions = computed(() =>
  buildPermissionModuleSelectOptions(
    moduleOptions.value,
    moduleSearch.value || permissionFilters.module,
  ),
);
const navigationTerminalOptions = [
  { label: 'WEB', value: 'WEB' },
  { label: 'MOBILE', value: 'MOBILE' },
];
const terminalAccessOptions: Array<{ label: string; value: RoleTerminal }> = [
  { label: 'WEB', value: 'WEB' },
  { label: 'PDA', value: 'PDA' },
  { label: 'KIOSK', value: 'KIOSK' },
];
const terminalAccessOptionMeta: Record<
  RoleTerminal,
  { description: string; icon: string }
> = {
  KIOSK: {
    description: '面向固定工位、自助机或门店终端的受控登录入口。',
    icon: 'ant-design:tablet-outlined',
  },
  PDA: {
    description: '面向仓储、扫码、现场作业等手持终端登录。',
    icon: 'ant-design:scan-outlined',
  },
  WEB: {
    description: '面向浏览器工作台和管理后台访问。',
    icon: 'ant-design:desktop-outlined',
  },
};
const navigationEntriesByKey = computed(
  () => new Map(navigationEntries.value.map((entry) => [entry.entryKey, entry])),
);
const baseVisibilityGroups = computed(() =>
  resolveNavigationEntryGroups(),
);
const activeNavigationTerminals = computed(() => {
  const knownTerminalOrder = navigationTerminalOptions.map((option) => option.value);
  const terminalSet = new Set<string>();

  for (const entry of navigationEntries.value) {
    for (const terminal of entry.supportedTerminals) {
      terminalSet.add(terminal);
    }
  }

  const terminals = [...terminalSet].filter((terminal) =>
    knownTerminalOrder.includes(terminal),
  );

  return terminals.length > 0 ? terminals : ['WEB'];
});
const defaultNavigationTerminal = computed(() => DEFAULT_NAVIGATION_TAB_KEY);
const overrideNavigationTerminals = computed(() =>
  activeNavigationTerminals.value.length > 1 ? activeNavigationTerminals.value : [],
);
const navigationConfigTabs = computed(() => [
  defaultNavigationTerminal.value,
  ...overrideNavigationTerminals.value,
]);
const configuredOverrideTerminalCount = computed(() => {
  const terminalSet = new Set<string>();

  for (const override of navigationVisibilityOverrides.value) {
    terminalSet.add(override.terminal);
  }

  for (const override of navigationLandingOverrides.value) {
    terminalSet.add(override.terminal);
  }

  return terminalSet.size;
});
const navigationOverrideSummary = computed(() =>
  configuredOverrideTerminalCount.value > 0
    ? `已配置 ${configuredOverrideTerminalCount.value} 个前端差异`
    : '当前未配置前端差异',
);
const activeNavigationTabSummary = computed(() => {
  const tabKey = navigationOverrideActiveTab.value || defaultNavigationTerminal.value;

  if (tabKey === defaultNavigationTerminal.value) {
    return '共享默认配置';
  }

  return hasNavigationOverride(tabKey) ? '当前前端已单独配置' : '当前继承默认配置';
});
const navigationTemplateSourceName = computed(
  () => navigationRole.value?.templateRoleName || navigationRole.value?.templateRoleId || '',
);
const navigationRoleIsTemplate = computed(
  () => navigationRole.value?.roleKind === 'SYSTEM_TEMPLATE',
);
const canSyncNavigationFromTemplate = computed(
  () =>
    !navigationRoleIsTemplate.value &&
    Boolean(navigationRole.value?.templateRoleId) &&
    canSyncRoleInstanceFromTemplate.value,
);
const navigationInstanceTemplateLabel = computed(
  () => navigationTemplateSourceName.value || '未绑定模板',
);
const instanceTablePagination = computed(() =>
  buildRoleTablePagination({
    current: instancePagination.current,
    pageSize: instancePagination.pageSize,
    total: instancePagination.total,
  }),
);
const roleTableScrollX = computed(() =>
  Object.values(roleColumnWidths).reduce((total, width) => total + width, 0),
);
const permissionTableScrollX = computed(() =>
  Object.values(permissionColumnWidths).reduce((total, width) => total + width, 0),
);
const templateTablePagination = computed(() =>
  buildRoleTablePagination({
    current: templatePagination.current,
    pageSize: templatePagination.pageSize,
    total: templatePagination.total,
  }),
);
const permissionTablePagination = computed(() =>
  buildRoleTablePagination({
    current: permissionPagination.current,
    pageSize: permissionPagination.pageSize,
    total: permissionPagination.total,
  }),
);

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

// Refreshes the current operator menu state after role navigation changes take effect.
async function refreshCurrentSessionNavigation() {
  try {
    await authStore.refreshCurrentSessionAccess();
  } catch (error) {
    message.warning(
      getErrorMessage(error, '配置已保存，但当前会话导航未能自动刷新，请手动刷新页面。'),
    );
  }
}

// Refreshes the current operator access summary after role-level permission changes may alter visible actions.
async function refreshCurrentSessionPermissions() {
  try {
    await authStore.refreshCurrentSessionAccess();
  } catch (error) {
    message.warning(
      getErrorMessage(error, '权限已保存，但当前会话权限未能自动刷新，请手动刷新页面。'),
    );
  }
}

function resetRoleCreateForm() {
  roleCreateForm.code = '';
  roleCreateForm.description = '';
  roleCreateForm.name = '';
  roleCreateForm.scopeLevel = isPlatformScope.value ? 'SYSTEM' : 'TENANT';
  roleCreateForm.tenantId = isPlatformScope.value ? '' : currentTenantId.value;
}

function resetTemplateCreateForm() {
  templateCreateForm.code = '';
  templateCreateForm.description = '';
  templateCreateForm.name = '';
}

function resetEditForm(role?: RoleManagementApi.Role | null) {
  roleEditForm.description = role?.description ?? '';
  roleEditForm.name = role?.name ?? '';
}

function resetInstantiateForm(template?: RoleManagementApi.Role | null) {
  instantiateTemplate.value = template ?? null;
  instantiateTemplateId.value = template?.id ?? '';
  instantiateForm.code = template?.code ?? '';
  instantiateForm.description = template?.description ?? '';
  instantiateForm.name = template ? `${template.name}` : '';
  instantiateForm.tenantId = isPlatformScope.value ? '' : currentTenantId.value;
}

function mapVisibilityRows(
  config: PermissionManagementApi.RoleNavigationConfig | null,
) {
  const editorState = deriveVisibilityEditorState({
    supportedTerminals: activeNavigationTerminals.value,
    visibility: config?.visibility ?? [],
  });

  navigationVisibilityBaseEntryKeys.value = editorState.baseEntryKeys;
  navigationVisibilityOverrides.value = editorState.overrides;
}

function mapLandingRows(
  config: PermissionManagementApi.RoleNavigationConfig | null,
) {
  const editorState = deriveLandingEditorState({
    landingPolicies: config?.landingPolicies ?? [],
    supportedTerminals: activeNavigationTerminals.value,
  });

  navigationLandingBaseEntryKey.value = editorState.baseEntryKey;
  navigationLandingOverrides.value = editorState.overrides;
}

function resolveNavigationEntryGroups(terminal?: string) {
  const sourceEntries = terminal
    ? navigationEntries.value.filter((entry) => entry.supportedTerminals.includes(terminal))
    : navigationEntries.value;

  return groupNavigationEntriesByFeature(sourceEntries).map((group) => ({
    ...group,
    entries: group.entries
      .map((entryKey) => navigationEntriesByKey.value.get(entryKey))
      .filter(
        (entry): entry is PermissionManagementApi.NavigationEntry => Boolean(entry),
      ),
  }));
}

function getVisibilityEntryKeysForTab(tabKey: string) {
  if (tabKey === defaultNavigationTerminal.value) {
    return navigationVisibilityBaseEntryKeys.value;
  }

  return (
    navigationVisibilityOverrides.value.find((override) => override.terminal === tabKey)
      ?.entryKeys ?? navigationVisibilityBaseEntryKeys.value
  );
}

function setVisibilityEntryKeysForTab(tabKey: string, entryKeys: string[]) {
  const normalizedEntryKeys = [...new Set(entryKeys)].sort();

  if (tabKey === defaultNavigationTerminal.value) {
    navigationVisibilityBaseEntryKeys.value = normalizedEntryKeys;
    return;
  }

  if (
    normalizedEntryKeys.length === 0 ||
    normalizedEntryKeys.join('|') === navigationVisibilityBaseEntryKeys.value.join('|')
  ) {
    navigationVisibilityOverrides.value = navigationVisibilityOverrides.value.filter(
      (override) => override.terminal !== tabKey,
    );
    return;
  }

  const existingOverride = navigationVisibilityOverrides.value.find(
    (override) => override.terminal === tabKey,
  );

  if (existingOverride) {
    navigationVisibilityOverrides.value = navigationVisibilityOverrides.value.map((override) =>
      override.terminal === tabKey
        ? {
            ...override,
            entryKeys: normalizedEntryKeys,
          }
        : override,
    );
    return;
  }

  navigationVisibilityOverrides.value = [
    ...navigationVisibilityOverrides.value,
    {
      entryKeys: normalizedEntryKeys,
      terminal: tabKey,
    },
  ];
}

function toggleNavigationEntryVisibility(
  tabKey: string,
  entryKey: string,
  checked: boolean,
) {
  const currentEntryKeys = getVisibilityEntryKeysForTab(tabKey);
  const nextEntryKeys = checked
    ? [...currentEntryKeys, entryKey]
    : currentEntryKeys.filter((item) => item !== entryKey);

  setVisibilityEntryKeysForTab(tabKey, nextEntryKeys);

  if (!checked && getLandingEntryForTab(tabKey) === entryKey) {
    setLandingEntryForTab(tabKey, '');
  }
}

function getLandingEntryForTab(tabKey: string) {
  if (tabKey === defaultNavigationTerminal.value) {
    return navigationLandingBaseEntryKey.value;
  }

  return (
    navigationLandingOverrides.value.find((override) => override.terminal === tabKey)
      ?.defaultEntryKey ?? navigationLandingBaseEntryKey.value
  );
}

function setLandingEntryForTab(tabKey: string, entryKey: string) {
  if (tabKey === defaultNavigationTerminal.value) {
    navigationLandingBaseEntryKey.value = entryKey;
    return;
  }

  if (!entryKey || entryKey === navigationLandingBaseEntryKey.value) {
    navigationLandingOverrides.value = navigationLandingOverrides.value.filter(
      (override) => override.terminal !== tabKey,
    );
    return;
  }

  const existingOverride = navigationLandingOverrides.value.find(
    (override) => override.terminal === tabKey,
  );

  if (existingOverride) {
    navigationLandingOverrides.value = navigationLandingOverrides.value.map((override) =>
      override.terminal === tabKey
        ? {
            ...override,
            defaultEntryKey: entryKey,
          }
        : override,
    );
    return;
  }

  navigationLandingOverrides.value = [
    ...navigationLandingOverrides.value,
    {
      defaultEntryKey: entryKey,
      terminal: tabKey,
    },
  ];
}

function selectNavigationLandingEntry(tabKey: string, entryKey: string) {
  setLandingEntryForTab(tabKey, entryKey);
}

function hasVisibilityOverride(terminal: string) {
  return navigationVisibilityOverrides.value.some((override) => override.terminal === terminal);
}

function hasLandingOverride(terminal: string) {
  return navigationLandingOverrides.value.some((override) => override.terminal === terminal);
}

function hasNavigationOverride(terminal: string) {
  return hasVisibilityOverride(terminal) || hasLandingOverride(terminal);
}

function restoreNavigationOverride(terminal: string) {
  navigationVisibilityOverrides.value = navigationVisibilityOverrides.value.filter(
    (override) => override.terminal !== terminal,
  );
  navigationLandingOverrides.value = navigationLandingOverrides.value.filter(
    (override) => override.terminal !== terminal,
  );
}

function getNavigationTabGroups(tabKey: string) {
  return tabKey === defaultNavigationTerminal.value
    ? baseVisibilityGroups.value
    : resolveNavigationEntryGroups(tabKey);
}

async function loadTenantOptions(keyword?: string) {
  if (!isPlatformScope.value) {
    tenantOptions.value = [];
    return;
  }

  tenantOptionsLoading.value = true;

  try {
    const result = await listRoleTenantOptionsApi({
      keyword: keyword?.trim() || undefined,
      pageSize: 20,
    });
    tenantOptions.value = result.tenants ?? [];
  } catch (error) {
    tenantOptions.value = [];
    message.error(getErrorMessage(error, '加载租户选项失败，请稍后重试'));
  } finally {
    tenantOptionsLoading.value = false;
  }
}

function scheduleTenantOptionSearch(keyword?: string) {
  if (tenantOptionSearchTimer) {
    clearTimeout(tenantOptionSearchTimer);
  }

  tenantOptionSearchTimer = setTimeout(() => {
    void loadTenantOptions(keyword);
  }, 200);
}

function validateRoleCreateForm() {
  if (!roleCreateForm.name.trim()) {
    message.warning('请填写角色名称');
    return false;
  }

  if (!roleCreateForm.code.trim()) {
    message.warning('请填写角色编码');
    return false;
  }

  if (!isRoleCodeFormatValid(roleCreateForm.code)) {
    message.warning('角色编码需以字母开头，只能包含字母、数字、点号、下划线和连字符');
    return false;
  }

  if (
    roleCreateForm.scopeLevel === 'TENANT' &&
    !roleCreateForm.tenantId.trim()
  ) {
    message.warning('请选择租户');
    return false;
  }

  return true;
}

function validateTemplateCreateForm() {
  if (!templateCreateForm.name.trim()) {
    message.warning('请填写模板名称');
    return false;
  }

  if (!templateCreateForm.code.trim()) {
    message.warning('请填写模板编码');
    return false;
  }

  if (!isRoleCodeFormatValid(templateCreateForm.code)) {
    message.warning('模板编码需以字母开头，只能包含字母、数字、点号、下划线和连字符');
    return false;
  }

  return true;
}

function validateEditForm() {
  if (!roleEditForm.name.trim()) {
    message.warning('请填写名称');
    return false;
  }

  return true;
}

function validateInstantiateForm() {
  if (!instantiateTemplate.value) {
    message.warning('请选择模板');
    return false;
  }

  if (!instantiateForm.tenantId.trim()) {
    message.warning('请选择目标租户');
    return false;
  }

  if (
    instantiateForm.code.trim() &&
    !isRoleCodeFormatValid(instantiateForm.code)
  ) {
    message.warning('角色编码需以字母开头，只能包含字母、数字、点号、下划线和连字符');
    return false;
  }

  return true;
}

async function loadInstances(options?: { page?: number }) {
  if (!canListRoleInstances.value) {
    instances.value = [];
    instancePagination.total = 0;
    return;
  }

  instancesLoading.value = true;

  try {
    const result = await listRolesApi({
      keyword: instanceFilters.keyword.trim() || undefined,
      page: options?.page ?? instancePagination.current,
      pageSize: instancePagination.pageSize,
      scopeLevel: isPlatformScope.value
        ? instanceFilters.scopeLevel || undefined
        : 'TENANT',
      tenantId: isPlatformScope.value
        ? instanceFilters.tenantId.trim() || undefined
        : currentTenantId.value || undefined,
    });

    instances.value = result.roles ?? [];
    instancePagination.current =
      result.page || options?.page || instancePagination.current;
    instancePagination.pageSize =
      result.pageSize || instancePagination.pageSize;
    instancePagination.total = result.total || 0;
  } catch (error) {
    instances.value = [];
    instancePagination.total = 0;
    message.error(getErrorMessage(error, '加载角色实例失败，请稍后重试'));
  } finally {
    instancesLoading.value = false;
  }
}

async function loadTemplates(options?: { page?: number }) {
  if (!canListRoleTemplates.value) {
    templates.value = [];
    templatePagination.total = 0;
    return;
  }

  templatesLoading.value = true;

  try {
    const result = await listRoleTemplatesApi({
      keyword: templateFilters.keyword.trim() || undefined,
      page: options?.page ?? templatePagination.current,
      pageSize: templatePagination.pageSize,
    });

    templates.value = result.roles ?? [];
    templatePagination.current =
      result.page || options?.page || templatePagination.current;
    templatePagination.pageSize =
      result.pageSize || templatePagination.pageSize;
    templatePagination.total = result.total || 0;
  } catch (error) {
    templates.value = [];
    templatePagination.total = 0;
    message.error(getErrorMessage(error, '加载角色模板失败，请稍后重试'));
  } finally {
    templatesLoading.value = false;
  }
}

async function loadPermissionModuleOptions() {
  try {
    moduleOptions.value = await collectPermissionModuleOptions(
      ({ page, pageSize }) =>
        listPermissionsApi({
          page,
          pageSize,
        }),
      permissionFilters.module,
    );
  } catch {
    moduleOptions.value = [];
  }
}

async function loadNavigationEntryOptions() {
  navigationEntryLoading.value = true;

  try {
    const result = await listNavigationEntriesApi({
      enabled: true,
      page: 1,
      pageSize: 200,
    });
    navigationEntries.value = result.entries ?? [];
  } catch (error) {
    navigationEntries.value = [];
    message.error(getErrorMessage(error, '加载导航入口失败，请稍后重试'));
  } finally {
    navigationEntryLoading.value = false;
  }
}

async function loadAvailablePermissions(options?: { page?: number }) {
  if (!permissionDrawerOpen.value) {
    return;
  }

  permissionLoading.value = true;

  try {
    const result = await listPermissionsApi({
      keyword: permissionFilters.keyword.trim() || undefined,
      module: permissionFilters.module.trim() || undefined,
      page: options?.page ?? permissionPagination.current,
      pageSize: permissionPagination.pageSize,
    });

    availablePermissions.value = result.permissions ?? [];
    permissionPagination.current =
      result.page || options?.page || permissionPagination.current;
    permissionPagination.pageSize =
      result.pageSize || permissionPagination.pageSize;
    permissionPagination.total = result.total || 0;
  } catch (error) {
    availablePermissions.value = [];
    permissionPagination.total = 0;
    message.error(getErrorMessage(error, '加载权限目录失败，请稍后重试'));
  } finally {
    permissionLoading.value = false;
  }
}

async function loadAssignedPermissions() {
  if (!selectedRole.value) {
    assignedPermissions.value = [];
    return;
  }

  permissionLoading.value = true;

  try {
    const result =
      permissionOwnerType.value === 'role'
        ? await listRolePermissionsApi(selectedRole.value.id)
        : await listRoleTemplatePermissionsApi(selectedRole.value.id);

    assignedPermissions.value = result.permissions ?? [];
  } catch (error) {
    assignedPermissions.value = [];
    message.error(getErrorMessage(error, '加载角色权限失败，请稍后重试'));
  } finally {
    permissionLoading.value = false;
  }
}

async function reloadPermissionDrawerData(options?: { page?: number }) {
  await Promise.all([
    loadAssignedPermissions(),
    loadAvailablePermissions(options),
  ]);
}

async function searchInstances() {
  instancePagination.current = 1;
  await loadInstances({ page: 1 });
}

async function resetInstanceFilters() {
  instanceFilters.keyword = '';
  instanceFilters.scopeLevel = isPlatformScope.value ? '' : 'TENANT';
  instanceFilters.tenantId = isPlatformScope.value ? '' : currentTenantId.value;
  await searchInstances();
}

async function searchTemplates() {
  templatePagination.current = 1;
  await loadTemplates({ page: 1 });
}

async function resetTemplateFilters() {
  templateFilters.keyword = '';
  await searchTemplates();
}

async function searchPermissions() {
  permissionPagination.current = 1;
  await loadAvailablePermissions({ page: 1 });
}

async function resetPermissionFilters() {
  permissionFilters.keyword = '';
  permissionFilters.module = '';
  moduleSearch.value = '';
  await loadPermissionModuleOptions();
  await searchPermissions();
}

async function handleInstanceTableChange(pager: {
  current?: number;
  pageSize?: number;
}) {
  instancePagination.current = pager.current ?? 1;
  instancePagination.pageSize = pager.pageSize ?? instancePagination.pageSize;
  await loadInstances({ page: instancePagination.current });
}

async function handleTemplateTableChange(pager: {
  current?: number;
  pageSize?: number;
}) {
  templatePagination.current = pager.current ?? 1;
  templatePagination.pageSize = pager.pageSize ?? templatePagination.pageSize;
  await loadTemplates({ page: templatePagination.current });
}

async function handlePermissionTableChange(pager: {
  current?: number;
  pageSize?: number;
}) {
  permissionPagination.current = pager.current ?? 1;
  permissionPagination.pageSize =
    pager.pageSize ?? permissionPagination.pageSize;
  await loadAvailablePermissions({ page: permissionPagination.current });
}

function openRoleCreateModal() {
  if (!canCreateRoleInstance.value) {
    return;
  }

  resetRoleCreateForm();
  if (isPlatformScope.value) {
    void loadTenantOptions();
  }
  createRoleModalOpen.value = true;
}

function openTemplateCreateModal() {
  if (!canCreateRoleTemplate.value) {
    return;
  }

  resetTemplateCreateForm();
  createTemplateModalOpen.value = true;
}

// Routes the unified create-role dropdown actions to the matching creation flow.
function handleCreateRoleMenuClick({ key }: { key: number | string }) {
  switch (String(key) as CreateRoleMenuKey) {
    case 'instantiate': {
      if (!canCreateRoleFromTemplate.value) {
        return;
      }

      openInstantiateModal();
      return;
    }
    case 'role': {
      openRoleCreateModal();
      return;
    }
  }
}

async function submitRoleCreate() {
  if (!canCreateRoleInstance.value) {
    return;
  }

  if (!validateRoleCreateForm()) {
    return;
  }

  roleSaving.value = true;

  try {
    await createRoleApi({
      code: roleCreateForm.code.trim(),
      description: roleCreateForm.description.trim() || undefined,
      name: roleCreateForm.name.trim(),
      scopeLevel: roleCreateForm.scopeLevel,
      tenantId:
        roleCreateForm.scopeLevel === 'TENANT'
          ? roleCreateForm.tenantId.trim()
          : undefined,
    });

    message.success('角色实例已创建');
    createRoleModalOpen.value = false;
    resetRoleCreateForm();
    await loadInstances({ page: instancePagination.current });
  } catch (error) {
    message.error(getErrorMessage(error, '创建角色实例失败，请稍后重试'));
  } finally {
    roleSaving.value = false;
  }
}

async function submitTemplateCreate() {
  if (!canCreateRoleTemplate.value) {
    return;
  }

  if (!validateTemplateCreateForm()) {
    return;
  }

  templateSaving.value = true;

  try {
    await createRoleTemplateApi({
      code: templateCreateForm.code.trim(),
      description: templateCreateForm.description.trim() || undefined,
      name: templateCreateForm.name.trim(),
    });

    message.success('角色模板已创建');
    createTemplateModalOpen.value = false;
    resetTemplateCreateForm();
    await loadTemplates({ page: templatePagination.current });
  } catch (error) {
    message.error(getErrorMessage(error, '创建角色模板失败，请稍后重试'));
  } finally {
    templateSaving.value = false;
  }
}

async function openEditDrawer(
  type: PermissionOwnerType,
  role: RoleManagementApi.Role,
) {
  if (!canReadRoleOwner(type) && !canUpdateRoleOwner(type)) {
    return;
  }

  editTargetType.value = type;
  editDrawerOpen.value = true;
  editSaving.value = false;

  try {
    selectedRole.value =
      type === 'role'
        ? await getRoleByIdApi(role.id)
        : await getRoleTemplateByIdApi(role.id);
    resetEditForm(selectedRole.value);
  } catch (error) {
    editDrawerOpen.value = false;
    selectedRole.value = null;
    message.error(getErrorMessage(error, '加载角色详情失败，请稍后重试'));
  }
}

async function submitEdit() {
  if (!canUpdateRoleOwner(editTargetType.value)) {
    return;
  }

  if (!selectedRole.value || !validateEditForm()) {
    return;
  }

  editSaving.value = true;

  try {
    const updated =
      editTargetType.value === 'role'
        ? await updateRoleApi(selectedRole.value.id, {
            description: roleEditForm.description.trim() || undefined,
            name: roleEditForm.name.trim(),
          })
        : await updateRoleTemplateApi(selectedRole.value.id, {
            description: roleEditForm.description.trim() || undefined,
            name: roleEditForm.name.trim(),
          });

    selectedRole.value = updated;
    resetEditForm(updated);
    editDrawerOpen.value = false;
    message.success(editTargetType.value === 'role' ? '角色已更新' : '模板已更新');
    if (editTargetType.value === 'role') {
      await loadInstances({ page: instancePagination.current });
    } else {
      await loadTemplates({ page: templatePagination.current });
    }
  } catch (error) {
    message.error(getErrorMessage(error, '保存失败，请稍后重试'));
  } finally {
    editSaving.value = false;
  }
}

async function setEnabled(
  type: PermissionOwnerType,
  role: RoleManagementApi.Role,
  isEnabled: boolean,
) {
  if (!canUpdateRoleOwner(type)) {
    return;
  }

  try {
    if (type === 'role') {
      await setRoleEnabledApi(role.id, { isEnabled });
      await loadInstances({ page: instancePagination.current });
    } else {
      await setRoleTemplateEnabledApi(role.id, { isEnabled });
      await loadTemplates({ page: templatePagination.current });
    }

    message.success(isEnabled ? '已启用' : '已停用');
  } catch (error) {
    message.error(getErrorMessage(error, '更新状态失败，请稍后重试'));
  }
}

function confirmDelete(type: PermissionOwnerType, role: RoleManagementApi.Role) {
  if (!canDeleteRoleOwner(type)) {
    return;
  }

  Modal.confirm({
    title: type === 'role' ? '删除角色实例' : '删除角色模板',
    content: `确定删除“${role.name}”吗？`,
    okButtonProps: {
      danger: true,
    },
    okText: '删除',
    cancelText: '取消',
    async onOk() {
      try {
        if (type === 'role') {
          await deleteRoleApi(role.id);
          await loadInstances({ page: instancePagination.current });
        } else {
          await deleteRoleTemplateApi(role.id);
          await loadTemplates({ page: templatePagination.current });
        }

        message.success(type === 'role' ? '角色已删除' : '模板已删除');
      } catch (error) {
        message.error(getErrorMessage(error, '删除失败，请稍后重试'));
      }
    },
  });
}

async function openPermissionDrawer(
  type: PermissionOwnerType,
  role: RoleManagementApi.Role,
) {
  if (!canReadRoleOwner(type)) {
    return;
  }

  permissionOwnerType.value = type;
  selectedRole.value = role;
  permissionDrawerOpen.value = true;
  permissionFilters.keyword = '';
  permissionFilters.module = '';
  moduleSearch.value = '';
  permissionPagination.current = 1;
  await loadPermissionModuleOptions();
  await reloadPermissionDrawerData({ page: 1 });
}

// Opens the role terminal access editor and loads the role default terminal allow-list.
async function openTerminalAccessDrawer(role: RoleManagementApi.Role) {
  if (!canViewTerminalAccess.value) {
    return;
  }

  terminalAccessRole.value = role;
  roleTerminalAccessValues.value = [];
  terminalAccessDrawerOpen.value = true;
  terminalAccessLoading.value = true;

  try {
    const result = await getRoleTerminalAccessApi(role.id);
    roleTerminalAccessValues.value = [...(result.allowedTerminals ?? [])]
      .filter((terminal): terminal is RoleTerminal =>
        terminalAccessOptions.some((option) => option.value === terminal),
      );
  } catch (error) {
    message.error(getErrorMessage(error, '加载角色终端准入失败，请稍后重试'));
  } finally {
    terminalAccessLoading.value = false;
  }
}

// Persists the role default terminal allow-list through permission-service management APIs.
async function saveRoleTerminalAccess() {
  if (!terminalAccessRole.value || !canManageRoleTerminalAccess.value) {
    return;
  }

  terminalAccessSaving.value = true;

  try {
    const result = await setRoleTerminalAccessApi(terminalAccessRole.value.id, {
      allowedTerminals: roleTerminalAccessValues.value,
    });
    roleTerminalAccessValues.value = [...(result.allowedTerminals ?? [])]
      .filter((terminal): terminal is RoleTerminal =>
        terminalAccessOptions.some((option) => option.value === terminal),
      );
    terminalAccessDrawerOpen.value = false;
    message.success('角色终端准入已保存');
  } catch (error) {
    message.error(getErrorMessage(error, '保存角色终端准入失败，请稍后重试'));
  } finally {
    terminalAccessSaving.value = false;
  }
}

async function openNavigationDrawer(
  type: PermissionOwnerType,
  role: RoleManagementApi.Role,
) {
  if (!canReadRoleOwner(type)) {
    return;
  }

  navigationOwnerType.value = type;
  navigationRole.value = role;
  roleNavigationConfig.value = null;
  navigationVisibilityBaseEntryKeys.value = [];
  navigationVisibilityOverrides.value = [];
  navigationLandingBaseEntryKey.value = '';
  navigationLandingOverrides.value = [];
  navigationOverrideActiveTab.value = defaultNavigationTerminal.value;
  navigationDrawerOpen.value = true;
  navigationLoading.value = true;

  try {
    const [navigationConfig] = await Promise.all([
      getRoleNavigationApi(role.id),
      loadNavigationEntryOptions(),
    ]);
    roleNavigationConfig.value = navigationConfig;
    mapVisibilityRows(navigationConfig);
    mapLandingRows(navigationConfig);
  } catch (error) {
    message.error(getErrorMessage(error, '加载角色导航配置失败，请稍后重试'));
  } finally {
    navigationLoading.value = false;
  }
}

function validateNavigationSaveState() {
  return validateNavigationEditorState({
    baseEntryKeys: navigationVisibilityBaseEntryKeys.value,
    baseLandingEntryKey: navigationLandingBaseEntryKey.value,
    entries: navigationEntries.value,
    landingOverrides: navigationLandingOverrides.value,
    supportedTerminals: activeNavigationTerminals.value,
    visibilityOverrides: navigationVisibilityOverrides.value,
  });
}

async function saveNavigationConfig() {
  if (!navigationRole.value || !canUpdateNavigationOwner.value) {
    return;
  }

  const validation = validateNavigationSaveState();
  if (!validation.valid) {
    message.warning(validation.message);
    return;
  }

  const visibilityPayload = buildVisibilityPayloadFromEditor({
    entries: navigationEntries.value,
    baseEntryKeys: navigationVisibilityBaseEntryKeys.value,
    overrides: navigationVisibilityOverrides.value,
    supportedTerminals: activeNavigationTerminals.value,
  });
  const landingPoliciesPayload = buildLandingPoliciesFromEditor({
    baseEntryKey: navigationLandingBaseEntryKey.value,
    overrides: navigationLandingOverrides.value,
    supportedTerminals: activeNavigationTerminals.value,
  });

  navigationSaving.value = true;

  try {
    await setRoleNavigationVisibilityApi(navigationRole.value.id, {
      visibility: visibilityPayload,
    });
    roleNavigationConfig.value = await setRoleLandingPoliciesApi(
      navigationRole.value.id,
      {
        landingPolicies: landingPoliciesPayload,
      },
    );
    mapVisibilityRows(roleNavigationConfig.value);
    mapLandingRows(roleNavigationConfig.value);
    navigationDrawerOpen.value = false;
    message.success('导航配置已保存');
    await refreshCurrentSessionNavigation();
  } catch (error) {
    try {
      roleNavigationConfig.value = await getRoleNavigationApi(navigationRole.value.id);
      mapVisibilityRows(roleNavigationConfig.value);
      mapLandingRows(roleNavigationConfig.value);
    } catch {
      // Keep the current editor state when refresh also fails so the administrator can retry.
    }
    message.error(getErrorMessage(error, '保存导航配置失败，请稍后重试'));
  } finally {
    navigationSaving.value = false;
  }
}

async function syncNavigationFromTemplate() {
  if (
    !navigationRole.value?.id ||
    !navigationRole.value.templateRoleId ||
    !canSyncRoleInstanceFromTemplate.value
  ) {
    return;
  }

  navigationSaving.value = true;

  try {
    roleNavigationConfig.value = await syncRoleNavigationFromTemplateApi(
      navigationRole.value.id,
    );
    mapVisibilityRows(roleNavigationConfig.value);
    mapLandingRows(roleNavigationConfig.value);
    message.success('已同步模板导航配置');
    await refreshCurrentSessionNavigation();
  } catch (error) {
    message.error(getErrorMessage(error, '同步模板导航失败，请稍后重试'));
  } finally {
    navigationSaving.value = false;
  }
}

/** confirmSyncNavigationFromTemplate asks for confirmation before replacing an instance with template navigation. */
function confirmSyncNavigationFromTemplate() {
  if (!canSyncNavigationFromTemplate.value || navigationSaving.value) {
    return;
  }

  Modal.confirm({
    centered: true,
    cancelText: '取消',
    content: h('div', [
      h('div', '将使用来源模板当前的导航配置覆盖该实例已有配置。'),
      h('div', '包括可见入口与默认落点，请确认后再继续。'),
    ]),
    okText: '确认同步',
    title: '同步模板导航',
    async onOk() {
      await syncNavigationFromTemplate();
    },
  });
}

async function assignPermission(permissionId: string) {
  if (!selectedRole.value || !canAssignSelectedRolePermissions.value) {
    return;
  }

  permissionMutating.value = true;

  try {
    if (permissionOwnerType.value === 'role') {
      await assignRolePermissionApi(selectedRole.value.id, { permissionId });
    } else {
      await assignRoleTemplatePermissionApi(selectedRole.value.id, {
        permissionId,
      });
    }

    message.success('权限已分配');
    if (permissionOwnerType.value === 'role') {
      await refreshCurrentSessionPermissions();
    }
    await reloadPermissionDrawerData({ page: permissionPagination.current });
  } catch (error) {
    message.error(getErrorMessage(error, '分配权限失败，请稍后重试'));
  } finally {
    permissionMutating.value = false;
  }
}

async function revokePermission(permissionId: string) {
  if (!selectedRole.value || !canAssignSelectedRolePermissions.value) {
    return;
  }

  permissionMutating.value = true;

  try {
    if (permissionOwnerType.value === 'role') {
      await revokeRolePermissionApi(selectedRole.value.id, permissionId);
    } else {
      await revokeRoleTemplatePermissionApi(selectedRole.value.id, permissionId);
    }

    message.success('权限已移除');
    if (permissionOwnerType.value === 'role') {
      await refreshCurrentSessionPermissions();
    }
    await reloadPermissionDrawerData({ page: permissionPagination.current });
  } catch (error) {
    message.error(getErrorMessage(error, '移除权限失败，请稍后重试'));
  } finally {
    permissionMutating.value = false;
  }
}

function isPermissionAssigned(permissionId: string) {
  return assignedPermissionIds.value.has(permissionId);
}

function isTerminalAccessSelected(terminal: RoleTerminal) {
  return roleTerminalAccessValues.value.includes(terminal);
}

// togglePermissionAssignment keeps the single permission table checkbox in sync with role assignment APIs.
async function togglePermissionAssignment(permissionId: string, checked: boolean) {
  const assigned = isPermissionAssigned(permissionId);

  if (checked === assigned) {
    return;
  }

  if (checked) {
    await assignPermission(permissionId);
    return;
  }

  await revokePermission(permissionId);
}

function handleInstantiateTemplateChange(templateId?: unknown) {
  const normalizedTemplateId =
    typeof templateId === 'string'
      ? templateId
      : Array.isArray(templateId) && typeof templateId[0] === 'string'
        ? templateId[0]
        : templateId &&
            typeof templateId === 'object' &&
            'value' in templateId &&
            typeof templateId.value === 'string'
          ? templateId.value
        : undefined;
  const selectedTemplate =
    templates.value.find((template) => template.id === normalizedTemplateId) ??
    null;
  const currentTenant = instantiateForm.tenantId;

  instantiateTemplate.value = selectedTemplate;
  instantiateTemplateId.value = normalizedTemplateId ?? '';
  instantiateForm.code = selectedTemplate?.code ?? '';
  instantiateForm.description = selectedTemplate?.description ?? '';
  instantiateForm.name = selectedTemplate?.name ?? '';
  instantiateForm.tenantId = isPlatformScope.value
    ? currentTenant
    : currentTenantId.value;
}

function openInstantiateModal(template?: RoleManagementApi.Role) {
  if (!canCreateRoleFromTemplate.value) {
    return;
  }

  if (template && !template.isEnabled) {
    message.warning('停用模板不能创建角色实例');
    return;
  }

  resetInstantiateForm(template);
  if (isPlatformScope.value) {
    void loadTenantOptions();
  }
  instantiateModalOpen.value = true;
}

async function submitInstantiate() {
  if (!canCreateRoleFromTemplate.value) {
    return;
  }

  if (!validateInstantiateForm() || !instantiateTemplate.value) {
    return;
  }

  instantiateSaving.value = true;

  try {
    await instantiateRoleTemplateApi(instantiateTemplate.value.id, {
      description: instantiateForm.description.trim() || undefined,
      name: instantiateForm.name.trim() || undefined,
      tenantId: instantiateForm.tenantId.trim(),
    });

    message.success('租户角色已创建');
    instantiateModalOpen.value = false;
    activeTab.value = 'instances';
    await loadInstances({ page: instancePagination.current });
  } catch (error) {
    message.error(getErrorMessage(error, '模板实例化失败，请稍后重试'));
  } finally {
    instantiateSaving.value = false;
  }
}

async function handleRoleAction(
  key: RoleActionKey,
  role: RoleManagementApi.Role,
) {
  switch (key) {
    case 'edit': {
      await openEditDrawer('role', role);
      return;
    }
    case 'permissions': {
      await openPermissionDrawer('role', role);
      return;
    }
    case 'navigation': {
      await openNavigationDrawer('role', role);
      return;
    }
    case 'terminalAccess': {
      await openTerminalAccessDrawer(role);
      return;
    }
    case 'toggle': {
      await setEnabled('role', role, !role.isEnabled);
      return;
    }
    case 'delete': {
      confirmDelete('role', role);
      return;
    }
  }
}

async function handleTemplateAction(
  key: TemplateActionKey,
  role: RoleManagementApi.Role,
) {
  switch (key) {
    case 'edit': {
      await openEditDrawer('template', role);
      return;
    }
    case 'permissions': {
      await openPermissionDrawer('template', role);
      return;
    }
    case 'navigation': {
      await openNavigationDrawer('template', role);
      return;
    }
    case 'terminalAccess': {
      await openTerminalAccessDrawer(role);
      return;
    }
    case 'toggle': {
      await setEnabled('template', role, !role.isEnabled);
      return;
    }
    case 'instantiate': {
      openInstantiateModal(role);
      return;
    }
    case 'delete': {
      confirmDelete('template', role);
      return;
    }
  }
}

// Renders role management row commands through Ant Design Vue Dropdown/Menu primitives.
function renderRoleNativeActions<ActionKey extends string>({
  ariaLabel,
  items,
  onClick,
}: {
  ariaLabel: string;
  items: Array<TableActionMenuItem<ActionKey>>;
  onClick: (key: ActionKey) => void | Promise<void>;
}) {
  const visibleItems = items.filter((item) => !item.hidden);

  if (!visibleItems.length) {
    return h('span', { class: 'tenant-table-action-empty' }, '无可用操作');
  }

  return h(
    Dropdown,
    { trigger: ['click'] },
    {
      default: () =>
        h(
          Button,
          {
            'aria-label': ariaLabel,
            shape: 'circle',
            size: 'small',
            type: 'text',
          },
          () => h(IconifyIcon, { icon: 'ant-design:more-outlined' }),
        ),
      overlay: () =>
        h(
          Menu,
          {
            onClick: (info) => {
              const action = visibleItems.find((item) => item.key === String(info.key));

              if (!action || action.disabled) {
                return;
              }

              void onClick(action.key);
            },
          },
          () =>
            visibleItems.map((item) =>
              h(
                Menu.Item,
                {
                  danger: item.danger,
                  disabled: item.disabled,
                  key: item.key,
                  'data-testid': item.testId,
                },
                () => item.label,
              ),
            ),
        ),
    },
  );
}

function renderRoleActionDropdown(
  role: RoleManagementApi.Role,
  type: PermissionOwnerType,
) {
  const disabledEdit = !canUpdateRoleOwner(type);
  const disabledPermissions = !canReadRoleOwner(type);
  const disabledDelete = !canDeleteRoleOwner(type);
  const items =
    type === 'role'
      ? [
          { disabled: disabledEdit, key: 'edit' satisfies RoleActionKey, label: '编辑' },
          { disabled: disabledPermissions, key: 'permissions' satisfies RoleActionKey, label: '权限' },
          { disabled: disabledPermissions, key: 'navigation' satisfies RoleActionKey, label: '导航' },
          { disabled: !canViewTerminalAccess.value, key: 'terminalAccess' satisfies RoleActionKey, label: '终端准入' },
          { disabled: disabledEdit, key: 'toggle' satisfies RoleActionKey, label: role.isEnabled ? '停用' : '启用' },
          { danger: true, disabled: disabledDelete, key: 'delete' satisfies RoleActionKey, label: '删除' },
        ]
      : [
          { disabled: disabledEdit, key: 'edit' satisfies TemplateActionKey, label: '编辑' },
          { disabled: disabledPermissions, key: 'permissions' satisfies TemplateActionKey, label: '权限' },
          { disabled: disabledPermissions, key: 'navigation' satisfies TemplateActionKey, label: '导航' },
          { disabled: !canViewTerminalAccess.value, key: 'terminalAccess' satisfies TemplateActionKey, label: '终端准入' },
          { disabled: !canCreateRoleFromTemplate.value || !role.isEnabled, key: 'instantiate' satisfies TemplateActionKey, label: '实例化' },
          { disabled: disabledEdit, key: 'toggle' satisfies TemplateActionKey, label: role.isEnabled ? '停用' : '启用' },
          { danger: true, disabled: disabledDelete, key: 'delete' satisfies TemplateActionKey, label: '删除' },
        ];

  return renderRoleNativeActions({
    ariaLabel: type === 'role' ? '角色操作' : '模板操作',
    items,
    onClick: async (key) => {
      if (type === 'role') {
        await handleRoleAction(key as RoleActionKey, role);
      } else {
        await handleTemplateAction(key as TemplateActionKey, role);
      }
    },
  });
}

function stopPermissionColumnResize() {
  activePermissionColumnCleanup?.();
  activePermissionColumnCleanup = null;
  document.body.classList.remove('role-management--resizing-column');
}

// startPermissionColumnResize wires one header drag handle to permission table column width state.
function startPermissionColumnResize(
  event: MouseEvent,
  columnKey: PermissionColumnKey,
) {
  event.preventDefault();
  event.stopPropagation();

  stopPermissionColumnResize();

  const startX = event.clientX;
  const startWidth = permissionColumnWidths[columnKey];

  const handleMouseMove = (moveEvent: MouseEvent) => {
    permissionColumnWidths[columnKey] = Math.max(
      permissionColumnMinWidths[columnKey],
      Math.round(startWidth + moveEvent.clientX - startX),
    );
  };

  const handleMouseUp = () => {
    stopPermissionColumnResize();
  };

  document.body.classList.add('role-management--resizing-column');
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp, { once: true });
  activePermissionColumnCleanup = () => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };
}

// renderResizablePermissionHeader exposes a compact resize handle for permission table headers.
function renderResizablePermissionHeader(
  columnKey: PermissionColumnKey,
  label: string,
) {
  return h('div', { class: 'role-management__resizable-title' }, [
    h('span', { class: 'role-management__resizable-title-text' }, label),
    h('span', {
      'aria-label': `调整${label}列宽`,
      class: 'role-management__column-resizer',
      onMousedown: (event: MouseEvent) =>
        startPermissionColumnResize(event, columnKey),
      role: 'separator',
    }),
  ]);
}

function stopRoleColumnResize() {
  activeRoleColumnCleanup?.();
  activeRoleColumnCleanup = null;
  document.body.classList.remove('role-management--resizing-column');
}

// startRoleColumnResize wires one header drag handle to the role table column width state.
function startRoleColumnResize(event: MouseEvent, columnKey: RoleColumnKey) {
  event.preventDefault();
  event.stopPropagation();

  stopRoleColumnResize();

  const startX = event.clientX;
  const startWidth = roleColumnWidths[columnKey];

  const handleMouseMove = (moveEvent: MouseEvent) => {
    roleColumnWidths[columnKey] = Math.max(
      roleColumnMinWidths[columnKey],
      Math.round(startWidth + moveEvent.clientX - startX),
    );
  };

  const handleMouseUp = () => {
    stopRoleColumnResize();
  };

  document.body.classList.add('role-management--resizing-column');
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp, { once: true });
  activeRoleColumnCleanup = () => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };
}

// renderResizableRoleHeader exposes a compact resize handle without changing table cell content.
function renderResizableRoleHeader(columnKey: RoleColumnKey, label: string) {
  return h('div', { class: 'role-management__resizable-title' }, [
    h('span', { class: 'role-management__resizable-title-text' }, label),
    h('span', {
      'aria-label': `调整${label}列宽`,
      class: 'role-management__column-resizer',
      onMousedown: (event: MouseEvent) => startRoleColumnResize(event, columnKey),
      role: 'separator',
    }),
  ]);
}

const roleColumns = computed<TableColumnsType<RoleManagementApi.Role>>(() => [
  {
    dataIndex: 'name',
    title: renderResizableRoleHeader('name', '角色名称'),
    width: roleColumnWidths.name,
  },
  {
    dataIndex: 'code',
    title: renderResizableRoleHeader('code', '角色编码'),
    width: roleColumnWidths.code,
  },
  {
    dataIndex: 'roleKind',
    title: renderResizableRoleHeader('roleKind', '类型'),
    width: roleColumnWidths.roleKind,
    customRender: ({ record }) =>
      h(Tag, { color: record.isSystem ? 'blue' : 'green' }, () =>
        getRoleKindLabel(record),
      ),
  },
  {
    key: 'scope',
    title: renderResizableRoleHeader('scope', 'Scope'),
    width: roleColumnWidths.scope,
    customRender: ({ record }) =>
      h(Tag, { color: record.isSystem ? 'blue' : 'default' }, () =>
        getRoleScopeLabel(record),
      ),
  },
  {
    dataIndex: 'tenantName',
    title: renderResizableRoleHeader('tenantName', '租户'),
    width: roleColumnWidths.tenantName,
    customRender: ({ record }) => record.tenantName || record.tenantId || '-',
  },
  {
    dataIndex: 'templateRoleName',
    title: renderResizableRoleHeader('templateRoleName', '来源模板'),
    width: roleColumnWidths.templateRoleName,
    customRender: ({ record }) =>
      record.templateRoleName || record.templateRoleId || '-',
  },
  {
    dataIndex: 'isEnabled',
    title: renderResizableRoleHeader('isEnabled', '状态'),
    width: roleColumnWidths.isEnabled,
    customRender: ({ record }) =>
      h(Tag, { color: record.isEnabled ? 'green' : 'default' }, () =>
        record.isEnabled ? '启用' : '停用',
      ),
  },
  {
    align: 'center',
    fixed: 'right',
    key: 'actions',
    title: operationColumnTitle,
    width: roleColumnWidths.actions,
    customRender: ({ record }) => renderRoleActionDropdown(record, 'role'),
  },
]);

const templateColumns = computed<TableColumnsType<RoleManagementApi.Role>>(() => [
  {
    dataIndex: 'name',
    title: '模板名称',
  },
  {
    dataIndex: 'code',
    title: '模板编码',
  },
  {
    dataIndex: 'roleKind',
    title: '类型',
    width: 90,
    customRender: ({ record }) =>
      h(Tag, { color: 'purple' }, () => getRoleKindLabel(record)),
  },
  {
    dataIndex: 'description',
    title: '说明',
    customRender: ({ record }) => record.description || '-',
  },
  {
    dataIndex: 'isEnabled',
    title: '状态',
    width: 90,
    customRender: ({ record }) =>
      h(Tag, { color: record.isEnabled ? 'green' : 'default' }, () =>
        record.isEnabled ? '启用' : '停用',
      ),
  },
  {
    align: 'center',
    fixed: 'right',
    key: 'actions',
    title: operationColumnTitle,
    width: 72,
    customRender: ({ record }) => renderRoleActionDropdown(record, 'template'),
  },
]);

const permissionListColumns = computed<
  TableColumnsType<PermissionManagementApi.Permission>
>(() => [
  {
    align: 'center',
    key: 'assigned',
    title: renderResizablePermissionHeader('assigned', '已分配'),
    width: permissionColumnWidths.assigned,
    customRender: ({ record }) => {
      const checked = isPermissionAssigned(record.id);

      return h(Checkbox, {
        checked,
        disabled: !canAssignSelectedRolePermissions.value || permissionMutating.value,
        'data-testid': `role-permission-checkbox-${record.id}`,
        onChange: (event: { target?: { checked?: boolean } }) => {
          void togglePermissionAssignment(record.id, Boolean(event.target?.checked));
        },
      });
    },
  },
  {
    dataIndex: 'code',
    title: renderResizablePermissionHeader('code', '权限码'),
    width: permissionColumnWidths.code,
  },
  {
    dataIndex: 'module',
    title: renderResizablePermissionHeader('module', '模块'),
    width: permissionColumnWidths.module,
  },
  {
    dataIndex: 'description',
    title: renderResizablePermissionHeader('description', '说明'),
    width: permissionColumnWidths.description,
    customRender: ({ record }) => record.description || '-',
  },
]);

onMounted(async () => {
  if (!showTemplateTab.value) {
    activeTab.value = 'instances';
    instanceFilters.scopeLevel = 'TENANT';
    instanceFilters.tenantId = currentTenantId.value;
  }

  if (isPlatformScope.value) {
    void loadTenantOptions();
  }

  await Promise.all([
    loadInstances(),
    loadTemplates(),
  ]);
});

onBeforeUnmount(() => {
  stopPermissionColumnResize();
  stopRoleColumnResize();

  if (tenantOptionSearchTimer) {
    clearTimeout(tenantOptionSearchTimer);
  }
});
</script>

<template>
  <Page title="角色管理">
    <div class="role-management">
      <Card :bordered="false" class="role-management__card">
        <Tabs v-model:active-key="activeTab">
          <Tabs.TabPane key="instances" tab="角色实例">
            <div class="role-management__toolbar">
              <div class="role-management__heading">
                <div class="role-management__title">角色实例</div>
                <div class="role-management__meta">
                  共 {{ instancePagination.total }} 条
                </div>
              </div>
              <Dropdown
                v-access:code="[
                  'permission.role_instance.create_from_template',
                  'permission.role_instance.create',
                ]"
                v-if="canCreateRole"
                trigger="click"
              >
                <Button type="primary">
                  创建角色
                  <IconifyIcon icon="ant-design:down-outlined" />
                </Button>
                <template #overlay>
                  <Menu @click="handleCreateRoleMenuClick">
                    <Menu.Item
                      v-access:code="'permission.role_instance.create_from_template'"
                      v-if="canCreateRoleFromTemplate"
                      key="instantiate"
                      :disabled="
                        templatesLoading ||
                        templateSelectOptions.length === 0
                      "
                    >
                      从模板创建
                    </Menu.Item>
                    <Menu.Item
                      v-access:code="'permission.role_instance.create'"
                      v-if="canCreateRoleInstance"
                      key="role"
                    >
                      直接创建
                    </Menu.Item>
                  </Menu>
                </template>
              </Dropdown>
            </div>

            <section class="role-management__filter-panel">
              <Row :gutter="[10, 10]" class="role-management__filter-row">
                <Col class="role-management__keyword-filter-col" flex="0 1 320px">
                  <Input
                    v-model:value="instanceFilters.keyword"
                    allow-clear
                    class="role-management__filter-control"
                    placeholder="搜索角色名称或编码"
                    @press-enter="searchInstances"
                  />
                </Col>
                <Col
                  v-if="showTemplateTab"
                  class="role-management__scope-filter-col"
                  flex="0 0 150px"
                >
                  <Select
                    v-model:value="instanceFilters.scopeLevel"
                    class="role-management__filter-control"
                    :options="[
                      { label: '全部 Scope', value: '' },
                      { label: 'SYSTEM', value: 'SYSTEM' },
                      { label: 'TENANT', value: 'TENANT' },
                    ]"
                  />
                </Col>
                <Col
                  v-if="showTemplateTab"
                  class="role-management__tenant-filter-col"
                  flex="0 1 220px"
                >
                  <Select
                    v-model:value="instanceFilters.tenantId"
                    allow-clear
                    class="role-management__filter-control"
                    show-search
                    :filter-option="false"
                    :loading="tenantOptionsLoading"
                    :options="tenantFilterSelectOptions"
                    placeholder="全部租户"
                    @search="scheduleTenantOptionSearch"
                  />
                </Col>
                <Col
                  class="role-management__filter-actions-col"
                  flex="0 0 204px"
                >
                  <div class="role-management__filter-buttons">
                    <Button class="role-management__filter-button" type="primary" @click="searchInstances">查询</Button>
                    <Button class="role-management__filter-button" @click="resetInstanceFilters">重置</Button>
                  </div>
                </Col>
              </Row>
            </section>

            <Table
              class="role-management__instance-table"
              :columns="roleColumns"
              :data-source="instances"
              :loading="instancesLoading"
              :pagination="instanceTablePagination"
              :row-key="(record) => record.id"
              :scroll="{ x: roleTableScrollX }"
              @change="handleInstanceTableChange"
            />
          </Tabs.TabPane>

          <Tabs.TabPane v-if="showTemplateTab" key="templates" tab="角色模板">
            <div class="role-management__toolbar">
              <div class="role-management__heading">
                <div class="role-management__title">角色模板</div>
                <div class="role-management__meta">
                  共 {{ templatePagination.total }} 条
                </div>
              </div>
              <Button
                v-access:code="'permission.role_template.create'"
                v-if="canCreateRoleTemplate"
                type="primary"
                @click="openTemplateCreateModal"
              >
                创建模板
              </Button>
            </div>

            <section class="role-management__filter-panel">
              <Row :gutter="[10, 10]" class="role-management__filter-row">
                <Col :lg="12" :md="16" :span="24" :xl="14">
                  <Input
                    v-model:value="templateFilters.keyword"
                    allow-clear
                    class="role-management__filter-control"
                    placeholder="搜索模板名称或编码"
                    @press-enter="searchTemplates"
                  />
                </Col>
                <Col
                  :lg="5"
                  :md="8"
                  :span="24"
                  :xl="5"
                  class="role-management__filter-actions-col"
                >
                  <div class="role-management__filter-buttons">
                    <Button class="role-management__filter-button" type="primary" @click="searchTemplates">查询</Button>
                    <Button class="role-management__filter-button" @click="resetTemplateFilters">重置</Button>
                  </div>
                </Col>
              </Row>
            </section>

            <Table
              :columns="templateColumns"
              :data-source="templates"
              :loading="templatesLoading"
              :pagination="templateTablePagination"
              :row-key="(record) => record.id"
              :scroll="{ x: 900 }"
              @change="handleTemplateTableChange"
            />
          </Tabs.TabPane>
        </Tabs>
      </Card>

      <Modal
        v-model:open="createRoleModalOpen"
        :confirm-loading="roleSaving"
        centered
        destroy-on-close
        ok-text="创建"
        title="创建角色实例"
        width="420px"
        @ok="submitRoleCreate"
      >
        <Form layout="vertical">
          <Form.Item label="角色名称" required>
            <Input v-model:value="roleCreateForm.name" placeholder="输入角色名称" />
          </Form.Item>
          <Form.Item label="角色编码" required>
            <Input v-model:value="roleCreateForm.code" placeholder="例如 tenant.admin 或 TENANT_ADMIN" />
          </Form.Item>
          <Form.Item v-if="showTemplateTab" label="Scope" required>
            <Select
              v-model:value="roleCreateForm.scopeLevel"
              :options="[
                { label: 'SYSTEM', value: 'SYSTEM' },
                { label: 'TENANT', value: 'TENANT' },
              ]"
            />
          </Form.Item>
          <Form.Item
            v-if="showTemplateTab && roleCreateForm.scopeLevel === 'TENANT'"
            label="租户"
            required
          >
            <Select
              v-model:value="roleCreateForm.tenantId"
              show-search
              :filter-option="false"
              :loading="tenantOptionsLoading"
              :options="tenantSelectOptions"
              placeholder="选择租户"
              @search="scheduleTenantOptionSearch"
            />
          </Form.Item>
          <Form.Item v-else-if="!showTemplateTab" label="租户">
            <Input :value="currentTenantLabel" disabled />
          </Form.Item>
          <Form.Item label="说明">
            <Input.TextArea
              v-model:value="roleCreateForm.description"
              :auto-size="{ minRows: 3, maxRows: 5 }"
              placeholder="输入角色说明"
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        v-model:open="createTemplateModalOpen"
        :confirm-loading="templateSaving"
        centered
        destroy-on-close
        ok-text="创建"
        title="创建角色模板"
        width="420px"
        @ok="submitTemplateCreate"
      >
        <Form layout="vertical">
          <Form.Item label="模板名称" required>
            <Input
              v-model:value="templateCreateForm.name"
              placeholder="输入模板名称"
            />
          </Form.Item>
          <Form.Item label="模板编码" required>
            <Input
              v-model:value="templateCreateForm.code"
              placeholder="例如 tenant.admin.template 或 TENANT_ADMIN_TEMPLATE"
            />
          </Form.Item>
          <Form.Item label="说明">
            <Input.TextArea
              v-model:value="templateCreateForm.description"
              :auto-size="{ minRows: 3, maxRows: 5 }"
              placeholder="输入模板说明"
            />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        v-model:open="editDrawerOpen"
        :confirm-loading="editSaving"
        destroy-on-close
        :title="editTargetType === 'role' ? '编辑角色' : '编辑模板'"
        width="420"
      >
        <Form layout="vertical">
          <Form.Item label="名称" required>
            <Input v-model:value="roleEditForm.name" placeholder="输入名称" />
          </Form.Item>
          <Form.Item label="说明">
            <Input.TextArea
              v-model:value="roleEditForm.description"
              :auto-size="{ minRows: 3, maxRows: 5 }"
              placeholder="输入说明"
            />
          </Form.Item>
          <Form.Item label="编码">
            <Input :value="selectedRole?.code || ''" disabled />
          </Form.Item>
        </Form>
        <template #footer>
          <div class="role-management__drawer-footer">
            <Space>
              <Button @click="editDrawerOpen = false">取消</Button>
              <Button
                :loading="editSaving"
                type="primary"
                @click="submitEdit"
              >
                保存
              </Button>
            </Space>
          </div>
        </template>
      </Drawer>

      <Drawer
        v-model:open="terminalAccessDrawerOpen"
        :body-style="{
          background: 'hsl(var(--muted) / 0.58)',
          padding: '16px',
        }"
        destroy-on-close
        :header-style="{
          background: 'hsl(var(--card))',
          borderBottom: '1px solid hsl(var(--border))',
        }"
        :title="`终端准入 · ${terminalAccessRole?.name || ''}`"
        width="560"
      >
        <section
          v-loading="terminalAccessLoading"
          class="role-management__terminal-access-panel"
        >
          <div class="role-management__terminal-access-hero">
            <div>
              <div class="role-management__terminal-access-title">
                默认准入终端
              </div>
              <div class="role-management__terminal-access-description">
                {{ terminalAccessSubtitle }}
              </div>
            </div>
            <Tag :color="roleTerminalAccessValues.length > 0 ? 'blue' : 'default'">
              {{ terminalAccessSelectedSummary }}
            </Tag>
          </div>

          <Checkbox.Group
            v-model:value="roleTerminalAccessValues"
            class="role-management__terminal-group"
            :disabled="!canManageRoleTerminalAccess"
          >
            <Checkbox
              v-for="option in terminalAccessOptions"
              :key="option.value"
              class="role-management__terminal-card"
              :class="{
                'role-management__terminal-card--active': isTerminalAccessSelected(option.value),
              }"
              :value="option.value"
            >
              <span class="role-management__terminal-card-main">
                <span class="role-management__terminal-card-icon">
                  <IconifyIcon :icon="terminalAccessOptionMeta[option.value].icon" />
                </span>
                <span class="role-management__terminal-card-content">
                  <span class="role-management__terminal-card-title">
                    {{ option.label }}
                  </span>
                  <span class="role-management__terminal-card-desc">
                    {{ terminalAccessOptionMeta[option.value].description }}
                  </span>
                </span>
              </span>
            </Checkbox>
          </Checkbox.Group>
        </section>

        <template #footer>
          <div class="role-management__drawer-footer">
            <Space>
              <Button @click="terminalAccessDrawerOpen = false">取消</Button>
              <Button
                v-if="canManageRoleTerminalAccess"
                :loading="terminalAccessSaving"
                type="primary"
                @click="saveRoleTerminalAccess"
              >
                保存终端准入
              </Button>
            </Space>
          </div>
        </template>
      </Drawer>

      <Drawer
        v-if="navigationDrawerOpen"
        v-model:open="navigationDrawerOpen"
        destroy-on-close
        :title="`导航配置 · ${navigationRole?.name || ''}`"
        width="820"
      >
        <div class="role-management__navigation-stack">
          <section class="role-management__permission-section role-management__navigation-panel">
            <div class="role-management__panel-header">
              <div>
                <div class="role-management__section-title-row">
                  <div class="role-management__panel-title role-management__panel-title--primary">
                    导航规则
                  </div>
                  <Tooltip
                    :title="
                      navigationRoleIsTemplate
                        ? '模板导航会在实例化时作为初始配置复制到新角色实例。'
                        : navigationTemplateSourceName
                          ? `当前实例来源模板：${navigationTemplateSourceName}。实例创建后独立维护，可一键同步为模板当前配置。`
                          : '当前实例未绑定来源模板，导航配置仅对该实例生效。'
                    "
                  >
                    <span class="role-management__help-dot">?</span>
                  </Tooltip>
                </div>
                <div class="role-management__navigation-context">
                  <Tag color="blue">
                    {{ navigationRoleIsTemplate ? '角色模板' : '角色实例' }}
                  </Tag>
                  <span class="role-management__panel-meta">
                    {{
                      navigationRoleIsTemplate
                        ? '模板实例化时复制为初始导航'
                        : `来源模板：${navigationInstanceTemplateLabel}`
                    }}
                  </span>
                </div>
              </div>
              <Button
                v-access:code="'permission.role_instance.sync_from_template'"
                v-if="canSyncNavigationFromTemplate"
                :loading="navigationSaving"
                size="small"
                @click="confirmSyncNavigationFromTemplate"
              >
                同步模板导航
              </Button>
            </div>
          </section>

          <section class="role-management__permission-section role-management__navigation-panel">
            <div class="role-management__panel-header">
              <div>
                <div class="role-management__section-title-row">
                  <div class="role-management__panel-title">前端导航配置</div>
                  <Tooltip title="DEFAULT 作为共享导航配置，其余前端在未单独配置时继承 DEFAULT。">
                    <span class="role-management__help-dot">?</span>
                  </Tooltip>
                </div>
                <div class="role-management__panel-meta">
                  在同一张列表里完成可见入口与默认落点配置。
                </div>
              </div>
              <Tag color="blue">{{ activeNavigationTabSummary }}</Tag>
            </div>
            <Tabs
              v-model:active-key="navigationOverrideActiveTab"
              class="role-management__navigation-tabs"
              size="small"
            >
              <Tabs.TabPane
                v-for="tabKey in navigationConfigTabs"
                :key="tabKey"
                :tab="tabKey"
              >
                <div class="role-management__navigation-tab-header">
                  <div class="role-management__navigation-section-intro">
                    <div class="role-management__section-title-row role-management__section-title-row--compact">
                      <div class="role-management__navigation-subtitle">当前前端导航</div>
                      <Tooltip title="勾选表示入口可见；勾选默认表示当前前端的默认进入。">
                        <span class="role-management__help-dot role-management__help-dot--sm">?</span>
                      </Tooltip>
                    </div>
                    <Tag color="blue">{{ tabKey }}</Tag>
                  </div>
                  <Button
                    v-if="tabKey !== defaultNavigationTerminal"
                    :disabled="!hasNavigationOverride(tabKey)"
                    size="small"
                    type="text"
                    @click="restoreNavigationOverride(tabKey)"
                  >
                    恢复默认
                  </Button>
                </div>
                <div class="role-management__panel-meta role-management__navigation-tab-meta">
                  {{
                    tabKey === defaultNavigationTerminal
                      ? `DEFAULT 为共享配置。${navigationOverrideSummary}`
                      : hasNavigationOverride(tabKey)
                        ? '当前前端已单独配置'
                        : '当前继承默认配置'
                  }}
                </div>
                <div
                  v-for="group in getNavigationTabGroups(tabKey)"
                  :key="`${tabKey}-${group.featureKey}`"
                  class="role-management__navigation-feature-group"
                >
                  <div class="role-management__navigation-feature-title">
                    {{ group.label }}
                  </div>
                  <div class="role-management__navigation-list">
                    <div class="role-management__navigation-list-head">
                      <span class="role-management__navigation-list-flag">可见</span>
                      <span class="role-management__navigation-list-flag">默认</span>
                      <span class="role-management__navigation-list-head-main">导航入口</span>
                    </div>
                    <div
                      v-for="entry in group.entries"
                      :key="entry.entryKey"
                      class="role-management__navigation-list-row"
                    >
                      <Checkbox
                        :checked="getVisibilityEntryKeysForTab(tabKey).includes(entry.entryKey)"
                        class="role-management__navigation-list-check"
                        @update:checked="
                          (checked) =>
                            toggleNavigationEntryVisibility(
                              tabKey,
                              entry.entryKey,
                              checked,
                            )
                        "
                      />
                      <Radio
                        :checked="getLandingEntryForTab(tabKey) === entry.entryKey"
                        :disabled="!getVisibilityEntryKeysForTab(tabKey).includes(entry.entryKey)"
                        class="role-management__navigation-list-radio"
                        @change="
                          () => selectNavigationLandingEntry(tabKey, entry.entryKey)
                        "
                      />
                      <div class="role-management__navigation-option-main">
                        <div class="role-management__navigation-option-top">
                          <div class="role-management__navigation-option-title">
                            {{ entry.name }}
                          </div>
                          <div class="role-management__navigation-option-priority">
                            Priority {{ entry.registryPriority }}
                          </div>
                        </div>
                        <div class="role-management__navigation-option-bottom">
                          <div class="role-management__navigation-option-key">
                            {{ entry.entryKey }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Tabs.TabPane>
            </Tabs>
          </section>
        </div>
        <template #footer>
          <div class="role-management__navigation-footer">
            <Space>
              <Button @click="navigationDrawerOpen = false">关闭</Button>
              <Button
                v-access:code="[
                  'permission.role_instance.update',
                  'permission.role_template.update',
                ]"
                :disabled="!canUpdateNavigationOwner"
                :loading="navigationSaving"
                type="primary"
                @click="saveNavigationConfig"
              >
                保存导航配置
              </Button>
            </Space>
          </div>
        </template>
      </Drawer>

      <Drawer
        v-model:open="permissionDrawerOpen"
        destroy-on-close
        :title="`权限维护 · ${selectedRole?.name || ''}`"
        width="76%"
      >
        <div class="role-management__permission-stack">
          <section class="role-management__permission-section">
            <div class="role-management__panel-header">
              <div class="role-management__panel-title">权限列表</div>
              <div class="role-management__panel-meta">
                已分配 {{ assignedPermissions.length }} / 共 {{ permissionPagination.total }} 条
              </div>
            </div>
            <section class="role-management__permission-filter-panel">
              <div class="role-management__permission-filter-grid">
                <Input
                  v-model:value="permissionFilters.keyword"
                  allow-clear
                  class="role-management__filter-control"
                  placeholder="搜索权限码或说明"
                  @press-enter="searchPermissions"
                />
                <Select
                  v-model:value="permissionFilters.module"
                  class="role-management__filter-control"
                  show-search
                  :filter-option="false"
                  :options="permissionFilterModuleOptions"
                  placeholder="按模块筛选"
                  @search="(value: string) => (moduleSearch = value)"
                />
                <div class="role-management__permission-filter-actions">
                  <Button class="role-management__filter-button" type="primary" @click="searchPermissions">
                    查询
                  </Button>
                  <Button class="role-management__filter-button" @click="resetPermissionFilters">重置</Button>
                </div>
              </div>
            </section>

            <Table
              class="role-management__permission-table"
              :columns="permissionListColumns"
              :data-source="availablePermissions"
              :loading="permissionLoading || permissionMutating"
              :pagination="permissionTablePagination"
              :row-key="(record) => record.id"
              :scroll="{ x: permissionTableScrollX }"
              size="small"
              @change="handlePermissionTableChange"
            />
          </section>
        </div>
      </Drawer>

      <Modal
        v-model:open="instantiateModalOpen"
        :confirm-loading="instantiateSaving"
        centered
        destroy-on-close
        ok-text="创建"
        :title="`实例化模板 · ${instantiateTemplate?.name || ''}`"
        width="420px"
        @ok="submitInstantiate"
      >
        <Form layout="vertical">
          <Form.Item label="角色模板" required>
            <Select
              v-model:value="instantiateTemplateId"
              :options="templateSelectOptions"
              placeholder="选择模板"
              @change="handleInstantiateTemplateChange"
            />
          </Form.Item>
          <Form.Item v-if="showTemplateTab" label="租户" required>
            <Select
              v-model:value="instantiateForm.tenantId"
              show-search
              :filter-option="false"
              :loading="tenantOptionsLoading"
              :options="tenantSelectOptions"
              placeholder="选择目标租户"
              @search="scheduleTenantOptionSearch"
            />
          </Form.Item>
          <Form.Item v-else label="租户">
            <Input :value="currentTenantLabel" disabled />
          </Form.Item>
          <Form.Item label="角色名称">
            <Input v-model:value="instantiateForm.name" placeholder="可选覆盖名称" />
          </Form.Item>
          <Form.Item label="角色编码">
            <Input :value="instantiateTemplate?.code || ''" disabled />
          </Form.Item>
          <Form.Item label="说明">
            <Input.TextArea
              v-model:value="instantiateForm.description"
              :auto-size="{ minRows: 3, maxRows: 5 }"
              placeholder="可选覆盖说明"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  </Page>
</template>

<style scoped>
.role-management {
  display: flex;
  flex-direction: column;
  gap: 16px;
  --role-border: hsl(var(--border));
  --role-card-bg: hsl(var(--card));
  --role-card-bg-soft: hsl(var(--muted) / 0.55);
  --role-card-bg-strong: hsl(var(--muted) / 0.82);
  --role-title: hsl(var(--foreground));
  --role-text: hsl(var(--foreground) / 0.92);
  --role-muted: hsl(var(--muted-foreground));
}

.role-management__card :deep(.ant-card-body) {
  padding: 16px;
  background: var(--role-card-bg);
}

.role-management__toolbar {
  align-items: center;
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.role-management__heading {
  align-items: baseline;
  display: flex;
  gap: 12px;
}

.role-management__section-title-row {
  align-items: center;
  display: flex;
  gap: 8px;
}

.role-management__section-title-row--compact {
  margin-bottom: 8px;
}

.role-management__title {
  color: var(--role-title);
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
}

.role-management__meta {
  color: var(--role-muted);
  font-size: 13px;
  line-height: 20px;
}

.role-management__filter-panel,
.role-management__permission-filter-panel {
  margin-bottom: 12px;
}

.role-management__filter-panel,
.role-management__permission-filter-panel {
  padding: 12px;
  border: 1px solid var(--role-border);
  border-radius: 10px;
  background: var(--role-card-bg-strong);
}

.role-management__filter-row {
  align-items: center;
}

.role-management__permission-filter-grid {
  display: grid;
  grid-template-columns: minmax(220px, 1.35fr) minmax(180px, 0.9fr) minmax(176px, auto);
  gap: 10px;
  align-items: center;
}

.role-management__permission-filter-actions {
  display: grid;
  grid-template-columns: minmax(84px, 1fr) minmax(84px, 1fr);
  gap: 8px;
  justify-self: end;
  width: 184px;
}

.role-management__keyword-filter-col {
  max-width: 320px;
}

.role-management__scope-filter-col {
  max-width: 150px;
}

.role-management__tenant-filter-col {
  max-width: 220px;
}

.role-management__filter-control {
  width: 100%;
}

.role-management__tenant-filter-col :deep(.ant-select),
.role-management__tenant-filter-col :deep(.ant-input-affix-wrapper),
.role-management__tenant-filter-col :deep(.ant-input) {
  width: 100%;
}

.role-management__filter-actions-col {
  display: flex;
  justify-content: flex-end;
  margin-left: auto;
  max-width: 204px;
}

.role-management__filter-buttons {
  display: grid;
  grid-template-columns: minmax(84px, 1fr) minmax(84px, 1fr);
  gap: 8px;
  margin-left: auto;
  width: min(100%, 184px);
}

.role-management__filter-button {
  min-width: 0;
  width: 100%;
}

.role-management__resizable-title {
  position: relative;
  display: flex;
  align-items: center;
  min-height: 24px;
  padding-right: 12px;
}

.role-management__resizable-title-text {
  min-width: 0;
}

.role-management__column-resizer {
  position: absolute;
  top: -12px;
  right: -10px;
  bottom: -12px;
  z-index: 2;
  width: 14px;
  cursor: col-resize;
}

.role-management__column-resizer::after {
  position: absolute;
  top: 12px;
  bottom: 12px;
  left: 6px;
  width: 1px;
  content: '';
  background: rgb(15 23 42 / 14%);
  transition: background 0.16s ease;
}

.role-management__column-resizer:hover::after {
  background: hsl(var(--primary));
}

.role-management__drawer-footer {
  display: flex;
  justify-content: flex-end;
}

.role-management__panel-title {
  color: var(--role-title);
  font-size: 14px;
  font-weight: 600;
  line-height: 22px;
}

.role-management__panel-title--primary {
  font-size: 16px;
  line-height: 24px;
}

.role-management__panel-header {
  align-items: baseline;
  display: flex;
  gap: 10px;
  justify-content: space-between;
  margin-bottom: 10px;
}

.role-management__panel-meta {
  color: var(--role-muted);
  font-size: 12px;
  line-height: 20px;
}

.role-management__detail-grid {
  margin-top: 10px;
}

.role-management__detail-item {
  align-items: baseline;
  border-top: 1px solid var(--role-border);
  display: flex;
  gap: 18px;
  padding-top: 10px;
}

.role-management__detail-label {
  color: var(--role-muted);
  flex: 0 0 72px;
  font-size: 12px;
  line-height: 20px;
}

.role-management__detail-value {
  color: var(--role-text);
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 13px;
  line-height: 20px;
}

.role-management__detail-key {
  color: var(--role-muted);
}

.role-management__permission-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.role-management__navigation-stack {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.role-management__permission-section {
  display: flex;
  flex-direction: column;
}

.role-management__navigation-panel {
  border: 1px solid var(--role-border);
  border-radius: 8px;
  background: var(--role-card-bg-soft);
  padding: 14px;
}

.role-management__navigation-context {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.role-management__navigation-tabs {
  margin-top: 8px;
}

.role-management__navigation-subsection + .role-management__navigation-subsection {
  margin-top: 18px;
}

.role-management__navigation-subtitle {
  color: var(--role-title);
  font-size: 13px;
  font-weight: 600;
  line-height: 20px;
}

.role-management__navigation-section-intro {
  align-items: center;
  display: flex;
  gap: 10px;
  justify-content: space-between;
  margin-bottom: 12px;
}

.role-management__navigation-feature-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.role-management__navigation-feature-group + .role-management__navigation-feature-group {
  margin-top: 4px;
}

.role-management__navigation-feature-title {
  color: var(--role-title);
  font-size: 13px;
  font-weight: 600;
  line-height: 20px;
  text-transform: none;
}

.role-management__navigation-list {
  border: 1px solid var(--role-border);
  border-radius: 8px;
  background: var(--role-card-bg);
  overflow: hidden;
}

.role-management__navigation-list-head,
.role-management__navigation-list-row {
  align-items: flex-start;
  display: grid;
  gap: 10px;
  grid-template-columns: 32px 32px minmax(0, 1fr);
  padding: 12px;
}

.role-management__navigation-list-head {
  align-items: center;
  background: var(--role-card-bg-strong);
  color: var(--role-muted);
  font-size: 12px;
  line-height: 18px;
}

.role-management__navigation-list-head-main {
  min-width: 0;
}

.role-management__navigation-list-flag {
  text-align: center;
}

.role-management__navigation-list-row + .role-management__navigation-list-row {
  border-top: 1px solid var(--role-border);
}

.role-management__navigation-list-check,
.role-management__navigation-list-radio {
  align-items: center;
  display: inline-flex;
  justify-content: center;
  margin-inline-start: 0;
}

.role-management__navigation-list-check :deep(.ant-checkbox),
.role-management__navigation-list-radio :deep(.ant-radio) {
  margin-top: 0;
}

.role-management__navigation-option-main {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 4px;
  min-width: 0;
}

.role-management__navigation-option-top {
  align-items: center;
  display: flex;
  gap: 12px;
  justify-content: space-between;
  min-width: 0;
  width: 100%;
}

.role-management__navigation-option-bottom {
  min-width: 0;
  width: 100%;
}

.role-management__navigation-option-title {
  color: var(--role-title);
  font-size: 13px;
  font-weight: 500;
  line-height: 20px;
  min-width: 0;
}

.role-management__navigation-option-key {
  color: var(--role-muted);
  font-size: 12px;
  line-height: 18px;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.role-management__navigation-option-priority {
  background: var(--role-card-bg-strong);
  border: 1px solid var(--role-border);
  border-radius: 999px;
  color: var(--role-muted);
  flex: 0 0 auto;
  font-size: 12px;
  line-height: 18px;
  padding: 1px 8px;
}

.role-management__navigation-override-shell {
  border-top: 1px solid var(--role-border);
  margin-top: 12px;
  padding-top: 12px;
}

.role-management__navigation-override-header {
  align-items: center;
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.role-management__navigation-footer {
  display: flex;
  justify-content: flex-end;
}

.role-management__help-dot {
  align-items: center;
  background: var(--role-card-bg-strong);
  border-radius: 999px;
  color: var(--role-muted);
  cursor: help;
  display: inline-flex;
  font-size: 12px;
  font-weight: 600;
  height: 18px;
  justify-content: center;
  line-height: 1;
  width: 18px;
}

:deep(.role-management__card .ant-table),
:deep(.role-management__card .ant-table-container) {
  background: transparent;
}

:deep(.role-management__instance-table .ant-table-cell) {
  white-space: nowrap;
}

:deep(.role-management__instance-table .ant-table-thead > tr > th) {
  position: relative;
  user-select: none;
}

:deep(.role-management__permission-table .ant-table-cell) {
  white-space: nowrap;
}

:deep(.role-management__permission-table .ant-table-thead > tr > th) {
  position: relative;
  user-select: none;
}

:deep(.role-management__card .ant-table-thead > tr > th),
:deep(.role-management__filter-panel),
:deep(.role-management__permission-filter-panel) {
  background: var(--role-card-bg-strong);
  color: var(--role-text);
}

:deep(.role-management__card .ant-input),
:deep(.role-management__card .ant-input-affix-wrapper),
:deep(.role-management__card .ant-select-selector),
:deep(.role-management__card .ant-modal-content),
:deep(.role-management__card .ant-drawer-content),
:deep(.role-management__card .ant-drawer-header) {
  color: var(--role-text);
}

:deep(.role-management__filter-panel .ant-input),
:deep(.role-management__filter-panel .ant-input-affix-wrapper),
:deep(.role-management__filter-panel .ant-select-selector),
:deep(.role-management__permission-filter-panel .ant-input),
:deep(.role-management__permission-filter-panel .ant-input-affix-wrapper),
:deep(.role-management__permission-filter-panel .ant-select-selector) {
  min-height: 36px;
  border-radius: 10px;
}

:deep(.role-management__filter-panel .ant-select-selector),
:deep(.role-management__permission-filter-panel .ant-select-selector) {
  align-items: center;
  display: flex;
}

:deep(.role-management__filter-panel .ant-input-affix-wrapper),
:deep(.role-management__permission-filter-panel .ant-input-affix-wrapper) {
  padding-top: 0;
  padding-bottom: 0;
}

:deep(.role-management__filter-panel .ant-btn),
:deep(.role-management__permission-filter-panel .ant-btn) {
  height: 36px;
  border-radius: 10px;
}

:global(body.role-management--resizing-column) {
  cursor: col-resize;
  user-select: none;
}

.role-management__help-dot--sm {
  height: 16px;
  width: 16px;
}

.role-management__terminal-access-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.role-management__terminal-access-hero {
  align-items: flex-start;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  background: hsl(var(--card));
  padding: 14px 16px;
}

.role-management__terminal-access-title {
  color: hsl(var(--foreground));
  font-size: 15px;
  font-weight: 700;
  line-height: 22px;
}

.role-management__terminal-access-description {
  color: hsl(var(--muted-foreground));
  font-size: 13px;
  line-height: 20px;
  margin-top: 2px;
}

.role-management__terminal-group {
  align-self: stretch;
  display: grid;
  gap: 8px;
  width: 100%;
}

.role-management__terminal-card {
  align-items: center;
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  background: hsl(var(--card));
  cursor: pointer;
  margin-inline-start: 0;
  min-height: 72px;
  padding: 12px 14px;
  transition:
    background 0.16s ease,
    border-color 0.16s ease;
  width: 100%;
}

.role-management__terminal-card:hover {
  border-color: hsl(var(--primary) / 0.36);
}

.role-management__terminal-card--active {
  border-color: hsl(var(--primary) / 0.58);
  background: hsl(var(--primary) / 0.06);
}

.role-management__terminal-card-main {
  align-items: center;
  display: flex;
  gap: 10px;
  min-width: 0;
}

.role-management__terminal-card-icon {
  align-items: center;
  background: hsl(var(--primary) / 0.08);
  border-radius: 6px;
  color: hsl(var(--primary));
  display: inline-flex;
  flex: 0 0 30px;
  height: 30px;
  justify-content: center;
  width: 30px;
}

.role-management__terminal-card-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.role-management__terminal-card-title {
  color: hsl(var(--foreground));
  font-size: 14px;
  font-weight: 700;
  line-height: 20px;
}

.role-management__terminal-card-desc {
  color: hsl(var(--muted-foreground));
  font-size: 12px;
  line-height: 18px;
}

:deep(.role-management__terminal-group .ant-checkbox-wrapper) {
  margin-inline-start: 0;
}

:deep(.role-management__terminal-card .ant-checkbox) {
  margin-top: 0;
}

@media (max-width: 991px) {
  .role-management__filter-actions-col {
    justify-content: flex-end;
  }

  .role-management__filter-buttons {
    width: min(100%, 184px);
  }
}

@media (max-width: 767px) {
  .role-management__permission-filter-grid {
    grid-template-columns: 1fr;
  }

  .role-management__permission-filter-actions {
    width: min(100%, 184px);
  }

  .role-management__keyword-filter-col,
  .role-management__scope-filter-col,
  .role-management__tenant-filter-col,
  .role-management__filter-actions-col {
    flex: 1 1 100% !important;
    max-width: 100%;
  }

  .role-management__panel-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .role-management__navigation-section-intro {
    align-items: flex-start;
    flex-direction: column;
  }

  .role-management__navigation-context {
    align-items: flex-start;
    flex-direction: column;
    gap: 4px;
  }

  .role-management__navigation-option-main {
    align-items: flex-start;
  }

  .role-management__navigation-option-top {
    align-items: flex-start;
    flex-direction: column;
    gap: 6px;
  }

  .role-management__navigation-option-key {
    white-space: normal;
  }
}
</style>
