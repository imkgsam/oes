<script setup lang="ts">
import type { TableColumnsType } from 'ant-design-vue';

import type {
  AccountManagementRow,
  AccountScopeFilter,
  AccountStatusFilter,
} from './account-management.helpers';

import type { AccountRoleManagementApi, AdminSecurityApi } from '#/api';

import { computed, h, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

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
  message,
  Modal,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tag,
} from 'ant-design-vue';

import {
  createAdminAccountApi,
  deleteAdminAccountApi,
  disableAdminAccountLoginMethodApi,
  enableAdminAccountLoginMethodApi,
  getAccountRoleSelectionApi,
  getAdminAccountBasicInfoApi,
  getAdminAccountDeletionImpactApi,
  listAdminAccountLoginMethodsApi,
  listAdminAccountsApi,
  listAdminAccountTenantOptionsApi,
  requireAdminAccountPasswordSetupApi,
  setAccountRolesApi,
  updateAdminAccountBasicInfoApi,
} from '#/api';
import { useAuthContextStore } from '#/store/auth-context';

import PhoneNumberInput from '../_core/authentication/phone-number-input.vue';
import {
  buildAccountRows,
  getAccountScopeLabel,
  getAccountStatusLabel,
  getRoleKindLabel,
  getSelectedRoleSummary,
} from './account-management.helpers';

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

interface AccountFilterState {
  keyword: string;
  scopeLevel: AccountScopeFilter;
  status: AccountStatusFilter;
}

type AccountActionKey = 'basicInfo' | 'delete' | 'loginMethods' | 'roles';

const authContextStore = useAuthContextStore();
const createAccountForm = reactive<CreateAccountFormState>({
  displayName: '',
  email: '',
  phone: '',
  scopeLevel: 'TENANT',
  tenantId: '',
});
const accountFilters = reactive<AccountFilterState>({
  keyword: '',
  scopeLevel: '',
  status: '',
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
const currentTenantLabel = computed(
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
const canDeleteAccount = computed(() =>
  authContextStore.actionCodes.includes('identity.account.delete'),
);
const canManageLoginMethods = computed(() =>
  authContextStore.actionCodes.includes('auth.account_login_methods.manage'),
);
const currentAccountId = computed(
  () => authContextStore.sessionContext?.account?.accountId ?? '',
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
const createScopeOptions = computed(() => {
  const options = [
    { label: '系统账号', value: 'SYSTEM' },
    { label: '租户账号', value: 'TENANT' },
  ];

  return isPlatformScope.value
    ? options
    : options.filter((option) => option.value !== 'SYSTEM');
});
const accountTablePagination = computed(() => ({
  current: accountPagination.current,
  pageSize: accountPagination.pageSize,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条`,
  total: accountPagination.total,
}));
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
const loginMethodSummaryMeta = computed(() => [
  {
    label: '密码状态',
    value: selectedAccountPasswordSetupRequired.value ? '需要重设密码' : '状态正常',
  },
  {
    label: '登录方式数',
    value: String(selectedAccountLoginMethods.value.length),
  },
]);

function getAccountContextTitle(record: AccountManagementRow) {
  if (record.scopeLevel === 'SYSTEM') {
    return '系统上下文';
  }

  return record.tenantName || record.tenantId || '未命名租户';
}

function getAccountDisplayName(record: AccountManagementRow) {
  return record.accountDisplayName?.trim() || record.userDisplayName?.trim() || '未命名账号';
}

// Loads the account directory with the current filter state and pagination.
async function loadAccountDirectory(
  page = accountPagination.current,
  pageSize = accountPagination.pageSize,
) {
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
    return {
      itemCount: result.items?.length ?? 0,
      total: result.total ?? 0,
    };
  } catch {
    accountRows.value = [];
    accountPagination.total = 0;
    message.error('账号目录加载失败，请稍后重试');
    return {
      itemCount: 0,
      total: 0,
    };
  } finally {
    accountLoading.value = false;
  }
}

// Refreshes the current directory view and optionally falls back to the previous page when the current page becomes empty.
async function refreshDirectory(options?: { fallbackToPreviousPageOnEmpty?: boolean }) {
  const result = await loadAccountDirectory();

  if (
    options?.fallbackToPreviousPageOnEmpty
    && result.itemCount === 0
    && result.total > 0
    && accountPagination.current > 1
  ) {
    const previousPage = accountPagination.current - 1;
    accountPagination.current = previousPage;
    await loadAccountDirectory(previousPage, accountPagination.pageSize);
  }
}

// Applies the current search filters from the first page.
function searchAccounts() {
  accountPagination.current = 1;
  void loadAccountDirectory(1, accountPagination.pageSize);
}

// Restores the default account directory filters and reloads the first page.
function resetAccountFilters() {
  accountFilters.keyword = '';
  accountFilters.scopeLevel = '';
  accountFilters.status = '';
  accountPagination.current = 1;
  void loadAccountDirectory(1, accountPagination.pageSize);
}

// Syncs ant-table pagination back into the account directory query state.
function handleAccountTableChange(pagination: { current?: number; pageSize?: number }) {
  const nextPage = pagination.current ?? 1;
  const nextPageSize = pagination.pageSize ?? accountPagination.pageSize;

  accountPagination.current = nextPage;
  accountPagination.pageSize = nextPageSize;
  void loadAccountDirectory(nextPage, nextPageSize);
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
    await refreshDirectory({ fallbackToPreviousPageOnEmpty: true });
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
    await refreshDirectory();
  } catch {
    message.error('账号创建失败，请稍后重试');
  } finally {
    createSaving.value = false;
  }
}

function showAccountDeletionBlocked(impact: AdminSecurityApi.AccountDeletionImpact) {
  Modal.warning({
    centered: true,
    okText: '我知道了',
    title: '当前账号暂时无法删除',
    content: h(
      'div',
      { class: 'account-management__delete-blockers' },
      impact.blockingReasons.map((reason) =>
        h('p', { key: `${reason.resourceType}-${reason.resourceCount}` }, reason.message),
      ),
    ),
  });
}

function buildDeleteAccountImpactLines(impact: AdminSecurityApi.AccountDeletionImpact) {
  return [
    '删除后不可恢复。',
    '将清理当前账号下的会话与角色绑定。',
    impact.orgMembershipCount > 0
      ? `将同步删除 ${impact.orgMembershipCount} 条组织成员关系。`
      : undefined,
    impact.contactAssetCount > 0
      ? `将同步删除 ${impact.contactAssetCount} 条工作联系资产。`
      : undefined,
    '该操作不会删除底层 user。',
  ].filter(Boolean) as string[];
}

function buildDeleteAccountSummary(record: AccountManagementRow) {
  return [
    {
      label: '用户姓名',
      value: record.userDisplayName || record.userId || '未命名用户',
    },
    {
      label: '账号名称',
      value: getAccountDisplayName(record),
    },
    {
      label: '账号上下文',
      value: getAccountContextTitle(record),
    },
  ];
}

function buildDeleteAccountSuccessMessage(result: AdminSecurityApi.AccountDeletionResult) {
  const parts = [
    `${result.deletedSessionCount} 个会话`,
    `${result.clearedRoleCount} 个角色绑定`,
    `${result.deletedOrgMembershipCount} 条组织成员关系`,
    `${result.deletedContactAssetCount} 条工作联系资产`,
  ];

  return `账号已删除，已清理 ${parts.join('、')}`;
}

function confirmDeleteAccount(
  record: AccountManagementRow,
  impact: AdminSecurityApi.AccountDeletionImpact,
) {
  Modal.confirm({
    centered: true,
    okText: '删除账号',
    okType: 'danger',
    title: `确认删除“${record.userDisplayName || record.userId || record.accountId}”账号？`,
    content: h(
      'div',
      { class: 'account-management__delete-impact' },
      [
        h(
          'div',
          { class: 'account-management__preview-surface' },
          h(
            'div',
            { class: 'account-management__preview-grid' },
            buildDeleteAccountSummary(record).map((item) =>
              h('div', { key: item.label, class: 'account-management__preview-item' }, [
                h('div', { class: 'account-management__preview-label' }, item.label),
                h('div', { class: 'account-management__preview-value' }, item.value),
              ]),
            ),
          ),
        ),
        h(
          'div',
          { class: 'account-management__delete-copy' },
          buildDeleteAccountImpactLines(impact).map((line) => h('p', { key: line }, line)),
        ),
      ],
    ),
    async onOk() {
      await deleteAccount(record);
    },
  });
}

async function deleteAccount(record: AccountManagementRow) {
  const result = await deleteAdminAccountApi(record.accountId);
  message.success(buildDeleteAccountSuccessMessage(result));
  await refreshDirectory({ fallbackToPreviousPageOnEmpty: true });
}

async function openDeleteAccount(record: AccountManagementRow) {
  if (!canDeleteAccount.value) {
    message.warning('当前账号没有删除账号的操作权限');
    return;
  }

  const impact = await getAdminAccountDeletionImpactApi(record.accountId);
  if (!impact.canDelete) {
    showAccountDeletionBlocked(impact);
    return;
  }

  confirmDeleteAccount(record, impact);
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
    return;
  }

  if (key === 'delete') {
    void openDeleteAccount(record);
  }
}

function renderAccountActionDropdown(record: AccountManagementRow) {
  const items = [
    h(Menu.Item, { key: 'basicInfo' satisfies AccountActionKey }, () => '基本信息'),
  ];

  if (canManageLoginMethods.value) {
    items.push(
      h(
        Menu.Item,
        { key: 'loginMethods' satisfies AccountActionKey },
        () => '登录方式',
      ),
    );
  }

  if (canReadAccountRoles.value) {
    items.push(
      h(
        Menu.Item,
        { key: 'roles' satisfies AccountActionKey },
        () => '角色配置',
      ),
    );
  }

  if (canDeleteAccount.value && record.accountId !== currentAccountId.value) {
    items.push(
      h(
        Menu.Item,
        {
          danger: true,
          key: 'delete' satisfies AccountActionKey,
        },
        () => '删除账号',
      ),
    );
  }

  return h(
    Dropdown,
    { trigger: ['click'] },
    {
      default: () =>
        h(
          Button,
          {
            'aria-label': '账号操作',
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
            onClick: ({ key }: { key: number | string }) => {
              handleActionClick(String(key), record);
            },
          },
          () => items,
        ),
    },
  );
}

const accountColumns = computed<TableColumnsType<AccountManagementRow>>(() => [
  {
    dataIndex: 'userDisplayName',
    key: 'userDisplayName',
    title: '用户姓名',
    customRender: ({ record }) => record.userDisplayName || '未命名用户',
  },
  {
    dataIndex: 'accountDisplayName',
    key: 'accountDisplayName',
    sorter: (left, right) =>
      getAccountDisplayName(left).localeCompare(getAccountDisplayName(right), 'zh-Hans-CN'),
    title: '账号名称',
    customRender: ({ record }) => getAccountDisplayName(record),
  },
  {
    dataIndex: 'contextLabel',
    key: 'contextLabel',
    title: '账号上下文',
    customRender: ({ record }) => getAccountContextTitle(record),
  },
  {
    dataIndex: 'scopeLevel',
    key: 'scopeLevel',
    title: 'Scope',
    width: 110,
    customRender: ({ record }) =>
      h(Tag, { color: record.scopeLevel === 'SYSTEM' ? 'blue' : 'green' }, () =>
        getAccountScopeLabel(record.scopeLevel),
      ),
  },
  {
    dataIndex: 'isEnabled',
    key: 'isEnabled',
    title: '状态',
    width: 90,
    customRender: ({ record }) =>
      h(Tag, { color: record.isEnabled ? 'green' : 'default' }, () =>
        getAccountStatusLabel(record.isEnabled),
      ),
  },
  {
    key: 'actions',
    title: '操作',
    width: 72,
    customRender: ({ record }) => renderAccountActionDropdown(record),
  },
]);

const loginMethodColumns = computed<TableColumnsType<AdminSecurityApi.LoginMethod>>(() => [
  {
    dataIndex: 'type',
    key: 'type',
    title: '登录方式',
    width: 120,
    customRender: ({ record }) => getLoginMethodTypeLabel(record),
  },
  {
    dataIndex: 'identifier',
    key: 'identifier',
    title: '标识',
    customRender: ({ record }) => record.maskedIdentifier || record.identifier || '未提供标识',
  },
  {
    dataIndex: 'enabled',
    key: 'enabled',
    title: '状态',
    width: 96,
    customRender: ({ record }) =>
      h(
        Tag,
        { color: record.enabled ? 'green' : 'default' },
        () => (record.enabled ? '已启用' : '已停用'),
      ),
  },
  {
    dataIndex: 'verified',
    key: 'verified',
    title: '验证',
    width: 96,
    customRender: ({ record }) =>
      h(
        Tag,
        { color: record.verified ? 'blue' : 'orange' },
        () => (record.verified ? '已验证' : '未验证'),
      ),
  },
  {
    dataIndex: 'hasPassword',
    key: 'hasPassword',
    title: '密码',
    width: 108,
    customRender: ({ record }) =>
      record.hasPassword
        ? h(Tag, { color: 'purple' }, () => '支持密码')
        : h('span', { class: 'account-management__table-muted' }, '不支持'),
  },
  {
    key: 'actions',
    title: '操作',
    width: 96,
    customRender: ({ record }) =>
      h(
        Button,
        {
          loading: loginMethodSaving.value,
          size: 'small',
          onClick: () => {
            void toggleAccountLoginMethod(record);
          },
        },
        () => (record.enabled ? '停用' : '启用'),
      ),
  },
]);

onMounted(() => {
  resetCreateAccountForm();
  void loadAccountDirectory();
});
</script>

<template>
  <Page title="账号管理">
    <div class="account-management">
      <Card :bordered="false" class="account-management__card">
        <div class="account-management__toolbar">
          <div class="account-management__heading">
            <div class="account-management__title">账号列表</div>
            <div class="account-management__meta">共 {{ accountPagination.total }} 条</div>
          </div>
          <Button
            v-if="canCreateAccount"
            type="primary"
            @click="openCreateAccountModal"
          >
            新增账号
          </Button>
        </div>

        <Card :bordered="false" class="account-management__filter-card">
          <Row :gutter="[12, 12]" class="account-management__filter-row">
            <Col :lg="8" :md="12" :span="24">
              <Input
                v-model:value="accountFilters.keyword"
                allow-clear
                placeholder="搜索账号名称、用户姓名或租户名称"
                @press-enter="searchAccounts"
              />
            </Col>

            <Col v-if="isPlatformScope" :lg="5" :md="12" :span="24">
              <Select
                v-model:value="accountFilters.scopeLevel"
                :options="[
                  { label: '全部 Scope', value: '' },
                  { label: 'SYSTEM', value: 'SYSTEM' },
                  { label: 'TENANT', value: 'TENANT' },
                ]"
              />
            </Col>

            <Col
              v-else
              :lg="5"
              :md="12"
              :span="24"
              class="account-management__tenant-filter-col"
            >
              <Input :value="currentTenantLabel" disabled />
            </Col>

            <Col :lg="5" :md="12" :span="24">
              <Select
                v-model:value="accountFilters.status"
                :options="[
                  { label: '全部状态', value: '' },
                  { label: '启用', value: 'ENABLED' },
                  { label: '停用', value: 'DISABLED' },
                ]"
              />
            </Col>

            <Col
              :lg="6"
              :md="12"
              :span="24"
              class="account-management__filter-actions-col"
            >
              <Space class="account-management__filter-actions">
                <Button type="primary" @click="searchAccounts">查询</Button>
                <Button @click="resetAccountFilters">重置</Button>
              </Space>
            </Col>
          </Row>
        </Card>

        <div class="account-management__table-shell">
          <Table
            :columns="accountColumns"
            :data-source="accountRows"
            :loading="accountLoading"
            :pagination="accountTablePagination"
            :row-key="(record) => record.accountId"
            @change="handleAccountTableChange"
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

            <div v-if="filteredRoles.length > 0" class="account-management__role-list-shell">
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
              v-if="filteredRoles.length === 0 && !roleLoading"
              class="account-management__empty"
              :description="availableRoles.length > 0 ? '没有匹配的角色' : '暂无可分配角色'"
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
                  @change="
                    (value: unknown) =>
                      handleCreateScopeChange(value === 'SYSTEM' ? 'SYSTEM' : 'TENANT')
                  "
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
              <div class="account-management__meta">
                <span
                  v-for="item in loginMethodSummaryMeta"
                  :key="item.label"
                  class="account-management__meta-item"
                >
                  {{ item.label }} {{ item.value }}
                </span>
              </div>
              <div class="account-management__muted">
                {{ selectedAccountPasswordSetupRequired ? '当前用户下次登录时需要重新设置密码。' : '当前账号密码状态正常。' }}
              </div>
            </div>
            <Space class="account-management__login-method-actions">
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

          <div class="account-management__table-shell account-management__login-method-table-shell">
            <Table
              :columns="loginMethodColumns"
              :data-source="selectedAccountLoginMethods"
              :loading="loginMethodLoading"
              :locale="{ emptyText: h(Empty, { description: '暂无登录方式' }) }"
              :pagination="false"
              row-key="methodId"
              size="middle"
            />
          </div>
        </div>
      </Modal>
    </div>
  </Page>
</template>

<style scoped>
.account-management {
  --account-border: hsl(var(--border));
  --account-card-bg: hsl(var(--card));
  --account-card-bg-soft: hsl(var(--muted) / 0.55);
  --account-card-bg-strong: hsl(var(--muted) / 0.82);
  --account-title: hsl(var(--foreground));
  --account-text: hsl(var(--foreground) / 0.92);
  --account-muted: hsl(var(--muted-foreground));
}

.account-management__card {
  border: 1px solid var(--account-border);
  background: var(--account-card-bg);
  box-shadow: 0 10px 30px rgb(15 23 42 / 0.04);
}

.account-management__card :deep(.ant-card-body) {
  padding: 20px;
}

.account-management__toolbar,
.account-management__block-header,
.account-management__role-toolbar,
.account-management__login-method-toolbar {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.account-management__toolbar {
  align-items: center;
  margin-bottom: 12px;
}

.account-management__heading {
  align-items: baseline;
  display: flex;
  gap: 12px;
}

.account-management__title {
  color: var(--account-title);
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
}

.account-management__meta {
  color: var(--account-muted);
  font-size: 13px;
  line-height: 20px;
}

.account-management__meta-item {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  margin-right: 8px;
  margin-bottom: 8px;
  padding: 0 12px;
  border: 1px solid var(--account-border);
  border-radius: 8px;
  background: var(--account-card-bg-soft);
  color: var(--account-muted);
  font-size: 12px;
}

.account-management__filter-card,
.account-management__table-shell {
  margin-bottom: 12px;
}

.account-management__filter-card :deep(.ant-card-body) {
  padding: 12px;
}

.account-management__filter-row {
  align-items: center;
}

.account-management__tenant-filter-col :deep(.ant-select),
.account-management__tenant-filter-col :deep(.ant-input-affix-wrapper),
.account-management__tenant-filter-col :deep(.ant-input) {
  width: 100%;
}

.account-management__filter-actions-col {
  display: flex;
  justify-content: flex-end;
}

.account-management__filter-actions {
  justify-content: flex-end;
  width: 100%;
}

.account-management__section-title {
  color: var(--account-text);
  font-size: 14px;
  font-weight: 600;
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
  border: 1px solid var(--account-border);
  border-radius: 8px;
  background: var(--account-card-bg-soft);
}

.account-management__block-header {
  margin-bottom: 16px;
}

.account-management__role-toolbar {
  align-items: flex-start;
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

.account-management__role-item small {
  color: var(--account-muted);
  font-size: 12px;
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
  align-items: flex-start;
  padding: 16px;
  border: 1px solid var(--account-border);
  border-radius: 8px;
  background: var(--account-card-bg-soft);
}

.account-management__muted {
  margin-top: 4px;
  color: var(--account-muted);
  font-size: 13px;
}

.account-management__login-method-actions {
  justify-content: flex-end;
}

.account-management__login-method-table-shell {
  overflow: hidden;
}

.account-management__table-muted {
  color: var(--account-muted);
  font-size: 13px;
}

.account-management__delete-impact {
  display: grid;
  gap: 12px;
}

.account-management__delete-copy {
  display: grid;
  gap: 8px;
  padding: 4px 2px 0;
}

.account-management__delete-copy p,
.account-management__delete-blockers p {
  margin: 0;
  color: var(--account-text);
  font-size: 13px;
  line-height: 1.6;
}

:deep(.ant-table-wrapper .ant-table),
:deep(.ant-table-wrapper .ant-table-container) {
  background: transparent;
}

:deep(.ant-table-wrapper .ant-table-thead > tr > th) {
  background: rgb(248 250 252 / 0.96);
  color: var(--account-text);
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

:deep(.ant-table-wrapper .ant-table-tbody > tr > td) {
  color: var(--account-text);
  vertical-align: middle;
}

:deep(.ant-table-wrapper .ant-table-tbody > tr:hover > td) {
  background: rgb(248 250 252 / 0.9);
}

:deep(.account-management__login-method-table-shell .ant-table-tbody > tr > td) {
  border-bottom-color: rgb(226 232 240 / 0.88);
}

:deep(.account-management__filter-card .ant-input),
:deep(.account-management__filter-card .ant-input-affix-wrapper),
:deep(.account-management__filter-card .ant-select-selector) {
  background: hsl(var(--input-background));
  border-color: hsl(var(--input));
  color: var(--account-text);
  min-height: 40px;
  border-radius: 10px;
}

@media (width <= 768px) {
  .account-management__toolbar,
  .account-management__block-header,
  .account-management__login-method-toolbar {
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
