<script setup lang="ts">
import type { TenantManagementApi } from '#/api';
import type { TableColumnsType } from 'ant-design-vue';

import { computed, h, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  Drawer,
  Empty,
  Form,
  Input,
  Modal,
  Row,
  Col,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  message,
} from 'ant-design-vue';

import {
  getManagedTenantByIdApi,
  listManagedTenantsApi,
  startTenantOnboardingApi,
  updateManagedTenantProfileApi,
  updateManagedTenantStatusApi,
} from '#/api';
import { useAuthContextStore } from '#/store/auth-context';

interface TenantFilterState {
  keyword: string;
  status: '' | 'ACTIVE' | 'ARCHIVED' | 'SUSPENDED';
}

interface TenantCreateFormState {
  adminDisplayName: string;
  adminEmail: string;
  adminPhone: string;
  code: string;
  idempotencyKey: string;
  name: string;
  organizationLegalName: string;
  registeredCountry: string;
  requirePasswordSetup: boolean;
  rootOrgName: string;
}

interface TenantDetailFormState {
  code: string;
  id: string;
  name: string;
  rootOrgId: string;
  rootOrgName: string;
  status: string;
}

const authContextStore = useAuthContextStore();
const statusOptions: Array<{ label: string; value: string }> = [
  { label: '全部状态', value: '' },
  { label: '启用', value: 'ACTIVE' },
  { label: '停用', value: 'SUSPENDED' },
  { label: '归档', value: 'ARCHIVED' },
];

const filters = reactive<TenantFilterState>({
  keyword: '',
  status: '',
});
const createForm = reactive<TenantCreateFormState>({
  adminDisplayName: '',
  adminEmail: '',
  adminPhone: '',
  code: '',
  idempotencyKey: '',
  name: '',
  organizationLegalName: '',
  registeredCountry: '',
  requirePasswordSetup: true,
  rootOrgName: '',
});
const detailForm = reactive<TenantDetailFormState>({
  code: '',
  id: '',
  name: '',
  rootOrgId: '',
  rootOrgName: '',
  status: '',
});

const tenants = ref<TenantManagementApi.TenantSummary[]>([]);
const loading = ref(false);
const createOpen = ref(false);
const createSaving = ref(false);
const onboardingResult = ref<TenantManagementApi.TenantOnboardingResult | null>(null);
const detailOpen = ref(false);
const detailLoading = ref(false);
const detailSaving = ref(false);
const selectedTenantId = ref('');
const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
});

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
    dataIndex: 'rootOrgId',
    title: 'Root Org',
    customRender: ({ record }) => record.rootOrgId || '-',
  },
  {
    key: 'actions',
    title: '操作',
    customRender: ({ record }) =>
      h(
        Space,
        {},
        () => [
          canReadTenant.value
            ? h(
                Button,
                {
                  'data-testid': `tenant-detail-button-${record.id}`,
                  size: 'small',
                  type: 'link',
                  onClick: () => openTenantDetail(record.id),
                },
                () => '查看',
              )
            : null,
          canUpdateTenantStatus.value && record.status === 'ACTIVE'
            ? h(
                Button,
                {
                  'data-testid': `tenant-suspend-button-${record.id}`,
                  danger: true,
                  size: 'small',
                  type: 'link',
                  onClick: () => confirmTenantStatus(record.id, 'SUSPENDED'),
                },
                () => '停用',
              )
            : null,
          canUpdateTenantStatus.value && record.status === 'SUSPENDED'
            ? h(
                Button,
                {
                  size: 'small',
                  type: 'link',
                  onClick: () => confirmTenantStatus(record.id, 'ACTIVE'),
                },
                () => '恢复',
              )
            : null,
          canUpdateTenantStatus.value && record.status !== 'ARCHIVED'
            ? h(
                Button,
                {
                  size: 'small',
                  type: 'link',
                  onClick: () => confirmTenantStatus(record.id, 'ARCHIVED'),
                },
                () => '归档',
              )
            : null,
        ].filter(Boolean),
      ),
  },
]);

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
  createForm.adminPhone = '';
  createForm.code = '';
  createForm.idempotencyKey = `tenant-onboarding-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  createForm.name = '';
  createForm.organizationLegalName = '';
  createForm.registeredCountry = '';
  createForm.requirePasswordSetup = true;
  createForm.rootOrgName = '';
  onboardingResult.value = null;
}

/** openCreateModal prepares a fresh tenant draft for system-admin creation. */
function openCreateModal() {
  resetCreateForm();
  createOpen.value = true;
}

/** submitCreateTenant sends one tenant creation request and refreshes the list. */
async function submitCreateTenant() {
  createSaving.value = true;
  try {
    const result = await startTenantOnboardingApi({
      idempotencyKey: createForm.idempotencyKey,
      tenant: {
        code: createForm.code.trim(),
        name: createForm.name.trim(),
      },
      organizationParty: {
        legalName: createForm.organizationLegalName.trim(),
        registeredCountry: createForm.registeredCountry.trim() || undefined,
        identifiers: [],
      },
      rootOrg: {
        name: createForm.rootOrgName.trim() || createForm.name.trim(),
      },
      firstAdmin: {
        displayName: createForm.adminDisplayName.trim(),
        email: createForm.adminEmail.trim() || undefined,
        phone: createForm.adminPhone.trim() || undefined,
        requirePasswordSetup: createForm.requirePasswordSetup,
      },
    });
    onboardingResult.value = result.onboarding ?? null;
    if (result.onboarding?.status === 'SUCCEEDED') {
      message.success('租户开通已完成');
    } else {
      message.error(result.onboarding?.failure?.message || '租户开通未完成');
    }
    await loadTenantList();
  } catch (error) {
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
  detailForm.rootOrgId = tenant.rootOrgId || '';
  detailForm.rootOrgName = tenant.rootOrgName || '';
  detailForm.status = tenant.status;
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
  if (!selectedTenantId.value) {
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

onMounted(async () => {
  await loadTenantList();
});
</script>

<template>
  <Page title="Tenant 创建与基础管理">
    <Card v-if="!isPlatformScope">
      <Empty description="仅系统管理员可访问 Tenant 创建与基础管理入口" />
    </Card>

    <div v-else class="tenant-management">
      <Card :bordered="false" class="tenant-management__hero">
        <div class="tenant-management__hero-copy">
          <h2>Tenant 创建与基础管理</h2>
          <p>
            这里只处理系统管理员视角下的 tenant 列表、创建、基础信息查看与基础维护，不进入组织树、员工、账号或权限细项。
          </p>
        </div>
        <Button
          v-if="canCreateTenant"
          data-testid="tenant-create-open"
          type="primary"
          @click="openCreateModal"
        >
          创建租户
        </Button>
      </Card>

      <Card :bordered="false" class="tenant-management__filters">
        <Row :gutter="16">
          <Col :span="10">
            <Form.Item label="关键词">
              <Input
                v-model:value="filters.keyword"
                placeholder="按租户名称或编码筛选"
                @press-enter="loadTenantList"
              />
            </Form.Item>
          </Col>
          <Col :span="6">
            <Form.Item label="状态">
              <Select
                v-model:value="filters.status"
                :options="statusOptions"
              />
            </Form.Item>
          </Col>
          <Col :span="8" class="tenant-management__filter-actions">
            <Space>
              <Button type="primary" @click="loadTenantList">查询</Button>
              <Button @click="resetFilters">重置</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card :bordered="false" class="tenant-management__table">
        <Table
          :columns="columns"
          :data-source="tenants"
          :loading="loading"
          :pagination="tablePagination"
          :row-key="(record: TenantManagementApi.TenantSummary) => record.id"
          @change="handleTableChange"
        />
      </Card>

      <Modal
        v-model:open="createOpen"
        title="Tenant Onboarding"
        :get-container="false"
        :confirm-loading="createSaving"
        :width="760"
        @ok="submitCreateTenant"
      >
        <Form layout="vertical">
          <Row :gutter="16">
            <Col :span="12">
              <Form.Item label="Tenant 编码">
                <Input v-model:value="createForm.code" placeholder="例如 tenant.alpha" />
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item label="Tenant 名称">
                <Input v-model:value="createForm.name" placeholder="例如 Alpha Tenant" />
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item label="组织法人名称">
                <Input v-model:value="createForm.organizationLegalName" placeholder="例如 Alpha Inc." />
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item label="注册国家/地区">
                <Input v-model:value="createForm.registeredCountry" placeholder="例如 US" />
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item label="Root Org 名称">
                <Input
                  v-model:value="createForm.rootOrgName"
                  placeholder="默认与租户名称一致，可按需覆盖"
                />
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item label="幂等键">
                <Input v-model:value="createForm.idempotencyKey" />
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item label="首管理员姓名">
                <Input v-model:value="createForm.adminDisplayName" placeholder="例如 Alice Admin" />
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item label="首管理员邮箱">
                <Input v-model:value="createForm.adminEmail" placeholder="例如 alice@example.com" />
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item label="首管理员手机">
                <Input v-model:value="createForm.adminPhone" placeholder="例如 +14155550100" />
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item label="要求首次登录设置密码">
                <Switch v-model:checked="createForm.requirePasswordSetup" />
              </Form.Item>
            </Col>
          </Row>
        </Form>

        <div v-if="onboardingResult" class="tenant-management__onboarding-result">
          <Tag :color="onboardingResult.status === 'SUCCEEDED' ? 'green' : 'orange'">
            {{ onboardingResult.status }}
          </Tag>
          <dl class="tenant-management__meta-list">
            <div>
              <dt>Onboarding ID</dt>
              <dd>{{ onboardingResult.onboardingId || '-' }}</dd>
            </div>
            <div>
              <dt>Tenant</dt>
              <dd>{{ onboardingResult.tenant?.id || '-' }}</dd>
            </div>
            <div>
              <dt>Root Org</dt>
              <dd>{{ onboardingResult.rootOrg?.id || '-' }}</dd>
            </div>
            <div>
              <dt>Organization Party</dt>
              <dd>{{ onboardingResult.organizationParty?.partyId || '-' }}</dd>
            </div>
            <div>
              <dt>First Admin Account</dt>
              <dd>{{ onboardingResult.firstAdmin?.accountId || '-' }}</dd>
            </div>
            <div>
              <dt>tenant.admin Grant</dt>
              <dd>{{ onboardingResult.access?.grantId || '-' }}</dd>
            </div>
            <div v-if="onboardingResult.failure?.message">
              <dt>失败步骤</dt>
              <dd>{{ onboardingResult.failure.failedStep }} · {{ onboardingResult.failure.message }}</dd>
            </div>
          </dl>
        </div>

        <template #footer>
          <Space>
            <Button @click="createOpen = false">取消</Button>
            <Button
              data-testid="tenant-create-submit"
              type="primary"
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
                <dt>Root Org ID</dt>
                <dd>{{ detailForm.rootOrgId || '-' }}</dd>
              </div>
              <div>
                <dt>Root Org 名称</dt>
                <dd>{{ detailForm.rootOrgName || '-' }}</dd>
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
  display: grid;
  gap: 16px;
}

.tenant-management__hero :deep(.ant-card-body) {
  align-items: flex-start;
  display: flex;
  justify-content: space-between;
  gap: 24px;
}

.tenant-management__hero-copy h2 {
  color: #172033;
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 8px;
}

.tenant-management__hero-copy p {
  color: #58627a;
  line-height: 1.6;
  margin: 0;
  max-width: 720px;
}

.tenant-management__filters :deep(.ant-form-item) {
  margin-bottom: 0;
}

.tenant-management__filter-actions {
  display: flex;
  justify-content: flex-end;
  align-items: end;
}

.tenant-management__drawer {
  display: grid;
  gap: 16px;
}

.tenant-management__onboarding-result {
  border-top: 1px solid #edf0f5;
  display: grid;
  gap: 12px;
  margin-top: 8px;
  padding-top: 16px;
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
</style>
