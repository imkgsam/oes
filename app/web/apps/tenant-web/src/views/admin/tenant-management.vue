<script setup lang="ts">
import type { TenantManagementApi } from '#/api';
import type { TableColumnsType } from 'ant-design-vue';

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
  Radio,
  Row,
  Select,
  Space,
  Steps,
  Table,
  Tag,
  message,
} from 'ant-design-vue';

import {
  getManagedTenantByIdApi,
  listManagedTenantsApi,
  searchFirstAdminUserCandidatesApi,
  startTenantOnboardingApi,
  updateManagedTenantProfileApi,
  updateManagedTenantStatusApi,
} from '#/api';
import CountryRegionSelect from '#/components/country-region-select.vue';
import { useAuthContextStore } from '#/store/auth-context';
import PhoneNumberInput from '../_core/authentication/phone-number-input.vue';

interface TenantFilterState {
  keyword: string;
  status: '' | 'ACTIVE' | 'ARCHIVED' | 'SUSPENDED';
}

type TenantActionKey = 'archive' | 'detail' | 'restore' | 'suspend';

interface TenantTableActionItem<ActionKey extends string> {
  danger?: boolean;
  disabled?: boolean;
  hidden?: boolean;
  key: ActionKey;
  label: string;
}

interface TenantCreateFormState {
  adminDisplayName: string;
  adminEmail: string;
  adminExistingUserDisplayName: string;
  adminExistingUserId: string;
  adminMode: 'CREATE_NEW_USER' | 'EXISTING_USER';
  adminPhone: string;
  code: string;
  idempotencyKey: string;
  organizationIdentifierRawValue: string;
  organizationIdentifierType: string;
  organizationLegalName: string;
  registeredCountry: string;
}

interface TenantDetailFormState {
  code: string;
  id: string;
  name: string;
  rootOrgName: string;
  status: string;
  userCount: number | null;
}

const authContextStore = useAuthContextStore();
const statusOptions: Array<{ label: string; value: string }> = [
  { label: '全部状态', value: '' },
  { label: '启用', value: 'ACTIVE' },
  { label: '停用', value: 'SUSPENDED' },
  { label: '归档', value: 'ARCHIVED' },
];
const onboardingSteps = [
  { title: '租户信息' },
  { title: '首管理员' },
];
const identifierTypeOptions = [
  { label: '统一社会信用代码', value: 'UNIFIED_SOCIAL_CREDIT_CODE' },
  { label: 'EIN', value: 'EIN' },
  { label: 'UEN', value: 'UEN' },
  { label: '商业登记号', value: 'BUSINESS_REGISTRATION_NUMBER' },
];

const filters = reactive<TenantFilterState>({
  keyword: '',
  status: '',
});
const createForm = reactive<TenantCreateFormState>({
  adminDisplayName: '',
  adminEmail: '',
  adminExistingUserDisplayName: '',
  adminExistingUserId: '',
  adminMode: 'CREATE_NEW_USER',
  adminPhone: '',
  code: '',
  idempotencyKey: '',
  organizationIdentifierRawValue: '',
  organizationIdentifierType: 'BUSINESS_REGISTRATION_NUMBER',
  organizationLegalName: '',
  registeredCountry: '',
});
const detailForm = reactive<TenantDetailFormState>({
  code: '',
  id: '',
  name: '',
  rootOrgName: '',
  status: '',
  userCount: null,
});

const tenants = ref<TenantManagementApi.TenantSummary[]>([]);
const loading = ref(false);
const createOpen = ref(false);
const createSaving = ref(false);
const createStep = ref(0);
const onboardingResult = ref<TenantManagementApi.TenantOnboardingResult | null>(null);
const existingAdminSearchLoading = ref(false);
const existingAdminOptions = ref<Array<{ displayName?: string; label: string; userId?: string; value: string }>>([]);
const detailOpen = ref(false);
const detailLoading = ref(false);
const detailSaving = ref(false);
const selectedTenantId = ref('');
const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
});

/** renderTenantNativeActions renders tenant row commands with Ant Design Vue Dropdown/Menu directly. */
function renderTenantNativeActions<ActionKey extends string>(
  ariaLabel: string,
  items: Array<TenantTableActionItem<ActionKey>>,
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
              const action = visibleItems.find((item) => item.key === String(info.key));

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

const isPlatformScope = computed(() => authContextStore.isPlatformScope);
const canCreateTenant = computed(() =>
  authContextStore.actionCodes.includes('tenant_org.tenant.create'),
);
const canReadTenant = computed(() =>
  authContextStore.actionCodes.includes('tenant_org.tenant.get_by_id'),
);
const canUpdateTenantProfile = computed(() =>
  authContextStore.actionCodes.includes('tenant_org.tenant.update_profile'),
);
const canUpdateTenantStatus = computed(() =>
  authContextStore.actionCodes.includes('tenant_org.tenant.update_status'),
);
const detailTitle = computed(() =>
  detailForm.name ? `${detailForm.name} · 基础信息` : 'Tenant 基础信息',
);
const tablePagination = computed(() => ({
  current: pagination.current,
  pageSize: pagination.pageSize,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条`,
  total: pagination.total,
}));
const tenantTotalText = computed(() => `共 ${pagination.total} 个租户`);
const canProceedTenantStep = computed(() =>
  Boolean(
    createForm.code.trim() &&
      createForm.organizationLegalName.trim() &&
      createForm.registeredCountry.trim() &&
      createForm.organizationIdentifierType.trim() &&
      normalizedOrganizationIdentifier.value,
  ),
);
const canSubmitOnboarding = computed(() =>
  Boolean(
    canProceedTenantStep.value &&
      (createForm.adminMode === 'EXISTING_USER'
        ? createForm.adminExistingUserId.trim()
        : createForm.adminDisplayName.trim() &&
          (createForm.adminEmail.trim() || createForm.adminPhone.trim())),
  ),
);

const columns = computed<TableColumnsType<TenantManagementApi.TenantSummary>>(() => [
  {
    dataIndex: 'name',
    title: '租户名称',
  },
  {
    dataIndex: 'code',
    title: '租户编码',
  },
  {
    dataIndex: 'status',
    title: '状态',
    customRender: ({ record }) =>
      h(
        Tag,
        {
          color: statusColor(record.status),
        },
        () => statusLabel(record.status),
      ),
  },
  {
    dataIndex: 'userCount',
    title: '用户数',
    customRender: ({ record }) => formatUserCount(record.userCount),
  },
  {
    align: 'center',
    fixed: 'right',
    key: 'actions',
    title: '操作',
    width: 72,
    customRender: ({ record }) =>
      renderTenantNativeActions<TenantActionKey>(
        '租户操作',
        [
          { hidden: !canReadTenant.value, key: 'detail', label: '查看' },
          {
            danger: true,
            hidden: !canUpdateTenantStatus.value || record.status !== 'ACTIVE',
            key: 'suspend',
            label: '停用',
          },
          {
            hidden: !canUpdateTenantStatus.value || record.status !== 'SUSPENDED',
            key: 'restore',
            label: '恢复',
          },
          {
            danger: true,
            hidden: !canUpdateTenantStatus.value || record.status === 'ARCHIVED',
            key: 'archive',
            label: '归档',
          },
        ],
        (key) => {
          if (key === 'detail') {
            openTenantDetail(record.id);
            return;
          }

          if (key === 'suspend') {
            confirmTenantStatus(record.id, 'SUSPENDED');
            return;
          }

          confirmTenantStatus(record.id, key === 'restore' ? 'ACTIVE' : 'ARCHIVED');
        },
      ),
  },
]);

const organizationIdentifierPlaceholder = computed(() => {
  switch (createForm.organizationIdentifierType) {
    case 'EIN': {
      return '例如 12-3456789';
    }
    case 'UNIFIED_SOCIAL_CREDIT_CODE': {
      return '例如 91310000MA1K3XXXX';
    }
    case 'UEN': {
      return '例如 201912345A';
    }
    default: {
      return '请输入企业登记识别码';
    }
  }
});

const normalizedOrganizationIdentifier = computed(() =>
  normalizeIdentifierValue(createForm.organizationIdentifierRawValue),
);

/** loadTenantList refreshes the system-admin tenant table from the BFF. */
async function loadTenantList() {
  if (!isPlatformScope.value) {
    return;
  }

  loading.value = true;
  try {
    const result = await listManagedTenantsApi({
      keyword: filters.keyword.trim() || undefined,
      page: pagination.current,
      pageSize: pagination.pageSize,
      status: filters.status || undefined,
    });

    tenants.value = result.items ?? [];
    pagination.total = result.total ?? 0;
  } catch (error) {
    message.error(resolveErrorMessage(error, '租户列表加载失败'));
    tenants.value = [];
    pagination.total = 0;
  } finally {
    loading.value = false;
  }
}

/** resetCreateForm restores the create modal back to an empty tenant draft. */
function resetCreateForm() {
  createForm.adminDisplayName = '';
  createForm.adminEmail = '';
  createForm.adminExistingUserDisplayName = '';
  createForm.adminExistingUserId = '';
  createForm.adminMode = 'CREATE_NEW_USER';
  createForm.adminPhone = '';
  existingAdminOptions.value = [];
  createForm.code = '';
  createForm.idempotencyKey = `tenant-onboarding-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  createForm.organizationIdentifierRawValue = '';
  createForm.organizationIdentifierType = 'BUSINESS_REGISTRATION_NUMBER';
  createForm.organizationLegalName = '';
  createForm.registeredCountry = '';
  createStep.value = 0;
  onboardingResult.value = null;
}

/** openCreateModal prepares a fresh tenant draft for system-admin creation. */
function openCreateModal() {
  if (!canCreateTenant.value) {
    return;
  }

  resetCreateForm();
  createOpen.value = true;
}

/** submitCreateTenant sends one tenant creation request and refreshes the list. */
async function submitCreateTenant() {
  if (!canCreateTenant.value) {
    return;
  }
  if (!canProceedTenantStep.value) {
    message.error('请先填写完整租户信息');
    createStep.value = 0;
    return;
  }
  if (!canSubmitOnboarding.value) {
    message.error('请填写首管理员姓名，并至少提供邮箱或手机');
    createStep.value = 1;
    return;
  }

  createSaving.value = true;
  try {
    const result = await startTenantOnboardingApi({
      idempotencyKey: createForm.idempotencyKey,
      tenant: {
        code: createForm.code.trim(),
        name: createForm.organizationLegalName.trim(),
      },
      organizationParty: {
        legalName: createForm.organizationLegalName.trim(),
        registeredCountry: createForm.registeredCountry.trim() || undefined,
        identifiers: [
          {
            identifierType: createForm.organizationIdentifierType.trim(),
            issuerCountryOrRegion: createForm.registeredCountry.trim(),
            normalizedValue: normalizedOrganizationIdentifier.value,
            rawValue: createForm.organizationIdentifierRawValue.trim(),
          },
        ],
      },
      rootOrg: {
        name: createForm.organizationLegalName.trim(),
      },
      firstAdmin: {
        displayName:
          createForm.adminMode === 'EXISTING_USER'
            ? createForm.adminExistingUserDisplayName.trim()
            : createForm.adminDisplayName.trim(),
        email:
          createForm.adminMode === 'EXISTING_USER'
            ? undefined
            : createForm.adminEmail.trim() || undefined,
        existingUserId:
          createForm.adminMode === 'EXISTING_USER'
            ? createForm.adminExistingUserId.trim()
            : undefined,
        phone:
          createForm.adminMode === 'EXISTING_USER'
            ? undefined
            : createForm.adminPhone.trim() || undefined,
        provisioningMode: createForm.adminMode,
        requirePasswordSetup: createForm.adminMode !== 'EXISTING_USER',
      },
    });
    if (result.onboarding?.status === 'SUCCEEDED') {
      message.success('租户开通已完成');
      createOpen.value = false;
      onboardingResult.value = null;
    } else {
      onboardingResult.value = result.onboarding ?? null;
      message.error(result.onboarding?.failure?.message || '租户开通未完成');
    }
    await loadTenantList();
  } catch (error) {
    const failedOnboarding = extractOnboardingResultFromError(error);
    if (failedOnboarding) {
      onboardingResult.value = failedOnboarding;
    }
    message.error(resolveErrorMessage(error, '租户开通失败'));
  } finally {
    createSaving.value = false;
  }
}

/** syncDetailForm copies one tenant detail snapshot into the editable drawer model. */
function syncDetailForm(tenant: TenantManagementApi.TenantSummary) {
  detailForm.id = tenant.id;
  detailForm.code = tenant.code;
  detailForm.name = tenant.name;
  detailForm.rootOrgName = tenant.rootOrgName || '';
  detailForm.status = tenant.status;
  detailForm.userCount = typeof tenant.userCount === 'number' ? tenant.userCount : null;
}

/** openTenantDetail loads one tenant snapshot into the detail drawer. */
async function openTenantDetail(tenantId: string) {
  detailOpen.value = true;
  detailLoading.value = true;
  selectedTenantId.value = tenantId;

  try {
    const result = await getManagedTenantByIdApi(tenantId);
    if (result.tenant) {
      syncDetailForm(result.tenant);
    }
  } catch (error) {
    message.error(resolveErrorMessage(error, '租户详情加载失败'));
  } finally {
    detailLoading.value = false;
  }
}

/** submitTenantProfile persists the drawer's mutable tenant metadata. */
async function submitTenantProfile() {
  if (!selectedTenantId.value || !canUpdateTenantProfile.value) {
    return;
  }

  detailSaving.value = true;
  try {
    const result = await updateManagedTenantProfileApi(selectedTenantId.value, {
      code: detailForm.code.trim() || undefined,
      name: detailForm.name.trim() || undefined,
    });
    if (result.tenant) {
      syncDetailForm(result.tenant);
    }
    message.success('租户基础信息已更新');
    await loadTenantList();
  } catch (error) {
    message.error(resolveErrorMessage(error, '租户基础信息更新失败'));
  } finally {
    detailSaving.value = false;
  }
}

/** confirmTenantStatus requests one lifecycle change after explicit operator confirmation. */
function confirmTenantStatus(
  tenantId: string,
  status: TenantManagementApi.UpdateTenantStatusPayload['status'],
) {
  Modal.confirm({
    title: `${statusLabel(status)}租户`,
    content: `将执行 ${statusLabel(status)} 操作，这只影响 tenant 基础状态，不会进入组织、员工或账号细项。`,
    async onOk() {
      await updateManagedTenantStatusApi(tenantId, {
        status,
        reason:
          status === 'SUSPENDED'
            ? '系统管理员执行停用'
            : status === 'ACTIVE'
              ? '系统管理员执行恢复'
              : '系统管理员执行归档',
      });
      message.success('租户状态已更新');
      await loadTenantList();
      if (detailOpen.value && selectedTenantId.value === tenantId) {
        await openTenantDetail(tenantId);
      }
    },
  });
}

/** resetFilters clears the current tenant list filters and reloads the first page. */
async function resetFilters() {
  filters.keyword = '';
  filters.status = '';
  pagination.current = 1;
  await loadTenantList();
}

/** handleTableChange keeps pagination state in sync with the Ant table component. */
async function handleTableChange(page: { current?: number; pageSize?: number }) {
  pagination.current = page.current ?? 1;
  pagination.pageSize = page.pageSize ?? 20;
  await loadTenantList();
}

/** resolveErrorMessage normalizes one thrown request error into stable operator-facing copy. */
function resolveErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'message' in error) {
    const messageValue = (error as { message?: unknown }).message;
    if (typeof messageValue === 'string' && messageValue.trim()) {
      return messageValue;
    }
  }
  return fallback;
}

/** extractOnboardingResultFromError keeps failed Saga details visible when the BFF returns non-2xx. */
function extractOnboardingResultFromError(error: unknown): TenantManagementApi.TenantOnboardingResult | null {
  if (!error || typeof error !== 'object') {
    return null;
  }
  const candidate = error as {
    data?: { details?: { onboarding?: TenantManagementApi.TenantOnboardingResult } };
    details?: { onboarding?: TenantManagementApi.TenantOnboardingResult };
    response?: { data?: { details?: { onboarding?: TenantManagementApi.TenantOnboardingResult } } };
  };
  return (
    candidate.response?.data?.details?.onboarding ??
    candidate.data?.details?.onboarding ??
    candidate.details?.onboarding ??
    null
  );
}

function statusColor(status: string) {
  switch (status.toUpperCase()) {
    case 'ACTIVE': {
      return 'green';
    }
    case 'ARCHIVED': {
      return 'default';
    }
    default: {
      return 'orange';
    }
  }
}

function statusLabel(status: string) {
  switch (status.toUpperCase()) {
    case 'ACTIVE': {
      return '启用';
    }
    case 'ARCHIVED': {
      return '归档';
    }
    default: {
      return '停用';
    }
  }
}

/** formatUserCount renders identity-owned tenant account totals without exposing internal ids. */
function formatUserCount(value: number | undefined) {
  return typeof value === 'number' ? value : '-';
}

/** inferIdentifierType chooses the default legal identifier type for a registered country. */
function inferIdentifierType(countryOrRegion: string) {
  switch (countryOrRegion.trim().toUpperCase()) {
    case 'CN': {
      return 'UNIFIED_SOCIAL_CREDIT_CODE';
    }
    case 'SG': {
      return 'UEN';
    }
    case 'US': {
      return 'EIN';
    }
    default: {
      return 'BUSINESS_REGISTRATION_NUMBER';
    }
  }
}

/** normalizeIdentifierValue creates the stable party identifier value sent to onboarding APIs. */
function normalizeIdentifierValue(value: string) {
  return value.trim().toUpperCase().replaceAll(/[^A-Z0-9]/g, '');
}

/** handleRegisteredCountryChange keeps the organization identifier type aligned with the selected jurisdiction. */
function handleRegisteredCountryChange(registeredCountry: string | undefined) {
  createForm.registeredCountry = registeredCountry || '';
  createForm.organizationIdentifierType = inferIdentifierType(registeredCountry || '');
}

/** searchExistingAdminUsers resolves exact email/phone matches for first-admin existing user binding. */
async function searchExistingAdminUsers(keyword: string) {
  const normalizedKeyword = keyword.trim();
  createForm.adminExistingUserId = '';
  createForm.adminExistingUserDisplayName = '';
  if (!isExistingUserSearchKeyword(normalizedKeyword)) {
    existingAdminOptions.value = [];
    return;
  }

  existingAdminSearchLoading.value = true;
  try {
    const result = await searchFirstAdminUserCandidatesApi(
      normalizedKeyword,
      createForm.registeredCountry || undefined,
    );
    existingAdminOptions.value = (result.items ?? [])
      .filter((candidate) => candidate.isActive)
      .map((candidate) => ({
        displayName: candidate.displayName,
        label: formatExistingAdminCandidate(candidate),
        userId: candidate.userId,
        value: candidate.userId,
      }));
  } catch (error) {
    existingAdminOptions.value = [];
    message.error(resolveErrorMessage(error, '已有用户查询失败'));
  } finally {
    existingAdminSearchLoading.value = false;
  }
}

/** isExistingUserSearchKeyword allows email or phone-like input without exposing a general user directory. */
function isExistingUserSearchKeyword(keyword: string) {
  return (
    isCompleteEmailSearchKeyword(keyword) ||
    buildPhoneSearchCandidates(keyword, createForm.registeredCountry).length > 0
  );
}

/** isCompleteEmailSearchKeyword keeps email lookup from firing on intermediate input like "name@". */
function isCompleteEmailSearchKeyword(keyword: string) {
  return /^[^\s@]+@(?:[^\s@.]+\.)+[A-Za-z]{2,}$/.test(keyword);
}

/** buildPhoneSearchCandidates mirrors gateway phone completeness rules before issuing a remote query. */
function buildPhoneSearchCandidates(keyword: string, countryOrRegion?: string) {
  const compact = keyword.trim().replaceAll(/[\s().-]/g, '');
  const digits = compact.replaceAll(/\D/g, '');
  if (!digits) {
    return [];
  }

  const country = countryOrRegion?.trim().toUpperCase();
  if (compact.startsWith('+')) {
    return /^\+[1-9]\d{5,19}$/.test(`+${digits}`) ? [`+${digits}`] : [];
  }
  if (compact.startsWith('00')) {
    const candidate = `+${digits.slice(2)}`;
    return /^\+[1-9]\d{5,19}$/.test(candidate) ? [candidate] : [];
  }
  if (
    (country === 'US' || country === 'CA') &&
    (digits.length === 10 || (digits.length === 11 && digits.startsWith('1')))
  ) {
    return [digits];
  }
  if (country === 'CN' && digits.length === 11 && digits.startsWith('1')) {
    return [digits];
  }
  if (country === 'SG' && digits.length === 8) {
    return [digits];
  }
  return [];
}

/** handleExistingAdminChange stores the selected identity user reference for onboarding submission. */
function handleExistingAdminChange(selectedValue: unknown) {
  const normalizedValue = typeof selectedValue === 'string' ? selectedValue : '';
  const option = existingAdminOptions.value.find((item) => item.value === normalizedValue);
  createForm.adminExistingUserId = option?.userId ?? normalizedValue;
  createForm.adminExistingUserDisplayName = option?.displayName ?? normalizedValue;
}

/** formatExistingAdminCandidate creates one compact Select label without exposing a user directory. */
function formatExistingAdminCandidate(candidate: TenantManagementApi.FirstAdminUserCandidate) {
  const contacts = [candidate.maskedEmail, candidate.maskedPhone].filter(Boolean).join(' · ');
  return contacts ? `${candidate.displayName} · ${contacts}` : candidate.displayName;
}

onMounted(async () => {
  await loadTenantList();
});
</script>

<template>
  <Page title="租户管理">
    <Card v-if="!isPlatformScope">
      <Empty description="仅系统管理员可访问租户管理入口" />
    </Card>

    <div v-else class="tenant-management">
      <Card :bordered="false" class="tenant-management__workspace">
        <div class="tenant-management__workbench-head">
          <div class="tenant-management__title-block">
            <h2>租户管理</h2>
          </div>
          <div class="tenant-management__head-actions">
            <span class="tenant-management__total">{{ tenantTotalText }}</span>
            <Button
              v-access:code="'tenant_org.tenant.create'"
              v-if="canCreateTenant"
              data-testid="tenant-create-open"
              type="primary"
              @click="openCreateModal"
            >
              <IconifyIcon icon="lucide:plus" />
              开通租户
            </Button>
          </div>
        </div>

        <div class="tenant-management__toolbar">
          <div class="tenant-management__filter-grid">
            <Form.Item label="关键词">
              <Input
                v-model:value="filters.keyword"
                class="tenant-management__filter-control"
                placeholder="按租户名称或编码筛选"
                @press-enter="loadTenantList"
              />
            </Form.Item>
            <Form.Item label="状态">
              <Select
                v-model:value="filters.status"
                class="tenant-management__filter-control"
                :options="statusOptions"
              />
            </Form.Item>
          </div>
          <div class="tenant-management__filter-buttons">
            <Button class="tenant-management__filter-button" type="primary" @click="loadTenantList">
              <IconifyIcon icon="lucide:search" />
              查询
            </Button>
            <Button class="tenant-management__filter-button" @click="resetFilters">
              <IconifyIcon icon="lucide:rotate-ccw" />
              重置
            </Button>
          </div>
        </div>

        <div class="tenant-management__table-wrap">
          <Table
            :columns="columns"
            :data-source="tenants"
            :loading="loading"
            :pagination="tablePagination"
            :row-key="(record: TenantManagementApi.TenantSummary) => record.id"
            @change="handleTableChange"
          >
            <template #emptyText>
              <Empty description="暂无租户数据" />
            </template>
          </Table>
        </div>
      </Card>

      <Modal
        v-model:open="createOpen"
        title="创建租户"
        :get-container="false"
        :confirm-loading="createSaving"
        :width="680"
        @ok="submitCreateTenant"
      >
        <div class="tenant-management__onboarding">
          <Steps
            :current="createStep"
            :items="onboardingSteps"
            class="tenant-management__onboarding-steps"
          />

          <Form v-if="createStep === 0" layout="vertical" class="tenant-management__onboarding-form">
            <Row :gutter="16">
              <Col :md="12" :span="24">
                <Form.Item label="Tenant 编码" required>
                  <Input v-model:value="createForm.code" placeholder="例如 tenant.alpha" />
                </Form.Item>
              </Col>
              <Col :md="12" :span="24">
                <Form.Item label="企业法定名称" required>
                  <Input v-model:value="createForm.organizationLegalName" placeholder="例如 Alpha Inc." />
                </Form.Item>
              </Col>
              <Col :md="12" :span="24">
                <Form.Item label="注册国家/地区" required>
                  <CountryRegionSelect
                    :value="createForm.registeredCountry"
                    data-testid="tenant-country-select"
                    placeholder="选择国家/地区"
                    @update:value="handleRegisteredCountryChange"
                  />
                </Form.Item>
              </Col>
              <Col :md="12" :span="24">
                <Form.Item label="企业唯一识别码类型" required>
                  <Select
                    v-model:value="createForm.organizationIdentifierType"
                    :options="identifierTypeOptions"
                  />
                </Form.Item>
              </Col>
              <Col :md="12" :span="24">
                <Form.Item label="企业唯一识别码" required>
                  <Input
                    v-model:value="createForm.organizationIdentifierRawValue"
                    :placeholder="organizationIdentifierPlaceholder"
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>

          <Form v-else layout="vertical" class="tenant-management__onboarding-form">
            <div class="tenant-management__admin-panel">
              <Form.Item class="tenant-management__admin-mode" label="首管理员来源" required>
                <Radio.Group
                  v-model:value="createForm.adminMode"
                  button-style="solid"
                  class="tenant-management__admin-mode-group"
                  option-type="button"
                >
                  <Radio value="CREATE_NEW_USER">创建新用户</Radio>
                  <Radio value="EXISTING_USER">选择已有用户</Radio>
                </Radio.Group>
              </Form.Item>

              <div v-if="createForm.adminMode === 'EXISTING_USER'" class="tenant-management__admin-fields">
                <Form.Item label="已有用户" required>
                  <Select
                    :filter-option="false"
                    :loading="existingAdminSearchLoading"
                    :options="existingAdminOptions"
                    :value="createForm.adminExistingUserId || undefined"
                    allow-clear
                    placeholder="输入邮箱或 +国际手机号搜索"
                    show-search
                    @change="handleExistingAdminChange"
                    @search="searchExistingAdminUsers"
                  />
                </Form.Item>
              </div>

              <Row v-else :gutter="16" class="tenant-management__admin-fields">
                <Col :span="24">
                  <Form.Item label="首管理员姓名" required>
                    <Input v-model:value="createForm.adminDisplayName" placeholder="例如 Alice Admin" />
                  </Form.Item>
                </Col>
                <Col :md="12" :span="24">
                  <Form.Item label="首管理员邮箱">
                    <Input v-model:value="createForm.adminEmail" placeholder="例如 alice@example.com" />
                  </Form.Item>
                </Col>
                <Col :md="12" :span="24">
                  <Form.Item label="首管理员手机">
                    <PhoneNumberInput
                      v-model="createForm.adminPhone"
                      class="tenant-management__phone-input"
                      placeholder="请输入手机号"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </div>
          </Form>
        </div>

        <div v-if="onboardingResult?.failure?.message" class="tenant-management__onboarding-result">
          <Tag color="orange">
            {{ onboardingResult.status }}
          </Tag>
          <p class="tenant-management__onboarding-failure">
            {{ onboardingResult.failure.failedStep }} · {{ onboardingResult.failure.message }}
          </p>
        </div>

        <template #footer>
          <Space>
            <Button @click="createOpen = false">取消</Button>
            <Button v-if="createStep === 1" @click="createStep = 0">上一步</Button>
            <Button
              v-if="createStep === 0"
              data-testid="tenant-create-next"
              type="primary"
              :disabled="!canProceedTenantStep"
              @click="createStep = 1"
            >
              下一步
            </Button>
            <Button
              v-else
              data-testid="tenant-create-submit"
              type="primary"
              :disabled="!canSubmitOnboarding"
              :loading="createSaving"
              @click="submitCreateTenant"
            >
              开通
            </Button>
          </Space>
        </template>
      </Modal>

      <Drawer
        v-model:open="detailOpen"
        :title="detailTitle"
        :get-container="false"
        :width="520"
      >
        <div v-if="detailLoading" class="tenant-management__drawer-loading">加载中...</div>

        <div v-else class="tenant-management__drawer">
          <Card size="small" title="基础元数据">
            <dl class="tenant-management__meta-list">
              <div>
                <dt>Tenant ID</dt>
                <dd>{{ detailForm.id || '-' }}</dd>
              </div>
              <div>
                <dt>状态</dt>
                <dd>
                  <Tag :color="statusColor(detailForm.status)">
                    {{ statusLabel(detailForm.status || 'SUSPENDED') }}
                  </Tag>
                </dd>
              </div>
              <div>
                <dt>Root Org 名称</dt>
                <dd>{{ detailForm.rootOrgName || '-' }}</dd>
              </div>
              <div>
                <dt>用户数</dt>
                <dd>{{ detailForm.userCount ?? '-' }}</dd>
              </div>
            </dl>
          </Card>

          <Card size="small" title="基础信息维护">
            <Form layout="vertical">
              <Form.Item label="Tenant 名称">
                <Input v-model:value="detailForm.name" placeholder="输入租户名称" />
              </Form.Item>
              <Form.Item label="Tenant 编码">
                <Input v-model:value="detailForm.code" placeholder="输入租户编码" />
              </Form.Item>
            </Form>
          </Card>
        </div>

        <template #footer>
          <Space>
            <Button @click="detailOpen = false">关闭</Button>
            <Button
              v-access:code="'tenant_org.tenant.update_profile'"
              v-if="canUpdateTenantProfile"
              data-testid="tenant-detail-save"
              type="primary"
              :loading="detailSaving"
              @click="submitTenantProfile"
            >
              保存基础信息
            </Button>
          </Space>
        </template>
      </Drawer>
    </div>
  </Page>
</template>

<style scoped>
.tenant-management {
  --tenant-management-border: hsl(var(--border) / 0.9);
  --tenant-management-muted: hsl(var(--muted-foreground));
  --tenant-management-soft: hsl(var(--muted) / 0.42);
  --tenant-management-text: hsl(var(--foreground) / 0.92);
}

.tenant-management__workspace :deep(.ant-card-body) {
  background: hsl(var(--card));
  display: grid;
  gap: 14px;
  padding: 18px;
}

.tenant-management__workbench-head {
  align-items: center;
  display: flex;
  gap: 12px;
  justify-content: space-between;
}

.tenant-management__title-block {
  display: grid;
  min-width: 0;
}

.tenant-management__title-block h2 {
  color: var(--tenant-management-text);
  font-size: 18px;
  font-weight: 650;
  line-height: 1.25;
  margin: 0;
}

.tenant-management__head-actions {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-end;
}

.tenant-management__total {
  color: var(--tenant-management-muted);
  font-size: 13px;
  white-space: nowrap;
}

.tenant-management__toolbar {
  align-items: end;
  background: var(--tenant-management-soft);
  border: 1px solid var(--tenant-management-border);
  border-radius: 8px;
  display: grid;
  gap: 12px;
  grid-template-columns: minmax(0, 1fr) auto;
  padding: 10px;
}

.tenant-management__filter-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: minmax(220px, 1fr) minmax(150px, 210px);
}

.tenant-management__toolbar :deep(.ant-form-item) {
  margin-bottom: 0;
}

.tenant-management__filter-buttons {
  display: grid;
  grid-template-columns: repeat(2, minmax(76px, 1fr));
  gap: 8px;
}

.tenant-management__filter-control,
.tenant-management__filter-button {
  min-width: 0;
  width: 100%;
}

:deep(.tenant-management__workspace .ant-input),
:deep(.tenant-management__workspace .ant-input-affix-wrapper),
:deep(.tenant-management__workspace .ant-select-selector) {
  min-height: 36px;
  border-radius: 8px;
}

:deep(.tenant-management__workspace .ant-select-selector) {
  align-items: center;
  display: flex;
}

:deep(.tenant-management__workspace .ant-btn) {
  align-items: center;
  display: inline-flex;
  gap: 6px;
  height: 36px;
  border-radius: 8px;
}

.tenant-management__table-wrap {
  border-top: 1px solid var(--tenant-management-border);
  padding-top: 4px;
}

.tenant-management__table-wrap :deep(.ant-table-wrapper) {
  margin-top: 0;
}

.tenant-management__table-wrap :deep(.ant-table-thead > tr > th) {
  background: transparent;
  color: var(--tenant-management-muted);
  font-size: 12px;
  font-weight: 600;
}

.tenant-management__table-wrap :deep(.ant-table-tbody > tr > td) {
  color: var(--tenant-management-text);
}

.tenant-management__drawer {
  display: grid;
  gap: 16px;
}

.tenant-management__onboarding {
  display: grid;
  gap: 22px;
  padding-top: 4px;
}

.tenant-management__onboarding-steps {
  max-width: 440px;
}

.tenant-management__onboarding-form {
  border-top: 1px solid #edf0f5;
  padding-top: 18px;
}

.tenant-management__onboarding-form :deep(.ant-form-item) {
  margin-bottom: 16px;
}

.tenant-management__onboarding-form :deep(.ant-input),
.tenant-management__onboarding-form :deep(.ant-select-selector) {
  min-height: 38px;
  border-radius: 8px;
}

.tenant-management__onboarding-form :deep(.ant-select-selector) {
  align-items: center;
  display: flex;
}

.tenant-management__admin-panel {
  background: hsl(var(--muted) / 0.24);
  border: 1px solid hsl(var(--border) / 0.88);
  border-radius: 8px;
  display: grid;
  gap: 14px;
  padding: 16px;
}

.tenant-management__admin-mode {
  margin-bottom: 0 !important;
}

.tenant-management__admin-mode-group {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  width: 100%;
}

.tenant-management__admin-mode-group :deep(.ant-radio-button-wrapper) {
  align-items: center;
  display: inline-flex;
  justify-content: center;
  min-height: 38px;
  overflow: hidden;
  text-align: center;
  white-space: normal;
}

.tenant-management__admin-fields {
  border-top: 1px solid hsl(var(--border) / 0.82);
  padding-top: 14px;
}

.tenant-management__phone-input {
  min-height: 38px;
}

.tenant-management__phone-input :deep(.phone-number-input) {
  border-radius: 8px;
  min-height: 38px;
}

.tenant-management__phone-input :deep(.phone-country-select .ant-select-selector),
.tenant-management__phone-input :deep(.phone-local-input.ant-input) {
  min-height: 36px;
}

.tenant-management__onboarding-result {
  border-top: 1px solid #edf0f5;
  display: grid;
  gap: 12px;
  margin-top: 8px;
  padding-top: 16px;
}

.tenant-management__onboarding-failure {
  color: var(--tenant-management-muted);
  line-height: 1.6;
  margin: 0;
}

.tenant-management__drawer-loading {
  color: #58627a;
}

.tenant-management__meta-list {
  display: grid;
  gap: 12px;
  margin: 0;
}

.tenant-management__meta-list div {
  display: grid;
  gap: 4px;
}

.tenant-management__meta-list dt {
  color: #58627a;
  font-size: 12px;
}

.tenant-management__meta-list dd {
  color: #172033;
  font-size: 14px;
  margin: 0;
}

@media (max-width: 768px) {
  .tenant-management__admin-mode-group {
    grid-template-columns: 1fr;
  }

  .tenant-management__admin-mode-group :deep(.ant-radio-button-wrapper) {
    border-left-width: 1px;
  }

  .tenant-management__workbench-head,
  .tenant-management__toolbar {
    align-items: stretch;
    grid-template-columns: 1fr;
  }

  .tenant-management__workbench-head {
    flex-direction: column;
  }

  .tenant-management__head-actions {
    justify-content: flex-start;
  }

  .tenant-management__filter-grid,
  .tenant-management__filter-buttons {
    grid-template-columns: 1fr;
  }
}
</style>
