<script setup lang="ts">
import type { AccountRoleManagementApi, AdminSecurityApi } from '#/api';
import type { MenuProps, TableColumnsType, TablePaginationConfig } from 'ant-design-vue';
import type {
  AccountManagementRow,
  AccountScopeFilter,
  AccountStatusFilter,
} from './account-management.helpers';

import { computed, h, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  Checkbox,
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
  Switch,
  Table,
  Tag,
  message,
} from 'ant-design-vue';

import {
  createAdminAccountApi,
  disableAdminAccountLoginMethodApi,
  enableAdminAccountLoginMethodApi,
  getAdminAccountBasicInfoApi,
  getAccountRoleSelectionApi,
  listAdminAccountLoginMethodsApi,
  listAdminAccountsApi,
  listAdminAccountTenantOptionsApi,
  requireAdminAccountPasswordSetupApi,
  setAccountRolesApi,
  updateAdminAccountBasicInfoApi,
} from '#/api';
import { useAuthContextStore } from '#/store/auth-context';

import {
  buildAccountRows,
  getAccountScopeLabel,
  getAccountStatusLabel,
  getRoleKindLabel,
  getSelectedRoleSummary,
} from './account-management.helpers';
import PhoneNumberInput from '../_core/authentication/phone-number-input.vue';

interface AccountFilterState {
  keyword: string;
  scopeLevel: AccountScopeFilter;
  status: AccountStatusFilter;
}

interface CreateAccountFormState {
  displayName: string;
  email: string;
  phone: string;
  scopeLevel: 'SYSTEM' | 'TENANT';
  tenantId: string;
}

interface AccountBasicInfoFormState {
  displayName: string;
  email: string;
  isEnabled: boolean;
  phone: string;
}

const authContextStore = useAuthContextStore();

const accountFilters = reactive<AccountFilterState>({
  keyword: '',
  scopeLevel: '',
  status: '',
});
const createAccountForm = reactive<CreateAccountFormState>({
  displayName: '',
  email: '',
  phone: '',
  scopeLevel: 'TENANT',
  tenantId: '',
});

const accountRows = ref<AccountManagementRow[]>([]);
const accountLoading = ref(false);
const roleDrawerOpen = ref(false);
const roleLoading = ref(false);
const roleSaving = ref(false);
const roleKeyword = ref('');
const selectedAccount = ref<AccountManagementRow | null>(null);
const availableRoles = ref<AccountRoleManagementApi.Role[]>([]);
const selectedRoleIds = ref<string[]>([]);
const createModalOpen = ref(false);
const createSaving = ref(false);
const tenantOptionLoading = ref(false);
const tenantOptions = ref<AdminSecurityApi.TenantOption[]>([]);
const basicInfoModalOpen = ref(false);
const basicInfoLoading = ref(false);
const basicInfoSaving = ref(false);
const selectedBasicInfo = ref<AdminSecurityApi.AccountBasicInfo | null>(null);
const loginMethodModalOpen = ref(false);
const loginMethodLoading = ref(false);
const loginMethodSaving = ref(false);
const selectedSecurityAccount = ref<AccountManagementRow | null>(null);
const selectedAccountLoginMethods = ref<AdminSecurityApi.LoginMethod[]>([]);
const selectedAccountPasswordSetupRequired = ref(false);
const basicInfoForm = reactive<AccountBasicInfoFormState>({
  displayName: '',
  email: '',
  isEnabled: true,
  phone: '',
});

const accountPagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
});

const isPlatformScope = computed(() => authContextStore.isPlatformScope);
const showTenantColumn = computed(() => isPlatformScope.value);
const currentTenantId = computed(
  () => authContextStore.sessionContext?.tenant?.tenantId ?? '',
);
const currentTenantName = computed(
  () => authContextStore.tenantName || currentTenantId.value || '-',
);

const canReadAccountRoles = computed(() =>
  authContextStore.actionCodes.includes('permission.account.get_roles'),
);
const canSetAccountRoles = computed(() =>
  authContextStore.actionCodes.includes('permission.account.assign_roles'),
);
const canCreateAccount = computed(() =>
  authContextStore.actionCodes.includes('identity.account.create'),
);
const canUpdateAccountStatus = computed(() =>
  authContextStore.actionCodes.includes('identity.account.update_status'),
);
const canUpdateAccountProfile = computed(() =>
  authContextStore.actionCodes.includes('identity.account.profile.update'),
);
const canManageLoginMethods = computed(() =>
  authContextStore.actionCodes.includes('auth.account_login_methods.manage'),
);

const filteredRoles = computed(() => {
  const keyword = roleKeyword.value.trim().toLowerCase();

  if (!keyword) {
    return availableRoles.value;
  }

  return availableRoles.value.filter((role) =>
    [role.name, role.code]
      .filter(Boolean)
      .some((field) => field.toLowerCase().includes(keyword)),
  );
});
const roleSummary = computed(() =>
  getSelectedRoleSummary(selectedRoleIds.value.length, availableRoles.value.length),
);
const roleSearchSummary = computed(() => {
  const visibleCount = filteredRoles.value.length;
  const totalCount = availableRoles.value.length;

  if (!roleKeyword.value.trim()) {
    return roleSummary.value;
  }

  return `当前显示 ${visibleCount} / ${totalCount} 个角色，已选择 ${selectedRoleIds.value.length} 个角色`;
});
const scopeOptions = computed(() => {
  const options = [
    { label: '全部 Scope', value: '' },
    { label: '系统账号', value: 'SYSTEM' },
    { label: '租户账号', value: 'TENANT' },
  ];

  return isPlatformScope.value
    ? options
    : options.filter((option) => option.value !== 'SYSTEM');
});
const createScopeOptions = computed(() => {
  const options = [
    { label: '系统账号', value: 'SYSTEM' },
    { label: '租户账号', value: 'TENANT' },
  ];

  return isPlatformScope.value
    ? options
    : options.filter((option) => option.value !== 'SYSTEM');
});
const statusOptions = [
  { label: '全部状态', value: '' },
  { label: '启用', value: 'ENABLED' },
  { label: '停用', value: 'DISABLED' },
];
const accountSummaryMeta = computed(() => [
  {
    label: '可见范围',
    value: isPlatformScope.value ? '系统管理员范围' : currentTenantName.value,
  },
  {
    label: '账号总数',
    value: String(accountPagination.total),
  },
]);
const basicInfoPreview = computed(() => {
  if (!selectedBasicInfo.value) {
    return [];
  }

  return [
    {
      label: '账号 ID',
      value: selectedBasicInfo.value.accountId,
    },
    {
      label: '用户 ID',
      value: selectedBasicInfo.value.userId,
    },
    {
      label: 'Scope',
      value: getAccountScopeLabel(selectedBasicInfo.value.scopeLevel),
    },
    {
      label: '状态',
      value: getAccountStatusLabel(basicInfoForm.isEnabled),
    },
    ...(showTenantColumn.value && selectedBasicInfo.value.scopeLevel === 'TENANT'
      ? [
          {
            label: '租户',
            value:
              selectedBasicInfo.value.tenantName
              || selectedBasicInfo.value.tenantId
              || '-',
          },
        ]
      : []),
  ];
});
const canSaveRoles = computed(
  () =>
    Boolean(selectedAccount.value)
    && canSetAccountRoles.value
    && !roleLoading.value
    && !roleSaving.value,
);
const canSaveBasicInfo = computed(
  () =>
    !basicInfoLoading.value
    && !basicInfoSaving.value
    && (canUpdateAccountProfile.value || canUpdateAccountStatus.value),
);

const selectedSecurityAccountTitle = computed(() =>
  selectedSecurityAccount.value
    ? selectedSecurityAccount.value.userDisplayName
      || selectedSecurityAccount.value.userId
      || selectedSecurityAccount.value.accountId
    : '账号登录方式',
);
const tablePagination = computed<TablePaginationConfig>(() => ({
  current: accountPagination.current,
  pageSize: accountPagination.pageSize,
  showQuickJumper: true,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条`,
  total: accountPagination.total,
}));

async function loadAccounts(options?: { page?: number; pageSize?: number }) {
  const page = options?.page ?? accountPagination.current;
  const pageSize = options?.pageSize ?? accountPagination.pageSize;

  accountLoading.value = true;

  try {
    const result = await listAdminAccountsApi({
      keyword: accountFilters.keyword.trim() || undefined,
      page,
      pageSize,
      scopeLevel: accountFilters.scopeLevel || undefined,
      status: accountFilters.status || undefined,
    });
    accountRows.value = buildAccountRows(result.items ?? []);
    accountPagination.current = result.page ?? page;
    accountPagination.pageSize = result.pageSize ?? pageSize;
    accountPagination.total = result.total ?? 0;
  } catch {
    accountRows.value = [];
    accountPagination.total = 0;
    message.error('账号目录加载失败，请稍后重试');
  } finally {
    accountLoading.value = false;
  }
}

function queryAccounts() {
  accountPagination.current = 1;
  void loadAccounts({ page: 1, pageSize: accountPagination.pageSize });
}

function resetAccountFilters() {
  accountFilters.keyword = '';
  accountFilters.scopeLevel = '';
  accountFilters.status = '';
  queryAccounts();
}

function handleTableChange(pagination: TablePaginationConfig) {
  void loadAccounts({
    page: pagination.current ?? 1,
    pageSize: pagination.pageSize ?? accountPagination.pageSize,
  });
}

async function openRoleConfig(account: AccountManagementRow) {
  if (!canReadAccountRoles.value) {
    message.warning('当前账号没有查看账号角色的操作权限');
    return;
  }

  selectedAccount.value = account;
  roleDrawerOpen.value = true;
  roleLoading.value = true;
  roleKeyword.value = '';
  availableRoles.value = [];
  selectedRoleIds.value = [];

  try {
    const result = await getAccountRoleSelectionApi(account.accountId, {
      scopeLevel: account.scopeLevel,
      tenantId: account.scopeLevel === 'TENANT' ? account.tenantId : undefined,
    });
    availableRoles.value = result.availableRoles ?? [];
    selectedRoleIds.value = [...(result.selectedRoleIds ?? [])];
  } catch {
    message.error('角色配置加载失败，请稍后重试');
  } finally {
    roleLoading.value = false;
  }
}

function resetBasicInfoForm() {
  basicInfoForm.displayName = '';
  basicInfoForm.email = '';
  basicInfoForm.isEnabled = true;
  basicInfoForm.phone = '';
}

// Normalizes editable account fields before comparing or submitting changes.
function normalizeBasicInfoValue(value?: null | string) {
  return value?.trim() || '';
}

async function openBasicInfoModal(account: AccountManagementRow) {
  basicInfoModalOpen.value = true;
  basicInfoLoading.value = true;
  selectedBasicInfo.value = null;
  resetBasicInfoForm();

  try {
    const result = await getAdminAccountBasicInfoApi(account.accountId);
    selectedBasicInfo.value = result;
    basicInfoForm.displayName = result.displayName || '';
    basicInfoForm.email = result.email || '';
    basicInfoForm.isEnabled = result.isEnabled;
    basicInfoForm.phone = result.phone || '';
  } catch {
    basicInfoModalOpen.value = false;
    message.error('账号基本信息加载失败，请稍后重试');
  } finally {
    basicInfoLoading.value = false;
  }
}

async function loadAccountLoginMethods(account: AccountManagementRow) {
  loginMethodLoading.value = true;
  try {
    const result = await listAdminAccountLoginMethodsApi(account.accountId);
    selectedAccountLoginMethods.value = result.loginMethods ?? [];
    selectedAccountPasswordSetupRequired.value = Boolean(result.passwordSetupRequired);
  } catch {
    selectedAccountLoginMethods.value = [];
    selectedAccountPasswordSetupRequired.value = false;
    message.error('账号登录方式加载失败，请稍后重试');
  } finally {
    loginMethodLoading.value = false;
  }
}

async function openLoginMethodModal(account: AccountManagementRow) {
  if (!canManageLoginMethods.value) {
    message.warning('当前账号没有管理登录方式的操作权限');
    return;
  }

  selectedSecurityAccount.value = account;
  selectedAccountLoginMethods.value = [];
  selectedAccountPasswordSetupRequired.value = false;
  loginMethodModalOpen.value = true;
  await loadAccountLoginMethods(account);
}

function getLoginMethodTypeLabel(method: AdminSecurityApi.LoginMethod) {
  const labels: Record<string, string> = {
    EMAIL: '邮箱',
    PHONE: '手机',
  };

  return labels[method.type] || method.type || '登录方式';
}

function requirePasswordSetup() {
  const account = selectedSecurityAccount.value;
  if (!account) {
    return;
  }

  Modal.confirm({
    centered: true,
    content: '系统只会要求该用户下次设置新密码，管理员不会录入或看到用户密码。',
    okText: '要求重设密码',
    title: '确认要求该账号重设密码？',
    async onOk() {
      loginMethodSaving.value = true;
      try {
        await requireAdminAccountPasswordSetupApi(account.accountId, {
          reason: '管理员要求重设密码',
        });
        message.success('已要求该账号重设密码');
        await loadAccountLoginMethods(account);
      } finally {
        loginMethodSaving.value = false;
      }
    },
  });
}

async function toggleAccountLoginMethod(method: AdminSecurityApi.LoginMethod) {
  const account = selectedSecurityAccount.value;
  if (!account) {
    return;
  }

  loginMethodSaving.value = true;
  try {
    if (method.enabled) {
      await disableAdminAccountLoginMethodApi(account.accountId, method.methodId, {
        reason: '管理员停用登录方式',
      });
      message.success(`${getLoginMethodTypeLabel(method)} 已停用`);
    } else {
      await enableAdminAccountLoginMethodApi(account.accountId, method.methodId, {
        reason: '管理员启用登录方式',
      });
      message.success(`${getLoginMethodTypeLabel(method)} 已启用`);
    }
    await loadAccountLoginMethods(account);
  } finally {
    loginMethodSaving.value = false;
  }
}

async function submitBasicInfo() {
  if (!selectedBasicInfo.value) {
    return;
  }

  const displayName = normalizeBasicInfoValue(basicInfoForm.displayName);
  const email = normalizeBasicInfoValue(basicInfoForm.email);
  const phone = normalizeBasicInfoValue(basicInfoForm.phone);
  const profileChanged
    = displayName !== normalizeBasicInfoValue(selectedBasicInfo.value.displayName)
      || email !== normalizeBasicInfoValue(selectedBasicInfo.value.email)
      || phone !== normalizeBasicInfoValue(selectedBasicInfo.value.phone);
  const statusChanged = basicInfoForm.isEnabled !== selectedBasicInfo.value.isEnabled;

  if (profileChanged) {
    if (!canUpdateAccountProfile.value) {
      message.warning('当前账号没有编辑基本信息的操作权限');
      return;
    }

    if (!displayName) {
      message.warning('请输入用户姓名');
      return;
    }

    if (!phone && !email) {
      message.warning('请至少保留手机号或邮箱');
      return;
    }

    if (selectedBasicInfo.value.phone && !phone) {
      message.warning('当前阶段暂不支持清空已绑定手机号');
      return;
    }

    if (selectedBasicInfo.value.email && !email) {
      message.warning('当前阶段暂不支持清空已绑定邮箱');
      return;
    }
  }

  if (statusChanged && !canUpdateAccountStatus.value) {
    message.warning('当前账号没有调整账号状态的操作权限');
    return;
  }

  if (!profileChanged && !statusChanged) {
    basicInfoModalOpen.value = false;
    return;
  }

  basicInfoSaving.value = true;

  try {
    let updatedBasicInfo = selectedBasicInfo.value;
    const updatePayload = {
      displayName,
      email: email || undefined,
      isEnabled: basicInfoForm.isEnabled,
      phone: phone || undefined,
    };

    updatedBasicInfo = await updateAdminAccountBasicInfoApi(
      selectedBasicInfo.value.accountId,
      updatePayload,
    );

    if (statusChanged && updatedBasicInfo.isEnabled !== basicInfoForm.isEnabled) {
      updatedBasicInfo = {
        ...updatedBasicInfo,
        isEnabled: basicInfoForm.isEnabled,
      };
    }

    selectedBasicInfo.value = updatedBasicInfo;
    message.success(statusChanged ? '账号基本信息与状态已保存' : '账号基本信息已保存');
    basicInfoModalOpen.value = false;
    await loadAccounts();
  } catch {
    message.error(statusChanged ? '账号信息保存失败，请稍后重试' : '账号基本信息保存失败，请稍后重试');
  } finally {
    basicInfoSaving.value = false;
  }
}

async function saveRoles() {
  if (!selectedAccount.value) {
    return;
  }

  roleSaving.value = true;

  try {
    await setAccountRolesApi(selectedAccount.value.accountId, {
      accountType: 'USER',
      roleIds: selectedRoleIds.value,
      scopeLevel: selectedAccount.value.scopeLevel,
      tenantId:
        selectedAccount.value.scopeLevel === 'TENANT'
          ? selectedAccount.value.tenantId
          : undefined,
    });
    message.success('账号角色已保存');
    await openRoleConfig(selectedAccount.value);
  } catch {
    message.error('账号角色保存失败，请稍后重试');
  } finally {
    roleSaving.value = false;
  }
}

function resetCreateAccountForm() {
  createAccountForm.displayName = '';
  createAccountForm.email = '';
  createAccountForm.phone = '';
  createAccountForm.scopeLevel = isPlatformScope.value ? 'TENANT' : 'TENANT';
  createAccountForm.tenantId = isPlatformScope.value ? '' : currentTenantId.value;
}

async function loadTenantOptions(keyword = '') {
  if (!isPlatformScope.value) {
    return;
  }

  tenantOptionLoading.value = true;

  try {
    const result = await listAdminAccountTenantOptionsApi({
      keyword: keyword.trim() || undefined,
      pageSize: 20,
    });
    tenantOptions.value = result.items ?? [];
  } catch {
    tenantOptions.value = [];
    message.error('租户选项加载失败，请稍后重试');
  } finally {
    tenantOptionLoading.value = false;
  }
}

async function openCreateAccountModal() {
  if (!canCreateAccount.value) {
    return;
  }

  resetCreateAccountForm();
  createModalOpen.value = true;
  tenantOptions.value = [];

  if (isPlatformScope.value) {
    await loadTenantOptions();
  }
}

function handleCreateScopeChange(scopeLevel: 'SYSTEM' | 'TENANT') {
  createAccountForm.scopeLevel = scopeLevel;
  if (scopeLevel === 'SYSTEM') {
    createAccountForm.tenantId = '';
    return;
  }

  createAccountForm.tenantId = isPlatformScope.value ? '' : currentTenantId.value;
}

async function submitCreateAccount() {
  if (!createAccountForm.displayName.trim()) {
    message.warning('请输入用户姓名');
    return;
  }

  if (!createAccountForm.phone.trim() && !createAccountForm.email.trim()) {
    message.warning('请至少填写手机号或邮箱');
    return;
  }

  if (
    createAccountForm.scopeLevel === 'TENANT'
    && !(
      isPlatformScope.value
        ? createAccountForm.tenantId.trim()
        : currentTenantId.value
    )
  ) {
    message.warning('请选择租户');
    return;
  }

  createSaving.value = true;

  try {
    await createAdminAccountApi({
      displayName: createAccountForm.displayName.trim(),
      email: createAccountForm.email.trim() || undefined,
      phone: createAccountForm.phone.trim() || undefined,
      scopeLevel: createAccountForm.scopeLevel,
      tenantId:
        createAccountForm.scopeLevel === 'TENANT'
          ? (
              isPlatformScope.value
                ? createAccountForm.tenantId.trim()
                : currentTenantId.value
            ) || undefined
          : undefined,
      username: createAccountForm.displayName.trim(),
    });
    message.success('账号已创建');
    createModalOpen.value = false;
    await loadAccounts({ page: 1, pageSize: accountPagination.pageSize });
  } catch {
    message.error('账号创建失败，请稍后重试');
  } finally {
    createSaving.value = false;
  }
}

function handleActionClick(key: string, record: AccountManagementRow) {
  if (key === 'basicInfo') {
    void openBasicInfoModal(record);
    return;
  }

  if (key === 'loginMethods') {
    void openLoginMethodModal(record);
    return;
  }

  if (key === 'roles') {
    void openRoleConfig(record);
  }
}

function buildActionMenu(record: AccountManagementRow) {
  return h(
    Menu,
    {
      onClick: ({ key }: { key: string }) => {
        handleActionClick(key, record);
      },
    } as MenuProps,
    () => [
      h(Menu.Item, { key: 'basicInfo' }, () => '基本信息'),
      h(
        Menu.Item,
        { key: 'loginMethods', disabled: !canManageLoginMethods.value },
        () => '登录方式',
      ),
      h(
        Menu.Item,
        { key: 'roles', disabled: !canReadAccountRoles.value },
        () => '角色配置',
      ),
    ],
  );
}

const accountColumns = computed<TableColumnsType<AccountManagementRow>>(() => {
  const columns: TableColumnsType<AccountManagementRow> = [
    {
      key: 'account',
      title: '账号',
      customRender: ({ record }) =>
        h('div', { class: 'account-management__identity' }, [
          h(
            'strong',
            record.userDisplayName
              || record.userId
              || record.accountId,
          ),
        ]),
    },
    {
      dataIndex: 'userId',
      title: '用户 ID',
      customRender: ({ record }) => h('span', record.userId),
    },
    {
      dataIndex: 'scopeLevel',
      title: 'Scope',
      width: 110,
      customRender: ({ record }) =>
        h(
          Tag,
          { color: record.scopeLevel === 'SYSTEM' ? 'blue' : 'green' },
          () => getAccountScopeLabel(record.scopeLevel),
        ),
    },
  ];

  if (showTenantColumn.value) {
    columns.push({
      key: 'tenant',
      title: '租户',
      customRender: ({ record }) => record.tenantName || record.tenantId || '-',
    });
  }

  columns.push(
    {
      dataIndex: 'isEnabled',
      title: '状态',
      width: 96,
      customRender: ({ record }) =>
        h(
          Tag,
          { color: record.isEnabled ? 'green' : 'default' },
          () => getAccountStatusLabel(record.isEnabled),
        ),
    },
    {
      key: 'actions',
      title: '操作',
      width: 88,
      customRender: ({ record }) =>
        h(
          Dropdown,
          { trigger: ['click'] },
          {
            default: () =>
              h(
                Button,
                {
                  class: 'account-management__action-trigger',
                  size: 'small',
                  type: 'text',
                },
                {
                  default: () => h('span', { class: 'account-management__ellipsis' }, '...'),
                },
              ),
            overlay: () => buildActionMenu(record),
          },
        ),
    },
  );

  return columns;
});

onMounted(() => {
  resetCreateAccountForm();
  void loadAccounts({ page: 1, pageSize: accountPagination.pageSize });
});
</script>

<template>
  <Page auto-content-height title="账号管理">
    <div class="account-management-page">
      <Card :bordered="false" class="account-management__panel">
        <div class="account-management__header">
          <div class="account-management__title-row">
            <div class="account-management__section-title account-management__section-title--primary">
              账号目录
            </div>
          </div>

          <Button
            v-if="canCreateAccount"
            type="primary"
            @click="openCreateAccountModal"
          >
            新增账号
          </Button>
        </div>

        <div class="account-management__pane-header">
          <div class="account-management__section-title">
            账号列表
          </div>
          <div class="account-management__meta">
            <span
              v-for="item in accountSummaryMeta"
              :key="item.label"
              class="account-management__meta-item"
            >
              {{ item.label }} {{ item.value }}
            </span>
          </div>
        </div>

        <Form class="account-management__filter-shell" layout="vertical" @submit.prevent>
          <Row :gutter="16" class="account-management__filter-row">
            <Col :lg="10" :md="12" :xs="24">
              <Form.Item label="关键字">
                <Input
                  v-model:value="accountFilters.keyword"
                  allow-clear
                  placeholder="账号 ID、用户 ID、邮箱、手机号"
                  @press-enter="queryAccounts"
                />
              </Form.Item>
            </Col>
            <Col :lg="5" :md="6" :xs="24">
              <Form.Item label="Scope">
                <Select
                  v-model:value="accountFilters.scopeLevel"
                  :options="scopeOptions"
                />
              </Form.Item>
            </Col>
            <Col :lg="5" :md="6" :xs="24">
              <Form.Item label="状态">
                <Select
                  v-model:value="accountFilters.status"
                  :options="statusOptions"
                />
              </Form.Item>
            </Col>
            <Col
              :lg="4"
              :md="24"
              :xs="24"
              class="account-management__filter-actions-col"
            >
              <Form.Item label=" ">
                <Space wrap class="account-management__filter-actions">
                  <Button type="primary" :loading="accountLoading" @click="queryAccounts">
                    查询
                  </Button>
                  <Button @click="resetAccountFilters">重置</Button>
                </Space>
              </Form.Item>
            </Col>
          </Row>
        </Form>

        <div class="account-management__table-shell">
          <Table
            :columns="accountColumns"
            :data-source="accountRows"
            :loading="accountLoading"
            :locale="{ emptyText: '暂无账号' }"
            :pagination="tablePagination"
            row-key="key"
            size="middle"
            @change="handleTableChange"
          />
        </div>
      </Card>

      <Drawer
        v-model:open="roleDrawerOpen"
        destroy-on-close
        title="角色配置"
        width="720"
      >
        <div v-if="selectedAccount" class="account-management__drawer">
          <section v-loading="roleLoading" class="account-management__editor-block">
            <div class="account-management__role-toolbar">
              <div>
                <div class="account-management__section-title">角色配置</div>
                <div class="account-management__section-description">
                  {{ roleSearchSummary }}
                </div>
              </div>

              <Input
                v-model:value="roleKeyword"
                allow-clear
                class="account-management__role-search"
                placeholder="搜索角色名称或角色码"
              />
            </div>

            <div v-if="filteredRoles.length" class="account-management__role-list-shell">
              <Checkbox.Group
                v-model:value="selectedRoleIds"
                class="account-management__roles"
              >
                <label
                  v-for="role in filteredRoles"
                  :key="role.id"
                  class="account-management__role-item"
                >
                  <Checkbox :value="role.id" :disabled="!canSetAccountRoles" />
                  <span>
                    <strong>{{ role.name }}</strong>
                    <small>{{ role.code }}</small>
                  </span>
                  <Tag>{{ getRoleKindLabel(role.roleKind) }}</Tag>
                </label>
              </Checkbox.Group>
            </div>

            <Empty
              v-if="!filteredRoles.length && !roleLoading"
              class="account-management__empty"
              :description="availableRoles.length ? '没有匹配的角色' : '暂无可分配角色'"
            />
          </section>
        </div>

        <template #footer>
          <div class="account-management__drawer-footer">
            <Button @click="roleDrawerOpen = false">取消</Button>
            <Button
              type="primary"
              :disabled="!canSaveRoles"
              :loading="roleSaving"
              @click="saveRoles"
            >
              保存角色
            </Button>
          </div>
        </template>
      </Drawer>

      <Modal
        v-model:open="createModalOpen"
        :confirm-loading="createSaving"
        destroy-on-close
        title="新增账号"
        :width="560"
        @ok="submitCreateAccount"
      >
        <Form layout="vertical">
          <Row :gutter="16">
            <Col :span="24">
              <Form.Item label="用户姓名" required>
                <Input
                  v-model:value="createAccountForm.displayName"
                  allow-clear
                  :maxlength="64"
                  placeholder="请输入用户姓名"
                />
              </Form.Item>
            </Col>

            <Col v-if="isPlatformScope" :span="12">
              <Form.Item label="Scope">
                <Select
                  v-model:value="createAccountForm.scopeLevel"
                  :options="createScopeOptions"
                  @change="(value) => handleCreateScopeChange((value === 'SYSTEM' ? 'SYSTEM' : 'TENANT'))"
                />
              </Form.Item>
            </Col>

            <Col
              v-if="isPlatformScope && createAccountForm.scopeLevel === 'TENANT'"
              :span="12"
            >
              <Form.Item label="租户" required>
                <Select
                  v-model:value="createAccountForm.tenantId"
                  :filter-option="false"
                  :loading="tenantOptionLoading"
                  :options="
                    tenantOptions.map((item) => ({
                      label: item.name,
                      value: item.id,
                    }))
                  "
                  placeholder="请选择租户"
                  show-search
                  @search="loadTenantOptions"
                />
              </Form.Item>
            </Col>

            <Col :span="12">
              <Form.Item label="手机号">
                <PhoneNumberInput
                  v-model="createAccountForm.phone"
                  placeholder="请输入手机号"
                />
              </Form.Item>
            </Col>

            <Col :span="12">
              <Form.Item label="邮箱">
                <Input
                  v-model:value="createAccountForm.email"
                  allow-clear
                  :maxlength="256"
                  placeholder="无手机号时用于邀请通知"
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        v-model:open="basicInfoModalOpen"
        :confirm-loading="basicInfoSaving"
        destroy-on-close
        :ok-button-props="{ disabled: !canSaveBasicInfo }"
        title="基本信息"
        :width="640"
        @ok="submitBasicInfo"
      >
        <div v-if="selectedBasicInfo" class="account-management__basic-info">
          <section class="account-management__preview-surface">
            <div class="account-management__preview-grid">
              <div
                v-for="item in basicInfoPreview"
                :key="item.label"
                class="account-management__preview-item"
              >
                <div class="account-management__preview-label">{{ item.label }}</div>
                <div class="account-management__preview-value">{{ item.value }}</div>
              </div>
            </div>
          </section>

          <section v-loading="basicInfoLoading" class="account-management__editor-block">
            <div class="account-management__block-header">
              <div class="account-management__section-title">可维护字段</div>
            </div>

            <Form layout="vertical">
              <Row :gutter="16">
                <Col :span="24">
                  <Form.Item label="用户姓名" required>
                    <Input
                      v-model:value="basicInfoForm.displayName"
                      allow-clear
                      :disabled="!canUpdateAccountProfile"
                      :maxlength="64"
                      placeholder="请输入用户姓名"
                    />
                  </Form.Item>
                </Col>

                <Col :span="12">
                  <Form.Item label="状态">
                    <div class="account-management__status-field">
                      <Switch
                        v-model:checked="basicInfoForm.isEnabled"
                        :disabled="!canUpdateAccountStatus"
                        checked-children="启用"
                        un-checked-children="停用"
                      />
                      <span class="account-management__status-text">
                        {{ basicInfoForm.isEnabled ? '账号当前为启用状态，保存后继续允许登录与授权。' : '账号当前为停用状态，保存后将停止登录与授权。' }}
                      </span>
                    </div>
                  </Form.Item>
                </Col>

                <Col :span="12">
                  <Form.Item label="手机号">
                    <PhoneNumberInput
                      v-model="basicInfoForm.phone"
                      :disabled="!canUpdateAccountProfile"
                      placeholder="请输入手机号"
                    />
                  </Form.Item>
                </Col>

                <Col :span="24">
                  <Form.Item label="邮箱">
                    <div class="account-management__field-input">
                      <Input
                        v-model:value="basicInfoForm.email"
                        allow-clear
                        :disabled="!canUpdateAccountProfile"
                        :maxlength="256"
                        placeholder="请输入邮箱"
                      />
                    </div>
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </section>
        </div>
      </Modal>

      <Modal
        v-model:open="loginMethodModalOpen"
        destroy-on-close
        :footer="null"
        :title="`登录方式 · ${selectedSecurityAccountTitle}`"
        :width="720"
      >
        <div class="account-management__login-methods">
          <div class="account-management__login-method-toolbar">
            <div>
              <div class="account-management__section-title">账号登录方式</div>
              <div class="account-management__muted">
                {{ selectedAccountPasswordSetupRequired ? '当前用户需要设置新密码' : '密码状态正常' }}
              </div>
            </div>
            <Space>
              <Button :loading="loginMethodLoading" @click="selectedSecurityAccount && loadAccountLoginMethods(selectedSecurityAccount)">
                刷新
              </Button>
              <Button
                danger
                :loading="loginMethodSaving"
                @click="requirePasswordSetup"
              >
                要求重设密码
              </Button>
            </Space>
          </div>

          <Empty
            v-if="!loginMethodLoading && selectedAccountLoginMethods.length === 0"
            description="暂无登录方式"
          />
          <div v-else v-loading="loginMethodLoading" class="account-management__login-method-list">
            <div
              v-for="method in selectedAccountLoginMethods"
              :key="method.methodId"
              class="account-management__login-method-item"
            >
              <div>
                <div class="account-management__login-method-title">
                  {{ getLoginMethodTypeLabel(method) }}
                  <Tag v-if="method.enabled" color="green">已启用</Tag>
                  <Tag v-else color="default">已停用</Tag>
                  <Tag v-if="method.verified" color="blue">已验证</Tag>
                  <Tag v-else color="orange">未验证</Tag>
                  <Tag v-if="method.hasPassword" color="purple">支持密码</Tag>
                </div>
                <div class="account-management__muted">
                  {{ method.maskedIdentifier || method.identifier || '未提供标识' }}
                </div>
              </div>
              <Button
                :loading="loginMethodSaving"
                @click="toggleAccountLoginMethod(method)"
              >
                {{ method.enabled ? '停用' : '启用' }}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  </Page>
</template>

<style scoped>
.account-management-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  --account-border: hsl(var(--border));
  --account-card-bg: hsl(var(--card));
  --account-card-bg-soft: hsl(var(--muted) / 0.55);
  --account-card-bg-strong: hsl(var(--muted) / 0.82);
  --account-title: hsl(var(--foreground));
  --account-text: hsl(var(--foreground) / 0.92);
  --account-muted: hsl(var(--muted-foreground));
}

.account-management__panel {
  border: 1px solid var(--account-border);
  background: var(--account-card-bg);
  box-shadow: 0 18px 40px rgb(15 23 42 / 0.05);
}

.account-management__panel :deep(.ant-card-body) {
  padding: 16px;
}

.account-management__header,
.account-management__block-header,
.account-management__pane-header,
.account-management__role-toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.account-management__header {
  margin-bottom: 16px;
}

.account-management__title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.account-management__section-title {
  color: var(--account-text);
  font-size: 14px;
  font-weight: 600;
}

.account-management__section-title--primary {
  color: var(--account-title);
  font-size: 18px;
}

.account-management__section-description {
  margin-top: 6px;
  color: var(--account-muted);
  font-size: 13px;
  line-height: 1.7;
}

.account-management__pane-header {
  margin-bottom: 16px;
}

.account-management__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.account-management__meta-item {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 12px;
  border: 1px solid var(--account-border);
  border-radius: 8px;
  background: var(--account-card-bg-soft);
  color: var(--account-muted);
  font-size: 12px;
}

.account-management__filter-shell,
.account-management__table-shell,
.account-management__editor-block {
  border: 1px solid var(--account-border);
  border-radius: 8px;
  background: var(--account-card-bg-soft);
}

.account-management__filter-shell {
  margin-bottom: 16px;
  padding: 16px 16px 0;
}

.account-management__filter-row {
  align-items: center;
}

.account-management__filter-actions-col {
  display: flex;
  justify-content: flex-end;
}

.account-management__filter-actions {
  justify-content: flex-end;
  width: 100%;
}

.account-management__filter-shell :deep(.ant-form-item) {
  margin-bottom: 16px;
}

.account-management__table-shell {
  overflow: hidden;
}

.account-management__table-shell :deep(.ant-table-wrapper) {
  background: transparent;
}

.account-management__identity {
  display: grid;
  gap: 2px;
}

.account-management__identity small,
.account-management__role-item small {
  color: var(--account-muted);
  font-size: 12px;
}

.account-management__action-trigger {
  width: 32px;
}

.account-management__ellipsis {
  letter-spacing: 0;
  line-height: 1;
}

.account-management__drawer {
  display: grid;
  gap: 16px;
}

.account-management__basic-info {
  display: grid;
  gap: 16px;
}

.account-management__editor-block {
  padding: 16px;
}

.account-management__block-header {
  margin-bottom: 16px;
}

.account-management__role-toolbar {
  margin-bottom: 16px;
}

.account-management__role-search {
  width: 280px;
  max-width: 100%;
}

.account-management__preview-surface {
  border: 1px solid var(--account-border);
  border-radius: 8px;
  background: var(--account-card-bg-strong);
  padding: 16px;
}

.account-management__preview-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.account-management__preview-item {
  padding: 12px;
  border: 1px solid var(--account-border);
  border-radius: 8px;
  background: var(--account-card-bg);
}

.account-management__preview-label {
  color: var(--account-muted);
  font-size: 12px;
}

.account-management__preview-value {
  margin-top: 6px;
  color: var(--account-title);
  font-size: 14px;
  font-weight: 600;
  word-break: break-word;
}

.account-management__roles {
  display: grid;
  gap: 8px;
  width: 100%;
}

.account-management__role-list-shell {
  max-height: 460px;
  overflow: auto;
  padding-right: 4px;
}

.account-management__role-item {
  display: grid;
  align-items: center;
  grid-template-columns: auto 1fr auto;
  gap: 10px;
  padding: 12px;
  border: 1px solid var(--account-border);
  border-radius: 8px;
  background: var(--account-card-bg);
}

.account-management__role-item span {
  display: grid;
  gap: 2px;
}

.account-management__field-input:deep(.ant-input) {
  min-height: 40px;
}

.account-management__drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.account-management__status-field {
  display: grid;
  gap: 10px;
  min-height: 40px;
}

.account-management__status-text {
  color: var(--account-muted);
  font-size: 12px;
  line-height: 1.6;
}

.account-management__login-methods {
  display: grid;
  gap: 16px;
}

.account-management__login-method-toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 16px;
  border: 1px solid var(--account-border);
  border-radius: 12px;
  background: var(--account-card-bg-strong);
}

.account-management__muted {
  margin-top: 4px;
  color: var(--account-muted);
  font-size: 13px;
}

.account-management__login-method-list {
  display: grid;
  gap: 12px;
}

.account-management__login-method-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px;
  border: 1px solid var(--account-border);
  border-radius: 12px;
  background: var(--account-card-bg);
}

.account-management__login-method-title {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: var(--account-title);
}

:deep(.account-management__table-shell .ant-table),
:deep(.account-management__table-shell .ant-table-container) {
  background: transparent;
}

:deep(.account-management__table-shell .ant-table-thead > tr > th) {
  background: var(--account-card-bg-strong);
  color: var(--account-text);
}

:deep(.account-management__filter-shell .ant-input),
:deep(.account-management__filter-shell .ant-input-affix-wrapper),
:deep(.account-management__filter-shell .ant-select-selector) {
  background: hsl(var(--input-background));
  border-color: hsl(var(--input));
  color: var(--account-text);
}

@media (width <= 768px) {
  .account-management__header,
  .account-management__block-header,
  .account-management__pane-header,
  .account-management__login-method-toolbar,
  .account-management__login-method-item {
    flex-direction: column;
    align-items: stretch;
  }

  .account-management__filter-actions-col {
    justify-content: flex-start;
  }

  .account-management__filter-actions {
    justify-content: flex-start;
  }
}
</style>
