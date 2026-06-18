<script setup lang="ts">
import type { TableColumnsType } from 'ant-design-vue';

import type {
  AccountManagementRow,
  AccountScopeFilter,
  AccountStatusFilter,
} from './account-management.helpers';

import type { AccountRoleManagementApi, AdminSecurityApi } from '#/api';

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
  getAccountTerminalAccessApi,
  getAdminAccountBasicInfoApi,
  getAdminAccountDeletionImpactApi,
  listAdminAccountLoginMethodsApi,
  listAdminAccountsApi,
  listAdminAccountTenantOptionsApi,
  requireAdminAccountPasswordSetupApi,
  replaceAccountTerminalAccessOverrideApi,
  setAccountRolesApi,
  deleteAccountTerminalAccessOverrideApi,
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
  isEnabled: boolean;
}

interface AccountFilterState {
  keyword: string;
  scopeLevel: AccountScopeFilter;
  status: AccountStatusFilter;
  tenantId: string;
}

interface AccountTableActionItem<ActionKey extends string> {
  danger?: boolean;
  disabled?: boolean;
  hidden?: boolean;
  key: ActionKey;
  label: string;
}

type AccountActionKey = 'basicInfo' | 'delete' | 'loginMethods' | 'roles';
type AccountColumnKey =
  | 'accountDisplayName'
  | 'actions'
  | 'contextLabel'
  | 'isEnabled'
  | 'scopeLevel'
  | 'userDisplayName';
type LoginMethodActionKey = 'toggle';
type AccountTerminal = 'BROWSER_EXTENSION' | 'KIOSK' | 'PDA' | 'WEB';

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
  tenantId: '',
});
const accountColumnMinWidths: Record<AccountColumnKey, number> = {
  accountDisplayName: 120,
  actions: 72,
  contextLabel: 180,
  isEnabled: 88,
  scopeLevel: 110,
  userDisplayName: 120,
};
const accountColumnWidths = reactive<Record<AccountColumnKey, number>>({
  accountDisplayName: 150,
  actions: 72,
  contextLabel: 260,
  isEnabled: 96,
  scopeLevel: 140,
  userDisplayName: 140,
});
let activeAccountColumnCleanup: null | (() => void) = null;

const accountRows = ref<AccountManagementRow[]>([]);
const accountLoading = ref(false);
const roleDrawerOpen = ref(false);
const roleLoading = ref(false);
const roleSaving = ref(false);
const terminalAccessLoading = ref(false);
const terminalAccessSaving = ref(false);
const roleKeyword = ref('');
const selectedAccount = ref<AccountManagementRow | null>(null);
const availableRoles = ref<AccountRoleManagementApi.Role[]>([]);
const selectedRoleIds = ref<string[]>([]);
const terminalOverrideEnabled = ref(false);
const effectiveAllowedTerminals = ref<AccountTerminal[]>([]);
const terminalOverrideValues = ref<AccountTerminal[]>([]);
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
  isEnabled: true,
});

const accountPagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
});

const isPlatformScope = computed(() => authContextStore.isPlatformScope);
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
const canViewTerminalAccess = computed(() =>
  authContextStore.actionCodes.includes('permission.terminal_access.view'),
);
const canManageAccountTerminalAccess = computed(() =>
  authContextStore.actionCodes.includes('permission.terminal_access.account.manage'),
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
const terminalAccessOptions: Array<{ label: string; value: AccountTerminal }> = [
  { label: 'WEB', value: 'WEB' },
  { label: 'Browser Extension', value: 'BROWSER_EXTENSION' },
  { label: 'PDA', value: 'PDA' },
  { label: 'KIOSK', value: 'KIOSK' },
];

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
const selectedRoleAccountTitle = computed(() => {
  const account = selectedAccount.value;

  if (!account) {
    return '未命名账号';
  }

  return account.userDisplayName || getAccountDisplayName(account);
});
const selectedRoleAccountSubtitle = computed(() => {
  const account = selectedAccount.value;

  if (!account) {
    return '';
  }

  return `${getAccountContextTitle(account)} · ${getAccountScopeLabel(account.scopeLevel)}`;
});
const roleSummaryMeta = computed(() => [
  {
    label: '已选择',
    value: String(selectedRoleIds.value.length),
  },
  {
    label: '可分配',
    value: String(availableRoles.value.length),
  },
  {
    label: '当前显示',
    value: String(filteredRoles.value.length),
  },
]);
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
const accountTableScrollX = computed(() =>
  Object.values(accountColumnWidths).reduce((total, width) => total + width, 0),
);
const accountTenantFilterOptions = computed(() => [
  { label: '全部租户', value: '' },
  ...tenantOptions.value.map((tenant) => ({
    label: `${tenant.name} · ${tenant.code}`,
    value: tenant.id,
  })),
]);
// Builds the read-only contact rows shown beside maintainable account fields.
const basicInfoContactRows = computed(() => {
  if (!selectedBasicInfo.value) {
    return [];
  }

  return [
    {
      label: '手机号',
      value: selectedBasicInfo.value.phone || '未绑定',
    },
    {
      label: '邮箱',
      value: selectedBasicInfo.value.email || '未绑定',
    },
  ];
});
const basicInfoIdentityTitle = computed(() => {
  const basicInfo = selectedBasicInfo.value;

  if (!basicInfo) {
    return '未命名账号';
  }

  return basicInfo.displayName || basicInfo.userId || basicInfo.accountId || '未命名账号';
});
const basicInfoIdentitySubtitle = computed(() => {
  const basicInfo = selectedBasicInfo.value;

  if (!basicInfo) {
    return '';
  }

  const contextLabel =
    basicInfo.scopeLevel === 'TENANT'
      ? basicInfo.tenantName || basicInfo.tenantId || '未命名租户'
      : '系统上下文';

  return `${contextLabel} · ${getAccountScopeLabel(basicInfo.scopeLevel)}`;
});
const basicInfoAvatarText = computed(() =>
  basicInfoIdentityTitle.value.slice(0, 1).toUpperCase(),
);
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
const selectedSecurityAccountSubtitle = computed(() => {
  const account = selectedSecurityAccount.value;

  if (!account) {
    return '';
  }

  return `${getAccountContextTitle(account)} · ${getAccountScopeLabel(account.scopeLevel)}`;
});
const loginMethodPasswordStatusLabel = computed(() =>
  selectedAccountPasswordSetupRequired.value ? '需要重设密码' : '状态正常',
);
const loginMethodSummaryMeta = computed(() => [
  {
    label: '密码状态',
    value: loginMethodPasswordStatusLabel.value,
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

// Renders account row commands through Ant Design Vue's native Dropdown/Menu event flow.
function renderAccountNativeActions<ActionKey extends string>(
  ariaLabel: string,
  items: Array<AccountTableActionItem<ActionKey>>,
  onClick: (key: ActionKey) => void,
) {
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
              const actionKey = String(info.key) as ActionKey;
              const action = visibleItems.find((item) => item.key === actionKey);

              if (!action || action.disabled) {
                return;
              }

              onClick(action.key);
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
                },
                () => item.label,
              ),
            ),
        ),
    },
  );
}

// Keeps terminal access values limited to the Phase 1 UI terminals.
function normalizeAccountTerminals(terminals?: string[]) {
  return [...(terminals ?? [])].filter((terminal): terminal is AccountTerminal =>
    terminalAccessOptions.some((option) => option.value === terminal),
  );
}

// Loads the account directory with the current filter state and pagination.
async function loadAccountDirectory(
  page = accountPagination.current,
  pageSize = accountPagination.pageSize,
) {
  accountLoading.value = true;

  try {
    const query: AdminSecurityApi.AccountDirectoryQuery = {
      keyword: accountFilters.keyword.trim() || undefined,
      page,
      pageSize,
      scopeLevel: accountFilters.scopeLevel || undefined,
      status: accountFilters.status || undefined,
    };
    if (accountFilters.tenantId) {
      query.tenantId = accountFilters.tenantId;
    }

    const result = await listAdminAccountsApi(query);
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
  accountFilters.tenantId = '';
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
  terminalAccessLoading.value = canViewTerminalAccess.value;
  roleKeyword.value = '';
  availableRoles.value = [];
  selectedRoleIds.value = [];
  effectiveAllowedTerminals.value = [];
  terminalOverrideValues.value = [];
  terminalOverrideEnabled.value = false;

  try {
    const scopeContext = {
      scopeLevel: account.scopeLevel,
      tenantId: account.scopeLevel === 'TENANT' ? account.tenantId : undefined,
    };
    const [result, terminalAccess] = await Promise.all([
      getAccountRoleSelectionApi(account.accountId, scopeContext),
      canViewTerminalAccess.value
        ? getAccountTerminalAccessApi(account.accountId, scopeContext)
        : Promise.resolve(null),
    ]);
    availableRoles.value = result.availableRoles ?? [];
    selectedRoleIds.value = [...(result.selectedRoleIds ?? [])];
    if (terminalAccess) {
      const effectiveTerminals = normalizeAccountTerminals(
        terminalAccess.effectiveAllowedTerminals,
      );
      effectiveAllowedTerminals.value = effectiveTerminals;
      terminalOverrideEnabled.value = Boolean(terminalAccess.hasOverride);
      terminalOverrideValues.value = terminalOverrideEnabled.value
        ? [...effectiveTerminals]
        : [];
    }
  } catch {
    message.error('角色配置加载失败，请稍后重试');
  } finally {
    roleLoading.value = false;
    terminalAccessLoading.value = false;
  }
}

// Persists the account-level terminal access override mutation and refreshes the effective snapshot.
async function persistAccountTerminalAccess() {
  if (!selectedAccount.value || !canManageAccountTerminalAccess.value) {
    return;
  }

  const scopeContext = {
    scopeLevel: selectedAccount.value.scopeLevel,
    tenantId:
      selectedAccount.value.scopeLevel === 'TENANT'
        ? selectedAccount.value.tenantId
        : undefined,
  };

  terminalAccessSaving.value = true;

  try {
    const result = terminalOverrideEnabled.value
      ? await replaceAccountTerminalAccessOverrideApi(selectedAccount.value.accountId, {
          ...scopeContext,
          allowedTerminals: terminalOverrideValues.value,
        })
      : await deleteAccountTerminalAccessOverrideApi(
          selectedAccount.value.accountId,
          scopeContext,
        );
    const effectiveTerminals = normalizeAccountTerminals(
      result.effectiveAllowedTerminals,
    );
    effectiveAllowedTerminals.value = effectiveTerminals;
    terminalOverrideEnabled.value = Boolean(result.hasOverride);
    terminalOverrideValues.value = terminalOverrideEnabled.value
      ? [...effectiveTerminals]
      : [];
    message.success('账号终端准入已保存');
  } catch {
    message.error('账号终端准入保存失败，请稍后重试');
  } finally {
    terminalAccessSaving.value = false;
  }
}

// Confirms full terminal lockout before saving an empty account-level override.
function saveAccountTerminalAccess() {
  if (terminalOverrideEnabled.value && terminalOverrideValues.value.length === 0) {
    Modal.confirm({
      centered: true,
      content: '开启账号专属终端准入但不选择任何终端，会封禁该账号从所有终端登录。',
      okText: '确认封禁',
      okType: 'danger',
      title: '确认封禁该账号全部终端登录？',
      async onOk() {
        await persistAccountTerminalAccess();
      },
    });
    return;
  }

  void persistAccountTerminalAccess();
}

function resetBasicInfoForm() {
  basicInfoForm.displayName = '';
  basicInfoForm.isEnabled = true;
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
    basicInfoForm.isEnabled = result.isEnabled;
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
  const profileChanged
    = displayName !== normalizeBasicInfoValue(selectedBasicInfo.value.displayName);
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
      isEnabled: basicInfoForm.isEnabled,
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
    message.success(
      profileChanged && statusChanged
        ? '账号基本信息与状态已保存'
        : statusChanged
          ? '账号状态已保存'
          : '账号基本信息已保存',
    );
    basicInfoModalOpen.value = false;
    await refreshDirectory({ fallbackToPreviousPageOnEmpty: true });
  } catch {
    message.error(
      statusChanged ? '账号信息保存失败，请稍后重试' : '账号基本信息保存失败，请稍后重试',
    );
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

// stopAccountColumnResize clears active drag listeners for the account table.
function stopAccountColumnResize() {
  activeAccountColumnCleanup?.();
  activeAccountColumnCleanup = null;
  document.body.classList.remove('account-management--resizing-column');
}

// startAccountColumnResize updates one account table column width from pointer movement.
function startAccountColumnResize(event: MouseEvent, columnKey: AccountColumnKey) {
  event.preventDefault();
  event.stopPropagation();

  stopAccountColumnResize();

  const startX = event.clientX;
  const startWidth = accountColumnWidths[columnKey];

  const handleMouseMove = (moveEvent: MouseEvent) => {
    accountColumnWidths[columnKey] = Math.max(
      accountColumnMinWidths[columnKey],
      Math.round(startWidth + moveEvent.clientX - startX),
    );
  };

  const handleMouseUp = () => {
    stopAccountColumnResize();
  };

  document.body.classList.add('account-management--resizing-column');
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp, { once: true });
  activeAccountColumnCleanup = () => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };
}

// renderResizableAccountHeader exposes the resize handle inside an account table header.
function renderResizableAccountHeader(columnKey: AccountColumnKey, label: string) {
  return h('div', { class: 'account-management__resizable-title' }, [
    h('span', { class: 'account-management__resizable-title-text' }, label),
    h('span', {
      'aria-label': `调整${label}列宽`,
      class: 'account-management__column-resizer',
      onMousedown: (event: MouseEvent) =>
        startAccountColumnResize(event, columnKey),
      role: 'separator',
    }),
  ]);
}

const accountColumns = computed<TableColumnsType<AccountManagementRow>>(() => [
  {
    dataIndex: 'userDisplayName',
    key: 'userDisplayName',
    title: renderResizableAccountHeader('userDisplayName', '用户姓名'),
    width: accountColumnWidths.userDisplayName,
    customRender: ({ record }) => record.userDisplayName || '未命名用户',
  },
  {
    dataIndex: 'accountDisplayName',
    key: 'accountDisplayName',
    sorter: (left, right) =>
      getAccountDisplayName(left).localeCompare(getAccountDisplayName(right), 'zh-Hans-CN'),
    title: renderResizableAccountHeader('accountDisplayName', '账号名称'),
    width: accountColumnWidths.accountDisplayName,
    customRender: ({ record }) => getAccountDisplayName(record),
  },
  {
    dataIndex: 'contextLabel',
    key: 'contextLabel',
    title: renderResizableAccountHeader('contextLabel', '账号上下文'),
    width: accountColumnWidths.contextLabel,
    customRender: ({ record }) => getAccountContextTitle(record),
  },
  {
    dataIndex: 'scopeLevel',
    key: 'scopeLevel',
    title: renderResizableAccountHeader('scopeLevel', 'Scope'),
    width: accountColumnWidths.scopeLevel,
    customRender: ({ record }) =>
      h(Tag, { color: record.scopeLevel === 'SYSTEM' ? 'blue' : 'green' }, () =>
        getAccountScopeLabel(record.scopeLevel),
      ),
  },
  {
    dataIndex: 'isEnabled',
    key: 'isEnabled',
    title: renderResizableAccountHeader('isEnabled', '状态'),
    width: accountColumnWidths.isEnabled,
    customRender: ({ record }) =>
      h(Tag, { color: record.isEnabled ? 'green' : 'default' }, () =>
        getAccountStatusLabel(record.isEnabled),
      ),
  },
  {
    align: 'center',
    fixed: 'right',
    key: 'actions',
    title: renderResizableAccountHeader('actions', '操作'),
    width: accountColumnWidths.actions,
    customRender: ({ record }) =>
      renderAccountNativeActions<AccountActionKey>(
        '账号操作',
        [
          { key: 'basicInfo', label: '基本信息' },
          { hidden: !canManageLoginMethods.value, key: 'loginMethods', label: '登录方式' },
          { hidden: !canReadAccountRoles.value, key: 'roles', label: '角色配置' },
          {
            danger: true,
            hidden: !canDeleteAccount.value || record.accountId === currentAccountId.value,
            key: 'delete',
            label: '删除账号',
          },
        ],
        (key) => handleActionClick(key, record),
      ),
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
    align: 'center',
    fixed: 'right',
    key: 'actions',
    title: '操作',
    width: 96,
    customRender: ({ record }) =>
      renderAccountNativeActions<LoginMethodActionKey>(
        '登录方式操作',
        [
          {
            disabled: loginMethodSaving.value,
            key: 'toggle',
            label: record.enabled ? '停用' : '启用',
          },
        ],
        () => {
          void toggleAccountLoginMethod(record);
        },
      ),
  },
]);

onMounted(() => {
  resetCreateAccountForm();
  void loadAccountDirectory();
  if (isPlatformScope.value) {
    void loadTenantOptions();
  }
});

onBeforeUnmount(() => {
  stopAccountColumnResize();
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
            v-access:code="'identity.account.create'"
            v-if="canCreateAccount"
            class="account-management__create-button"
            type="primary"
            @click="openCreateAccountModal"
          >
            新增账号
          </Button>
        </div>

        <section class="account-management__filter-panel">
          <Row :gutter="[10, 10]" class="account-management__filter-row">
            <Col :lg="8" :md="24" :span="24" :xl="7">
              <Input
                v-model:value="accountFilters.keyword"
                allow-clear
                class="account-management__filter-control account-management__filter-search"
                placeholder="搜索账号名称、用户姓名或租户名称"
                @press-enter="searchAccounts"
              >
                <template #prefix>
                  <IconifyIcon icon="ant-design:search-outlined" />
                </template>
              </Input>
            </Col>

            <Col v-if="isPlatformScope" :lg="5" :md="8" :span="24" :xl="5">
              <Select
                v-model:value="accountFilters.tenantId"
                allow-clear
                class="account-management__filter-control"
                data-testid="account-tenant-filter"
                :filter-option="false"
                :loading="tenantOptionLoading"
                :options="accountTenantFilterOptions"
                placeholder="筛选租户"
                show-search
                @search="loadTenantOptions"
              />
            </Col>

            <Col v-if="isPlatformScope" :lg="4" :md="8" :span="24" :xl="4">
              <Select
                v-model:value="accountFilters.scopeLevel"
                class="account-management__filter-control"
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
              :md="8"
              :span="24"
              :xl="4"
              class="account-management__tenant-filter-col"
            >
              <Input
                :value="currentTenantLabel"
                class="account-management__filter-control"
                disabled
              />
            </Col>

            <Col :lg="3" :md="8" :span="24" :xl="3">
              <Select
                v-model:value="accountFilters.status"
                class="account-management__filter-control"
                :options="[
                  { label: '全部状态', value: '' },
                  { label: '启用', value: 'ENABLED' },
                  { label: '停用', value: 'DISABLED' },
                ]"
              />
            </Col>

            <Col
              :lg="4"
              :md="8"
              :span="24"
              :xl="5"
              class="account-management__filter-actions-col"
            >
              <div class="account-management__filter-buttons">
                <Button
                  class="account-management__filter-button"
                  type="primary"
                  @click="searchAccounts"
                >
                  查询
                </Button>
                <Button
                  class="account-management__filter-button"
                  @click="resetAccountFilters"
                >
                  重置
                </Button>
              </div>
            </Col>
          </Row>
        </section>

        <div class="account-management__table-shell">
          <Table
            :columns="accountColumns"
            :data-source="accountRows"
            :loading="accountLoading"
            :pagination="accountTablePagination"
            :row-key="(record) => record.accountId"
            :scroll="{ x: accountTableScrollX }"
            class="account-management__account-table"
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
          <section class="account-management__role-hero">
            <div class="account-management__role-icon">
              <IconifyIcon icon="ant-design:team-outlined" />
            </div>
            <div class="account-management__role-identity">
              <div class="account-management__eyebrow">角色授权</div>
              <div class="account-management__basic-title">
                {{ selectedRoleAccountTitle }}
              </div>
              <div class="account-management__basic-subtitle">
                {{ selectedRoleAccountSubtitle }}
              </div>
            </div>
            <span class="account-management__status-pill account-management__status-pill--enabled">
              {{ roleSummary }}
            </span>
          </section>

          <section class="account-management__role-summary-grid">
            <div
              v-for="item in roleSummaryMeta"
              :key="item.label"
              class="account-management__role-summary-item"
            >
              <div class="account-management__preview-label">{{ item.label }}</div>
              <div class="account-management__preview-value">{{ item.value }}</div>
            </div>
          </section>

          <section
            v-if="canViewTerminalAccess"
            v-loading="terminalAccessLoading"
            class="account-management__editor-block account-management__terminal-editor"
          >
            <div class="account-management__role-toolbar">
              <div>
                <div class="account-management__section-title">最终终端准入</div>
                <div class="account-management__section-description">
                  当前账号最终允许登录的终端。
                </div>
              </div>
              <div class="account-management__terminal-tags">
                <Tag
                  v-for="terminal in effectiveAllowedTerminals"
                  :key="terminal"
                  color="blue"
                >
                  {{ terminal }}
                </Tag>
                <Tag v-if="effectiveAllowedTerminals.length === 0" color="default">
                  无可登录终端
                </Tag>
              </div>
            </div>

            <div class="account-management__terminal-override-row">
              <div>
                <div class="account-management__section-title">账号专属终端准入</div>
                <div class="account-management__section-description">
                  开启后，所选终端会完全替代角色默认准入。
                </div>
              </div>
              <Switch
                v-model:checked="terminalOverrideEnabled"
                :disabled="!canManageAccountTerminalAccess"
              />
            </div>

            <Checkbox.Group
              v-if="terminalOverrideEnabled"
              v-model:value="terminalOverrideValues"
              class="account-management__terminal-group"
              :disabled="!canManageAccountTerminalAccess"
              :options="terminalAccessOptions"
            />

            <div
              v-if="canManageAccountTerminalAccess"
              class="account-management__terminal-actions"
            >
              <Button
                :loading="terminalAccessSaving"
                @click="saveAccountTerminalAccess"
              >
                保存终端准入
              </Button>
            </div>
          </section>

          <section v-loading="roleLoading" class="account-management__editor-block account-management__role-editor">
            <div class="account-management__role-toolbar">
              <div>
                <div class="account-management__section-title">角色列表</div>
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
              v-access:code="'permission.account.assign_roles'"
              v-if="canSetAccountRoles"
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
        :width="720"
        @ok="submitBasicInfo"
      >
        <div v-if="selectedBasicInfo" class="account-management__basic-info">
          <section class="account-management__basic-hero">
            <div class="account-management__basic-avatar">
              {{ basicInfoAvatarText }}
            </div>
            <div class="account-management__basic-identity">
              <div class="account-management__eyebrow">身份档案</div>
              <div class="account-management__basic-title">
                {{ basicInfoIdentityTitle }}
              </div>
              <div class="account-management__basic-subtitle">
                {{ basicInfoIdentitySubtitle }}
              </div>
            </div>
            <span
              :class="[
                'account-management__status-pill',
                basicInfoForm.isEnabled
                  ? 'account-management__status-pill--enabled'
                  : 'account-management__status-pill--disabled',
              ]"
            >
              {{ getAccountStatusLabel(basicInfoForm.isEnabled) }}
            </span>
          </section>

          <section class="account-management__basic-layout">
            <section
              v-loading="basicInfoLoading"
              class="account-management__editor-block account-management__basic-editor"
            >
              <div class="account-management__block-header">
                <div>
                  <div class="account-management__section-title">可维护字段</div>
                  <div class="account-management__section-description">
                    更新姓名与账号启停状态
                  </div>
                </div>
              </div>

              <Form layout="vertical">
                <Row :gutter="[16, 8]">
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

                  <Col :span="24">
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
                </Row>
              </Form>
            </section>

            <aside class="account-management__basic-contact-panel">
              <div class="account-management__section-title">联系方式</div>
              <div class="account-management__section-description">
                联系方式需通过登录方式或绑定流程维护
              </div>

              <div class="account-management__basic-contact-list">
                <div
                  v-for="item in basicInfoContactRows"
                  :key="item.label"
                  class="account-management__basic-contact-row"
                >
                  <span>{{ item.label }}</span>
                  <strong>{{ item.value }}</strong>
                </div>
              </div>
            </aside>
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
          <section class="account-management__login-hero">
            <div class="account-management__login-icon">
              <IconifyIcon icon="ant-design:safety-certificate-outlined" />
            </div>
            <div class="account-management__login-identity">
              <div class="account-management__eyebrow">登录安全</div>
              <div class="account-management__basic-title">
                {{ selectedSecurityAccountTitle }}
              </div>
              <div class="account-management__basic-subtitle">
                {{ selectedSecurityAccountSubtitle }}
              </div>
            </div>
            <span
              :class="[
                'account-management__status-pill',
                selectedAccountPasswordSetupRequired
                  ? 'account-management__status-pill--warning'
                  : 'account-management__status-pill--enabled',
              ]"
            >
              {{ loginMethodPasswordStatusLabel }}
            </span>
          </section>

          <section class="account-management__login-summary-grid">
            <div
              v-for="item in loginMethodSummaryMeta"
              :key="item.label"
              class="account-management__login-summary-item"
            >
              <div class="account-management__preview-label">{{ item.label }}</div>
              <div class="account-management__preview-value">{{ item.value }}</div>
            </div>
          </section>

          <div class="account-management__login-action-row">
            <div class="account-management__muted">
              {{ selectedAccountPasswordSetupRequired ? '当前用户下次登录时需要重新设置密码。' : '当前账号密码状态正常。' }}
            </div>
            <Space class="account-management__login-method-actions">
              <Button
                :loading="loginMethodLoading"
                @click="selectedSecurityAccount && loadAccountLoginMethods(selectedSecurityAccount)"
              >
                刷新
              </Button>
              <Button
                v-access:code="'auth.account_login_methods.manage'"
                v-if="canManageLoginMethods"
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
              :scroll="{ x: 760 }"
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
  --account-table-border: hsl(var(--border));
  --account-table-header-bg: hsl(var(--muted) / 0.54);
  --account-table-resizer: hsl(var(--muted-foreground) / 0.3);
  --account-table-row-hover-bg: hsl(var(--muted) / 0.42);
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
  flex-wrap: nowrap;
  margin-bottom: 12px;
}

.account-management__heading {
  align-items: baseline;
  display: flex;
  flex: 1 1 auto;
  flex-wrap: wrap;
  gap: 12px;
  min-width: 0;
}

.account-management__create-button {
  flex: 0 0 auto;
  margin-left: auto;
  min-width: 96px;
  width: auto;
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

.account-management__filter-panel,
.account-management__table-shell {
  margin-bottom: 12px;
}

.account-management__filter-panel {
  padding: 12px;
  border: 1px solid var(--account-border);
  border-radius: 10px;
  background: hsl(var(--muted) / 0.34);
}

.account-management__filter-row {
  align-items: center;
}

.account-management__filter-control {
  width: 100%;
}

.account-management__filter-search:deep(.ant-input-prefix) {
  color: var(--account-muted);
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

.account-management__filter-buttons {
  display: grid;
  grid-template-columns: minmax(84px, 1fr) minmax(84px, 1fr);
  gap: 8px;
  margin-left: auto;
  width: min(100%, 184px);
}

.account-management__filter-button {
  min-width: 0;
  width: 100%;
}

.account-management__section-title {
  color: var(--account-text);
  font-size: 14px;
  font-weight: 600;
}

.account-management__section-description {
  margin-top: 4px;
  color: var(--account-muted);
  font-size: 12px;
  line-height: 20px;
}

.account-management__drawer {
  display: grid;
  gap: 16px;
}

.account-management__basic-info {
  display: grid;
  gap: 14px;
}

.account-management__basic-hero {
  display: grid;
  align-items: center;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 14px;
  padding: 18px;
  border: 1px solid var(--account-border);
  border-radius: 10px;
  background:
    linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--muted) / 0.62) 100%);
}

.account-management__basic-avatar {
  display: inline-grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border: 1px solid hsl(var(--primary) / 0.24);
  border-radius: 12px;
  background: hsl(var(--primary) / 0.1);
  color: hsl(var(--primary));
  font-size: 20px;
  font-weight: 700;
}

.account-management__basic-identity {
  min-width: 0;
}

.account-management__eyebrow {
  color: var(--account-muted);
  font-size: 12px;
  line-height: 18px;
}

.account-management__basic-title {
  overflow: hidden;
  margin-top: 3px;
  color: var(--account-title);
  font-size: 20px;
  font-weight: 600;
  line-height: 28px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-management__basic-subtitle {
  overflow: hidden;
  margin-top: 3px;
  color: var(--account-muted);
  font-size: 13px;
  line-height: 20px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-management__status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 30px;
  padding: 0 12px;
  border: 1px solid var(--account-border);
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.account-management__status-pill--enabled {
  border-color: rgb(22 163 74 / 0.22);
  background: rgb(22 163 74 / 0.08);
  color: rgb(21 128 61);
}

.account-management__status-pill--disabled {
  border-color: rgb(100 116 139 / 0.22);
  background: rgb(100 116 139 / 0.08);
  color: rgb(71 85 105);
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

.account-management__role-hero {
  display: grid;
  align-items: center;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 14px;
  padding: 18px;
  border: 1px solid var(--account-border);
  border-radius: 10px;
  background:
    linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--muted) / 0.62) 100%);
}

.account-management__role-icon {
  display: inline-grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border: 1px solid hsl(var(--primary) / 0.24);
  border-radius: 12px;
  background: hsl(var(--primary) / 0.1);
  color: hsl(var(--primary));
  font-size: 24px;
}

.account-management__role-identity {
  min-width: 0;
}

.account-management__role-summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.account-management__role-summary-item {
  padding: 12px 14px;
  border: 1px solid var(--account-border);
  border-radius: 8px;
  background: hsl(var(--card));
}

.account-management__role-editor {
  background: hsl(var(--muted) / 0.38);
}

.account-management__terminal-editor {
  display: grid;
  gap: 14px;
}

.account-management__terminal-tags,
.account-management__terminal-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.account-management__terminal-override-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--account-border);
}

.account-management__terminal-actions {
  display: flex;
  justify-content: flex-end;
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
  padding: 4px 6px;
  border-left: 1px solid var(--account-border);
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

.account-management__basic-editor {
  background: hsl(var(--muted) / 0.38);
}

.account-management__basic-layout {
  display: grid;
  align-items: start;
  grid-template-columns: minmax(0, 1.55fr) minmax(220px, 0.85fr);
  gap: 14px;
}

.account-management__basic-contact-panel {
  display: grid;
  gap: 14px;
  padding: 16px;
  border: 1px solid var(--account-border);
  border-radius: 8px;
  background: hsl(var(--card));
}

.account-management__basic-contact-list {
  display: grid;
  gap: 10px;
}

.account-management__basic-contact-row {
  display: grid;
  gap: 4px;
  padding-top: 10px;
  border-top: 1px solid var(--account-border);
}

.account-management__basic-contact-row span {
  color: var(--account-muted);
  font-size: 12px;
}

.account-management__basic-contact-row strong {
  color: var(--account-title);
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
  overflow-wrap: anywhere;
}

.account-management__roles {
  display: grid;
  gap: 8px;
  width: 100%;
}

.account-management__role-list-shell {
  max-height: 460px;
  overflow: auto;
  padding: 2px 4px 2px 0;
}

.account-management__role-item {
  display: grid;
  align-items: center;
  grid-template-columns: auto 1fr auto;
  gap: 10px;
  padding: 10px 12px;
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
  gap: 14px;
}

.account-management__login-hero {
  display: grid;
  align-items: center;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 14px;
  padding: 18px;
  border: 1px solid var(--account-border);
  border-radius: 10px;
  background:
    linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--muted) / 0.62) 100%);
}

.account-management__login-icon {
  display: inline-grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border: 1px solid hsl(var(--primary) / 0.24);
  border-radius: 12px;
  background: hsl(var(--primary) / 0.1);
  color: hsl(var(--primary));
  font-size: 24px;
}

.account-management__login-identity {
  min-width: 0;
}

.account-management__login-summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.account-management__login-summary-item {
  padding: 12px 14px;
  border: 1px solid var(--account-border);
  border-radius: 8px;
  background: hsl(var(--card));
}

.account-management__login-action-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 2px 0;
}

.account-management__status-pill--warning {
  border-color: rgb(217 119 6 / 0.24);
  background: rgb(217 119 6 / 0.08);
  color: rgb(180 83 9);
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
  background: var(--account-table-header-bg);
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
  background: var(--account-table-row-hover-bg);
}

:deep(.account-management__account-table .ant-table-cell) {
  white-space: nowrap;
}

:deep(.account-management__account-table .ant-table-thead > tr > th) {
  position: relative;
  user-select: none;
}

.account-management__resizable-title {
  position: relative;
  display: flex;
  align-items: center;
  min-height: 24px;
  padding-right: 12px;
}

.account-management__resizable-title-text {
  min-width: 0;
}

.account-management__column-resizer {
  position: absolute;
  top: -12px;
  right: -10px;
  bottom: -12px;
  z-index: 2;
  width: 14px;
  cursor: col-resize;
}

.account-management__column-resizer::after {
  position: absolute;
  top: 12px;
  bottom: 12px;
  left: 6px;
  width: 1px;
  content: '';
  background: var(--account-table-resizer);
  transition: background 0.16s ease;
}

.account-management__column-resizer:hover::after {
  background: hsl(var(--primary));
}

:global(body.account-management--resizing-column) {
  cursor: col-resize;
  user-select: none;
}

:deep(.account-management__login-method-table-shell .ant-table-tbody > tr > td) {
  border-bottom-color: var(--account-table-border);
}

:deep(.account-management__filter-panel .ant-input),
:deep(.account-management__filter-panel .ant-input-affix-wrapper),
:deep(.account-management__filter-panel .ant-select-selector) {
  background: hsl(var(--input-background));
  border-color: hsl(var(--input));
  color: var(--account-text);
  min-height: 36px;
  border-radius: 10px;
}

:deep(.account-management__filter-panel .ant-select-selector) {
  align-items: center;
  display: flex;
}

:deep(.account-management__filter-panel .ant-input-affix-wrapper) {
  padding-top: 0;
  padding-bottom: 0;
}

:deep(.account-management__filter-panel .ant-btn) {
  height: 36px;
  border-radius: 10px;
}

@media (width <= 768px) {
  .account-management__block-header,
  .account-management__role-toolbar,
  .account-management__login-action-row {
    flex-direction: column;
    align-items: stretch;
  }

  .account-management__toolbar {
    gap: 8px;
  }

  .account-management__heading {
    gap: 6px 10px;
  }

  .account-management__create-button {
    min-width: 88px;
    padding-inline: 14px;
  }

  .account-management__filter-actions-col {
    justify-content: flex-end;
  }

  .account-management__filter-buttons {
    width: min(100%, 184px);
  }

  .account-management__basic-hero {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .account-management__login-hero {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .account-management__role-hero {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .account-management__status-pill {
    grid-column: 1 / -1;
    justify-content: flex-start;
    width: fit-content;
  }

  .account-management__login-summary-grid {
    grid-template-columns: 1fr;
  }

  .account-management__role-summary-grid {
    grid-template-columns: 1fr;
  }

  .account-management__basic-layout {
    grid-template-columns: 1fr;
  }

  .account-management__role-search {
    width: 100%;
  }

  .account-management__basic-title,
  .account-management__basic-subtitle {
    white-space: normal;
  }
}
</style>
