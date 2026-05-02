<script lang="ts" setup>
import type { PermissionManagementApi } from '#/api';
import type { TableColumnsType } from 'ant-design-vue';
import type { SorterResult } from 'ant-design-vue/es/table/interface';

import { computed, h, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import {
  Button,
  Card,
  Col,
  Drawer,
  Dropdown,
  Empty,
  Form,
  Input,
  Menu,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  message,
} from 'ant-design-vue';

import {
  createPermissionApi,
  deletePermissionApi,
  getPermissionByIdApi,
  listPermissionRolesApi,
  listPermissionsApi,
  updatePermissionApi,
} from '#/api';
import { useAuthContextStore } from '#/store/auth-context';
import {
  buildPermissionModuleSelectOptions,
  buildPermissionModuleOptions,
  type PermissionCodeSortOrder,
  buildPermissionTablePagination,
  collectPermissionModuleOptions,
  sortPermissionsByCode,
} from './permission-management.helpers';

type PermissionFormMode = 'create' | 'edit';
type PermissionActionKey = 'delete' | 'edit' | 'roles';

interface PermissionFilterState {
  keyword: string;
  module: string;
}

interface PermissionFormState {
  code: string;
  description: string;
  module: string;
}

const authContextStore = useAuthContextStore();

const filters = reactive<PermissionFilterState>({
  keyword: '',
  module: '',
});
const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
});
const formState = reactive<PermissionFormState>({
  code: '',
  description: '',
  module: '',
});

const loading = ref(false);
const saving = ref(false);
const deleting = ref(false);
const detailLoading = ref(false);
const roleReferencesLoading = ref(false);
const createModalOpen = ref(false);
const detailDrawerOpen = ref(false);
const editDrawerOpen = ref(false);
const formModuleSearch = ref('');
const roleReferencesDrawerOpen = ref(false);
const formMode = ref<PermissionFormMode>('create');
const codeSortOrder = ref<PermissionCodeSortOrder>(null);
const moduleOptions = ref<{ label: string; value: string }[]>([]);
const permissions = ref<PermissionManagementApi.Permission[]>([]);
const selectedPermission = ref<PermissionManagementApi.Permission | null>(null);
const roleReferences = ref<PermissionManagementApi.RoleReference[]>([]);

const canCreatePermission = computed(() =>
  authContextStore.actionCodes.includes('permission.create'),
);
const canDeletePermission = computed(() =>
  authContextStore.actionCodes.includes('permission.delete'),
);
const canListPermissionRoles = computed(() =>
  authContextStore.actionCodes.includes('permission.role_instance.list'),
);
const canUpdatePermission = computed(() =>
  authContextStore.actionCodes.includes('permission.update'),
);

const formModuleFieldOptions = computed(() =>
  buildPermissionModuleSelectOptions(
    moduleOptions.value,
    formModuleSearch.value || formState.module,
  ),
);

const tablePagination = computed(() => ({
  ...buildPermissionTablePagination({
    current: pagination.current,
    pageSize: pagination.pageSize,
    total: pagination.total,
  }),
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

// Resets the mutable permission form according to the current operation mode.
function resetForm(permission?: PermissionManagementApi.Permission) {
  formState.code = permission?.code ?? '';
  formState.description = permission?.description ?? '';
  formState.module = permission?.module ?? '';
  formModuleSearch.value = '';
}

// Validates the permission form before calling the Gateway management contract.
function validateForm() {
  if (formMode.value === 'create' && !formState.code.trim()) {
    message.warning('请填写权限码');
    return false;
  }

  if (!formState.module.trim()) {
    message.warning('请填写所属模块');
    return false;
  }

  return true;
}

// Loads one page of global permission dictionary entries.
async function loadPermissions(options?: { page?: number }) {
  loading.value = true;

  try {
    const result = await listPermissionsApi({
      keyword: filters.keyword.trim() || undefined,
      module: filters.module.trim() || undefined,
      page: options?.page ?? pagination.current,
      pageSize: pagination.pageSize,
    });

    permissions.value = sortPermissionsByCode(
      result.permissions ?? [],
      codeSortOrder.value,
    );
    pagination.current = result.page || options?.page || pagination.current;
    pagination.pageSize = result.pageSize || pagination.pageSize;
    pagination.total = result.total || 0;
  } catch (error) {
    permissions.value = [];
    pagination.total = 0;
    message.error(getErrorMessage(error, '加载权限列表失败，请稍后重试'));
  } finally {
    loading.value = false;
  }
}

// Loads stable module options for the permission-management filter without changing backend contracts.
async function loadModuleOptions() {
  try {
    moduleOptions.value = await collectPermissionModuleOptions(
      ({ page, pageSize }) =>
        listPermissionsApi({
          page,
          pageSize,
        }),
      filters.module,
    );
  } catch {
    moduleOptions.value = buildPermissionModuleOptions([], filters.module);
  }
}

// Applies filter changes and reloads the first permission page.
async function searchPermissions() {
  pagination.current = 1;
  await loadPermissions({ page: 1 });
}

// Clears all permission filters and reloads the first page.
async function resetFilters() {
  filters.keyword = '';
  filters.module = '';
  await loadModuleOptions();
  await searchPermissions();
}

// Keeps table pagination state aligned with Ant Design table changes.
async function handleTableChange(
  pager: { current?: number; pageSize?: number },
  _filters?: unknown,
  sorter?: SorterResult<PermissionManagementApi.Permission> | SorterResult<PermissionManagementApi.Permission>[],
) {
  const previousPage = pagination.current;
  const previousPageSize = pagination.pageSize;
  const nextSortOrder = Array.isArray(sorter)
    ? null
    : (sorter?.columnKey === 'code' ? sorter.order ?? null : null);
  const sortOrderChanged = codeSortOrder.value !== nextSortOrder;
  const nextPage = pager.current ?? 1;
  const nextPageSize = pager.pageSize ?? pagination.pageSize;
  const paginationChanged =
    nextPage !== previousPage || nextPageSize !== previousPageSize;

  codeSortOrder.value = nextSortOrder;
  pagination.current = nextPage;
  pagination.pageSize = nextPageSize;

  if (sortOrderChanged) {
    permissions.value = sortPermissionsByCode(
      permissions.value,
      codeSortOrder.value,
    );
  }

  if (paginationChanged) {
    await loadPermissions({ page: pagination.current });
  }
}

// Opens the create modal with an empty permission form.
function openCreateModal() {
  formMode.value = 'create';
  selectedPermission.value = null;
  resetForm();
  createModalOpen.value = true;
}

// Opens the edit drawer for mutable permission metadata.
function openEditDrawer(permission: PermissionManagementApi.Permission) {
  formMode.value = 'edit';
  selectedPermission.value = permission;
  resetForm(permission);
  editDrawerOpen.value = true;
}

// Clears transient form UI state when the permission form is closed.
function closePermissionForm() {
  createModalOpen.value = false;
  editDrawerOpen.value = false;
  formModuleSearch.value = '';
}

// Tracks the current module search text so form selects can offer a selectable new module value.
function handleFormModuleSearch(value: string) {
  formModuleSearch.value = value;
}

// Persists either a new permission or editable metadata for an existing permission.
async function submitPermissionForm() {
  if (!validateForm()) {
    return;
  }

  saving.value = true;

  try {
    if (formMode.value === 'create') {
      await createPermissionApi({
        code: formState.code.trim(),
        description: formState.description.trim() || undefined,
        module: formState.module.trim(),
      });
      message.success('权限已创建');
    } else if (selectedPermission.value) {
      await updatePermissionApi(selectedPermission.value.id, {
        description: formState.description.trim() || undefined,
        module: formState.module.trim(),
      });
      message.success('权限元数据已更新');
    }

    closePermissionForm();
    await Promise.all([loadPermissions(), loadModuleOptions()]);
  } catch (error) {
    message.error(getErrorMessage(error, '保存权限失败，请稍后重试'));
  } finally {
    saving.value = false;
  }
}

// Loads one permission detail record by id and opens the detail drawer.
async function openDetailDrawer(permission: PermissionManagementApi.Permission) {
  detailDrawerOpen.value = true;
  selectedPermission.value = permission;
  detailLoading.value = true;

  try {
    selectedPermission.value = await getPermissionByIdApi(permission.id);
  } catch (error) {
    message.error(getErrorMessage(error, '加载权限详情失败，请稍后重试'));
  } finally {
    detailLoading.value = false;
  }
}

// Loads role references for one permission and opens the reference drawer.
async function openRoleReferencesDrawer(permission: PermissionManagementApi.Permission) {
  if (!canListPermissionRoles.value) {
    message.warning('当前账号没有查看权限引用角色的操作权限');
    return;
  }

  selectedPermission.value = permission;
  roleReferencesDrawerOpen.value = true;
  roleReferencesLoading.value = true;

  try {
    const result = await listPermissionRolesApi(permission.id);
    roleReferences.value = result.roles ?? [];
  } catch (error) {
    roleReferences.value = [];
    message.error(getErrorMessage(error, '加载引用角色失败，请稍后重试'));
  } finally {
    roleReferencesLoading.value = false;
  }
}

// Deletes one permission after explicit administrator confirmation.
function confirmDeletePermission(permission: PermissionManagementApi.Permission) {
  if (!canDeletePermission.value) {
    message.warning('当前账号没有删除权限');
    return;
  }

  Modal.confirm({
    cancelText: '取消',
    content: `删除 ${permission.code} 前请确认没有角色或 Policy 正在引用它。`,
    okText: '确认删除',
    okType: 'danger',
    title: '删除权限',
    async onOk() {
      deleting.value = true;

      try {
        await deletePermissionApi(permission.id);
        message.success('权限已删除');
        await loadPermissions();
      } catch (error) {
        message.error(getErrorMessage(error, '删除权限失败，请稍后重试'));
      } finally {
        deleting.value = false;
      }
    },
  });
}

// Routes one permission row action from the compact dropdown menu to the existing handlers.
function handlePermissionAction(
  permission: PermissionManagementApi.Permission,
  key: PermissionActionKey,
) {
  switch (key) {
    case 'roles': {
      void openRoleReferencesDrawer(permission);
      return;
    }
    case 'edit': {
      openEditDrawer(permission);
      return;
    }
    case 'delete': {
      confirmDeletePermission(permission);
      return;
    }
  }
}

const permissionColumns = computed<TableColumnsType<PermissionManagementApi.Permission>>(() => [
  {
    dataIndex: 'code',
    key: 'code',
    sorter: true,
    sortOrder: codeSortOrder.value ?? undefined,
    title: '权限码',
    width: 420,
    ellipsis: true,
    customRender: ({ record }) => {
      const permission = record as PermissionManagementApi.Permission;
      return h(
        Button,
        {
          size: 'small',
          type: 'link',
          onClick: () => openDetailDrawer(permission),
        },
        { default: () => permission.code },
      );
    },
  },
  {
    dataIndex: 'module',
    key: 'module',
    title: '模块',
    width: 200,
    customRender: ({ value }) =>
      h(Tag, { color: 'blue' }, { default: () => value || 'UNKNOWN' }),
  },
  {
    dataIndex: 'description',
    key: 'description',
    title: '说明',
    ellipsis: true,
    customRender: ({ value }) => value || '-',
  },
  {
    fixed: 'right',
    key: 'actions',
    title: '操作',
    width: 110,
    customRender: ({ record }) => {
      const permission = record as PermissionManagementApi.Permission;
      const items: Array<{
        danger?: boolean;
        disabled?: boolean;
        key: PermissionActionKey;
        label: string;
      }> = [];

      if (canListPermissionRoles.value) {
        items.push({
          key: 'roles',
          label: '引用角色',
        });
      }

      if (canUpdatePermission.value) {
        items.push({
          key: 'edit',
          label: '编辑',
        });
      }

      if (canDeletePermission.value) {
        items.push({
          danger: true,
          disabled: deleting.value,
          key: 'delete',
          label: '删除',
        });
      }

      if (items.length === 0) {
        return null;
      }

      return h(
        Dropdown,
        {
          trigger: ['click'],
        },
        {
          overlay: () =>
            h(
              Menu,
              {
                onClick: ({ key }: { key: string | number }) =>
                  handlePermissionAction(
                    permission,
                    String(key) as PermissionActionKey,
                  ),
              },
              () =>
                items.map((item) =>
                  h(
                    Menu.Item,
                    {
                      danger: item.danger,
                      disabled: item.disabled,
                      key: item.key,
                    },
                    { default: () => item.label },
                  ),
                ),
            ),
          default: () =>
            h(
              Button,
              {
                'aria-label': '权限操作',
                class: 'inline-flex items-center justify-center',
                shape: 'circle',
                size: 'small',
                type: 'text',
              },
              {
                icon: () =>
                  h(IconifyIcon, {
                    class: 'size-4',
                    icon: 'ant-design:more-outlined',
                  }),
              },
            ),
        },
      );
    },
  },
]);

const roleReferenceColumns: TableColumnsType<PermissionManagementApi.RoleReference> = [
  {
    dataIndex: 'name',
    key: 'name',
    title: '角色名称',
    width: 180,
  },
  {
    dataIndex: 'code',
    key: 'code',
    title: '角色码',
    width: 220,
    ellipsis: true,
  },
  {
    dataIndex: 'roleKind',
    key: 'roleKind',
    title: '类型',
    width: 170,
    customRender: ({ value }) =>
      h(Tag, { color: 'purple' }, { default: () => value || 'UNKNOWN' }),
  },
  {
    dataIndex: 'tenantId',
    key: 'tenantId',
    title: '租户',
    ellipsis: true,
    customRender: ({ value }) => value || '系统范围',
  },
  {
    dataIndex: 'isEnabled',
    key: 'isEnabled',
    title: '状态',
    width: 100,
    customRender: ({ value }) =>
      h(
        Tag,
        { color: value === false ? 'red' : 'green' },
        { default: () => (value === false ? '停用' : '启用') },
      ),
  },
];

onMounted(() => {
  void Promise.all([loadPermissions(), loadModuleOptions()]);
});
</script>

<template>
  <Page title="权限管理">
    <div class="permission-management-page">
      <Card :bordered="false" class="permission-management__panel">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <div class="permission-management__section-title permission-management__section-title--primary">
              权限目录
            </div>
            <Tooltip title="权限码创建后保持稳定；编辑入口只维护模块和说明。">
              <span
                class="permission-management__help-dot"
              >
                ?
              </span>
            </Tooltip>
          </div>
          <Button
            :disabled="!canCreatePermission"
            type="primary"
            @click="openCreateModal"
          >
            创建权限
          </Button>
        </div>

        <Form layout="vertical">
          <Row :gutter="16" class="permission-management__filter-row">
            <Col :lg="10" :md="12" :xs="24">
              <Form.Item label="关键词">
                <Input
                  v-model:value="filters.keyword"
                  allow-clear
                  placeholder="搜索权限码或说明"
                  @press-enter="searchPermissions"
                />
              </Form.Item>
            </Col>
            <Col :lg="8" :md="12" :xs="24">
              <Form.Item label="模块">
                <Select
                  v-model:value="filters.module"
                  allow-clear
                  :options="moduleOptions"
                  option-filter-prop="label"
                  placeholder="选择模块"
                  show-search
                />
              </Form.Item>
            </Col>
            <Col
              :lg="6"
              :md="24"
              :xs="24"
              class="permission-management__filter-actions-col"
            >
              <Form.Item label=" " :colon="false">
                <Space wrap class="permission-management__filter-actions">
                  <Button type="primary" @click="searchPermissions">
                    查询
                  </Button>
                  <Button @click="resetFilters">重置</Button>
                </Space>
              </Form.Item>
            </Col>
          </Row>
        </Form>

        <Table
          :columns="permissionColumns"
          :data-source="permissions"
          :loading="loading"
          :locale="{ emptyText: '暂无权限数据' }"
          :pagination="tablePagination"
          :row-key="(record) => record.id"
          :scroll="{ x: 1120 }"
          size="middle"
          @change="handleTableChange"
        />
      </Card>
    </div>

    <Modal
      :confirm-loading="saving"
      :body-style="{ paddingTop: '12px' }"
      :open="createModalOpen"
      destroy-on-close
      ok-text="保存"
      title="创建权限"
      wrap-class-name="permission-management__create-modal-wrap"
      width="360"
      @cancel="closePermissionForm"
      @ok="submitPermissionForm"
    >
      <div>
        <Form layout="vertical">
          <Form.Item label="权限码" required>
            <Input
              v-model:value="formState.code"
              placeholder="例如 permission.audit.list"
            />
          </Form.Item>
          <Form.Item label="模块" required>
            <Select
              v-model:value="formState.module"
              :options="formModuleFieldOptions"
              option-filter-prop="label"
              placeholder="选择或输入模块"
              show-search
              @search="handleFormModuleSearch"
            />
          </Form.Item>
          <Form.Item class="mb-0" label="说明">
            <Input.TextArea
              v-model:value="formState.description"
              :maxlength="512"
              :rows="3"
              placeholder="描述权限的业务含义"
              show-count
            />
          </Form.Item>
        </Form>
      </div>
    </Modal>

    <Drawer
      :open="editDrawerOpen"
      title="编辑权限元数据"
      width="520"
      @close="closePermissionForm"
    >
      <Form layout="vertical">
        <Form.Item required>
          <template #label>
            <span class="inline-flex items-center gap-2">
              <span>权限码</span>
              <Tooltip title="已创建的权限码保持稳定，编辑时不提供修改入口。">
                <span
                  class="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-gray-200 text-[10px] text-gray-500"
                >
                  ?
                </span>
              </Tooltip>
            </span>
          </template>
          <Input
            v-model:value="formState.code"
            disabled
            placeholder="例如 permission.audit.list"
          />
        </Form.Item>
        <Form.Item label="模块" required>
          <Select
            v-model:value="formState.module"
            :options="formModuleFieldOptions"
            option-filter-prop="label"
            placeholder="选择或输入模块"
            show-search
            @search="handleFormModuleSearch"
          />
        </Form.Item>
        <Form.Item label="说明">
          <Input.TextArea
            v-model:value="formState.description"
            :maxlength="512"
            :rows="4"
            placeholder="描述权限的业务含义"
            show-count
          />
        </Form.Item>
      </Form>

      <template #footer>
        <div class="flex justify-end gap-2">
          <Button @click="closePermissionForm">取消</Button>
          <Button
            :loading="saving"
            type="primary"
            @click="submitPermissionForm"
          >
            保存
          </Button>
        </div>
      </template>
    </Drawer>

    <Drawer
      :open="detailDrawerOpen"
      title="权限详情"
      width="520"
      @close="detailDrawerOpen = false"
    >
      <div v-if="selectedPermission" v-loading="detailLoading" class="permission-management__detail-content">
        <div>
          <div class="permission-management__detail-label">权限码</div>
          <div class="permission-management__detail-value permission-management__detail-value--mono">
            {{ selectedPermission.code }}
          </div>
        </div>
        <div>
          <div class="permission-management__detail-label">模块</div>
          <div class="permission-management__detail-tag-row">
            <Tag color="blue">{{ selectedPermission.module }}</Tag>
          </div>
        </div>
        <div>
          <div class="permission-management__detail-label">说明</div>
          <div class="permission-management__detail-value permission-management__detail-value--multiline">
            {{ selectedPermission.description || '暂无说明' }}
          </div>
        </div>
      </div>
      <Empty v-else description="未选择权限" />
    </Drawer>

    <Drawer
      :open="roleReferencesDrawerOpen"
      :title="`引用角色：${selectedPermission?.code || '-'}`"
      width="68%"
      @close="roleReferencesDrawerOpen = false"
    >
      <Table
        :columns="roleReferenceColumns"
        :data-source="roleReferences"
        :loading="roleReferencesLoading"
        :pagination="false"
        :row-key="(record) => record.id"
        :scroll="{ x: 860 }"
        size="middle"
      />
    </Drawer>
  </Page>
</template>

<style scoped>
.permission-management-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  --permission-border: hsl(var(--border));
  --permission-card-bg: hsl(var(--card));
  --permission-card-bg-strong: hsl(var(--muted) / 0.82);
  --permission-title: hsl(var(--foreground));
  --permission-text: hsl(var(--foreground) / 0.92);
  --permission-muted: hsl(var(--muted-foreground));
}

.permission-management__panel :deep(.ant-card-body) {
  padding: 16px;
  background: var(--permission-card-bg);
}

.permission-management__panel {
  border: 1px solid var(--permission-border);
  background: var(--permission-card-bg);
  box-shadow: 0 18px 40px rgb(15 23 42 / 0.05);
}

.permission-management__filter-row {
  align-items: center;
}

.permission-management__filter-actions-col {
  display: flex;
  justify-content: flex-end;
}

.permission-management__filter-actions {
  justify-content: flex-end;
  width: 100%;
}

.permission-management__section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--permission-muted);
}

.permission-management__section-title--primary {
  font-size: 16px;
  color: var(--permission-title);
}

.permission-management__help-dot {
  display: inline-flex;
  width: 18px;
  height: 18px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--permission-border);
  border-radius: 9999px;
  cursor: help;
  font-size: 11px;
  line-height: 1;
  background: var(--permission-card-bg-strong);
  color: var(--permission-muted);
}

.permission-management__detail-content {
  display: grid;
  gap: 16px;
}

.permission-management__detail-label {
  color: var(--permission-muted);
  font-size: 12px;
}

.permission-management__detail-value {
  color: var(--permission-text);
  font-size: 14px;
  margin-top: 4px;
}

.permission-management__detail-value--mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  word-break: break-all;
}

.permission-management__detail-value--multiline {
  white-space: pre-wrap;
}

.permission-management__detail-tag-row {
  margin-top: 4px;
}

:deep(.permission-management__panel .ant-table),
:deep(.permission-management__panel .ant-table-container) {
  background: transparent;
}

:deep(.permission-management__panel .ant-table-thead > tr > th) {
  background: var(--permission-card-bg-strong);
  color: var(--permission-text);
}

:deep(.permission-management__panel .ant-input),
:deep(.permission-management__panel .ant-input-affix-wrapper),
:deep(.permission-management__panel .ant-select-selector),
:deep(.permission-management__panel .ant-modal-content),
:deep(.permission-management__panel .ant-drawer-content),
:deep(.permission-management__panel .ant-drawer-header) {
  color: var(--permission-text);
}

@media (max-width: 991px) {
  .permission-management__filter-actions-col {
    justify-content: flex-start;
  }

  .permission-management__filter-actions {
    justify-content: flex-start;
  }
}

</style>

<style>
.permission-management__create-modal-wrap .ant-modal {
  width: 360px !important;
  max-width: calc(100vw - 32px);
}
</style>
