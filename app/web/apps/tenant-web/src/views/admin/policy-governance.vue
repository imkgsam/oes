<script lang="ts" setup>
import type { PolicyGovernanceApi } from '#/api';
import type { TableColumnsType } from 'ant-design-vue';

import { computed, h, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  Drawer,
  Empty,
  Form,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
  message,
} from 'ant-design-vue';

import {
  getAdminTenantMfaPolicyApi,
  getPolicyByIdApi,
  listPermissionPoliciesApi,
  listPoliciesApi,
  updateAdminTenantMfaPolicyApi,
} from '#/api';
import { useAuthContextStore } from '#/store/auth-context';
import {
  buildPolicyTablePagination,
  formatPolicyConditionAst,
  getPolicyEffectPresentation,
  getPolicySubjectTypeLabel,
} from './policy-governance.helpers';

interface PolicyFilterState {
  isEnabled: '' | 'false' | 'true';
  keyword: string;
  permissionCode: string;
  tenantId: string;
}

interface SelectOption {
  label: string;
  value: string;
}

const authContextStore = useAuthContextStore();

const filters = reactive<PolicyFilterState>({
  isEnabled: '',
  keyword: '',
  permissionCode: '',
  tenantId: '',
});
const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
});

const loading = ref(false);
const detailLoading = ref(false);
const tenantMfaLoading = ref(false);
const tenantMfaSaving = ref(false);
const policies = ref<PolicyGovernanceApi.Policy[]>([]);
const selectedPolicy = ref<null | PolicyGovernanceApi.Policy>(null);
const linkedPolicies = ref<PolicyGovernanceApi.Policy[]>([]);
const detailDrawerOpen = ref(false);
const loadError = ref('');
const tenantMfaPolicy = ref<null | {
  factors: Array<{
    enabled: boolean;
    factor: 'BACKUP_CODE' | 'EMAIL_OTP' | 'SMS_OTP' | 'TOTP';
    priority: number;
  }>;
  loginRequired: boolean;
  tenantId: string;
}>(null);

const statusOptions: SelectOption[] = [
  { label: '全部状态', value: '' },
  { label: '启用', value: 'true' },
  { label: '停用', value: 'false' },
];

const canViewPolicy = computed(() =>
  authContextStore.actionCodes.includes('permission.policy.list'),
);
const canManageLoginMfa = computed(() =>
  authContextStore.actionCodes.includes('auth.account_login_methods.manage'),
);
const hasTenantContext = computed(
  () => authContextStore.sessionContext?.scopeLevel === 'TENANT',
);
const formattedConditionAst = computed(() =>
  formatPolicyConditionAst(selectedPolicy.value?.conditionAstJson),
);
const tablePagination = computed(() =>
  buildPolicyTablePagination({
    current: pagination.current,
    pageSize: pagination.pageSize,
    total: pagination.total,
  }),
);

const orderedTenantMfaFactors = computed(() =>
  [...(tenantMfaPolicy.value?.factors ?? [])].sort(
    (left, right) => left.priority - right.priority,
  ),
);

const policyColumns = computed<TableColumnsType>(() => [
  {
    dataIndex: 'name',
    title: '策略名称',
    customRender: ({ record }) => {
      const policy = record as PolicyGovernanceApi.Policy;
      const name = policy.name?.trim() || '-';
      const description = policy.description?.trim();

      return h(
        Space,
        { direction: 'vertical', size: 2 },
        () => [
          h(
            Tooltip,
            { title: name },
            {
              default: () =>
                h('span', { class: 'policy-governance__truncate' }, name),
            },
          ),
          description
            ? h(
                Tooltip,
                { title: description },
                {
                  default: () =>
                    h(
                      'span',
                      { class: 'policy-governance__meta policy-governance__truncate' },
                      description,
                    ),
                },
              )
            : null,
        ],
      );
    },
  },
  {
    dataIndex: 'effect',
    title: 'Effect',
    width: 100,
    customRender: ({ record }) => {
      const presentation = getPolicyEffectPresentation(
        (record as PolicyGovernanceApi.Policy).effect,
      );

      return h(
        Tag,
        { color: presentation.color },
        () => presentation.label,
      );
    },
  },
  {
    dataIndex: 'subjectType',
    title: '主体',
    width: 120,
    customRender: ({ record }) =>
      getPolicySubjectTypeLabel(
        (record as PolicyGovernanceApi.Policy).subjectType,
      ),
  },
  {
    dataIndex: 'permissionCode',
    title: '权限码',
    customRender: ({ record }) => {
      const permissionCode =
        (record as PolicyGovernanceApi.Policy).permissionCode?.trim() || '-';

      return h(
        Tooltip,
        { title: permissionCode },
        {
          default: () =>
            h('span', { class: 'policy-governance__truncate' }, permissionCode),
        },
      );
    },
  },
  {
    dataIndex: 'tenantId',
    title: '租户',
    width: 120,
    customRender: ({ record }) =>
      (record as PolicyGovernanceApi.Policy).tenantId || 'GLOBAL',
  },
  {
    dataIndex: 'isEnabled',
    title: '状态',
    width: 90,
    customRender: ({ record }) =>
      h(
        Tag,
        {
          color: (record as PolicyGovernanceApi.Policy).isEnabled ? 'green' : 'default',
        },
        () => ((record as PolicyGovernanceApi.Policy).isEnabled ? '启用' : '停用'),
      ),
  },
  {
    dataIndex: 'priority',
    title: '优先级',
    width: 90,
    customRender: ({ record }) =>
      `${(record as PolicyGovernanceApi.Policy).priority ?? '-'}`,
  },
  {
    key: 'actions',
    title: '操作',
    width: 120,
    customRender: ({ record }) =>
      h(
        Button,
        {
          size: 'small',
          type: 'link',
          onClick: () => openPolicyDetail((record as PolicyGovernanceApi.Policy)),
        },
        () => '查看详情',
      ),
  },
]);

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

// Normalizes one readonly filter snapshot into the gateway query shape.
function buildQuery(page = 1) {
  return {
    isEnabled:
      filters.isEnabled === '' ? undefined : filters.isEnabled === 'true',
    keyword: filters.keyword.trim() || undefined,
    page,
    pageSize: pagination.pageSize,
    permissionCode: filters.permissionCode.trim() || undefined,
    tenantId: filters.tenantId.trim() || undefined,
  };
}

function getTenantMfaFactorLabel(
  factor: 'BACKUP_CODE' | 'EMAIL_OTP' | 'SMS_OTP' | 'TOTP',
) {
  switch (factor) {
    case 'EMAIL_OTP':
      return '邮箱 OTP';
    case 'SMS_OTP':
      return '手机 OTP';
    case 'BACKUP_CODE':
      return '恢复码';
    case 'TOTP':
    default:
      return '认证器';
  }
}

// Loads one readonly policy page for the current governance filters.
async function loadPolicies(page = pagination.current) {
  if (!canViewPolicy.value) {
    policies.value = [];
    pagination.total = 0;
    loadError.value = '当前账号没有策略治理查看权限。';
    return;
  }

  loading.value = true;
  loadError.value = '';

  try {
    const result = await listPoliciesApi(buildQuery(page));

    policies.value = result.policies ?? [];
    pagination.current = result.page || page;
    pagination.pageSize = result.pageSize || pagination.pageSize;
    pagination.total = result.total || 0;
  } catch (error) {
    policies.value = [];
    pagination.total = 0;
    loadError.value = getErrorMessage(error, '加载策略列表失败，请稍后重试');
  } finally {
    loading.value = false;
  }
}

async function loadTenantMfaPolicy() {
  if (!hasTenantContext.value || !canManageLoginMfa.value) {
    tenantMfaPolicy.value = null;
    return;
  }

  tenantMfaLoading.value = true;

  try {
    tenantMfaPolicy.value = await getAdminTenantMfaPolicyApi();
  } catch (error) {
    tenantMfaPolicy.value = null;
    message.error(getErrorMessage(error, '加载登录 MFA 策略失败'));
  } finally {
    tenantMfaLoading.value = false;
  }
}

function moveTenantMfaFactor(index: number, direction: -1 | 1) {
  if (!tenantMfaPolicy.value) {
    return;
  }

  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= tenantMfaPolicy.value.factors.length) {
    return;
  }

  const ordered = [...orderedTenantMfaFactors.value];
  const [current] = ordered.splice(index, 1);
  if (!current) {
    return;
  }
  ordered.splice(nextIndex, 0, current);
  tenantMfaPolicy.value.factors = ordered.map((factor, currentIndex) => ({
    ...factor,
    priority: currentIndex + 1,
  }));
}

async function saveTenantMfaPolicy() {
  if (!tenantMfaPolicy.value) {
    return;
  }

  tenantMfaSaving.value = true;

  try {
    tenantMfaPolicy.value = await updateAdminTenantMfaPolicyApi({
      loginRequired: tenantMfaPolicy.value.loginRequired,
      factors: orderedTenantMfaFactors.value.map((factor, index) => ({
        ...factor,
        priority: index + 1,
      })),
    });
    message.success('登录 MFA 策略已更新');
  } catch (error) {
    message.error(getErrorMessage(error, '保存登录 MFA 策略失败'));
  } finally {
    tenantMfaSaving.value = false;
  }
}

// Applies the current filters and reloads the first readonly policy page.
async function searchPolicies() {
  pagination.current = 1;
  await loadPolicies(1);
}

// Clears current filters and reloads the first readonly policy page.
async function resetFilters() {
  filters.isEnabled = '';
  filters.keyword = '';
  filters.permissionCode = '';
  filters.tenantId = '';
  await searchPolicies();
}

// Keeps table pagination state aligned with Ant Design table changes.
async function handleTableChange(pager: { current?: number; pageSize?: number }) {
  pagination.current = pager.current ?? 1;
  pagination.pageSize = pager.pageSize ?? pagination.pageSize;
  await loadPolicies(pagination.current);
}

// Loads one readonly policy detail record and its linked permission policies for the selected row.
async function openPolicyDetail(policy: PolicyGovernanceApi.Policy) {
  detailDrawerOpen.value = true;
  detailLoading.value = true;

  try {
    const [detail, linked] = await Promise.all([
      getPolicyByIdApi(policy.id),
      policy.permissionCode
        ? listPermissionPoliciesApi(policy.permissionCode, {
            tenantId: filters.tenantId.trim() || undefined,
          })
        : Promise.resolve({ policies: [] }),
    ]);

    selectedPolicy.value = detail;
    linkedPolicies.value = linked.policies ?? [];
  } catch (error) {
    selectedPolicy.value = null;
    linkedPolicies.value = [];
    message.error(getErrorMessage(error, '加载策略详情失败'));
  } finally {
    detailLoading.value = false;
  }
}

onMounted(() => {
  void loadPolicies(1);
  void loadTenantMfaPolicy();
});
</script>

<template>
  <Page auto-content-height title="策略治理">
    <div class="policy-governance-page">
      <Card
        v-if="hasTenantContext && canManageLoginMfa"
        :bordered="false"
        class="policy-governance__panel policy-governance__mfa-panel"
      >
        <div class="policy-governance__header">
          <div class="policy-governance__title-row">
            <div class="policy-governance__section-title policy-governance__section-title--primary">
              登录 MFA 策略
            </div>
            <Tooltip title="控制租户账号在账号选择之后，是否需要二次验证，以及默认优先使用哪种 MFA 方式。">
              <span class="policy-governance__help-dot">?</span>
            </Tooltip>
          </div>
          <Button
            :loading="tenantMfaSaving"
            size="small"
            type="primary"
            @click="saveTenantMfaPolicy"
          >
            保存策略
          </Button>
        </div>

        <div v-if="tenantMfaLoading" class="policy-governance__empty">
          正在加载登录 MFA 策略...
        </div>

        <div v-else-if="tenantMfaPolicy" class="space-y-4">
          <div class="policy-governance__mfa-toggle">
            <div>
              <div class="policy-governance__mfa-title">登录时要求二次验证</div>
              <div class="policy-governance__mfa-meta">
                开启后，用户完成主认证并选择账号后，还需要完成一项 MFA 验证才能进入租户工作台。
              </div>
            </div>
            <Switch v-model:checked="tenantMfaPolicy.loginRequired" />
          </div>

          <div class="space-y-2">
            <div class="policy-governance__mfa-title">因子优先级</div>
            <div
              v-for="(factor, index) in orderedTenantMfaFactors"
              :key="factor.factor"
              class="policy-governance__mfa-row"
            >
              <div class="policy-governance__mfa-order">{{ factor.priority }}</div>
              <div class="min-w-0 flex-1">
                <div class="text-sm font-medium text-foreground">
                  {{ getTenantMfaFactorLabel(factor.factor) }}
                </div>
              </div>
              <Switch v-model:checked="factor.enabled" />
              <Space size="small">
                <Button
                  :disabled="index === 0"
                  size="small"
                  @click="moveTenantMfaFactor(index, -1)"
                >
                  上移
                </Button>
                <Button
                  :disabled="index === orderedTenantMfaFactors.length - 1"
                  size="small"
                  @click="moveTenantMfaFactor(index, 1)"
                >
                  下移
                </Button>
              </Space>
            </div>
          </div>
        </div>
      </Card>

      <Card :bordered="false" class="policy-governance__panel">
        <div class="policy-governance__header">
          <div class="policy-governance__title-row">
            <div class="policy-governance__section-title policy-governance__section-title--primary">
              策略治理
            </div>
            <Tooltip title="只读查看策略事实、主体约束与条件 AST，不在此页面执行修改。">
              <span class="policy-governance__help-dot">?</span>
            </Tooltip>
          </div>
        </div>

        <Card :bordered="false" class="policy-governance__filters-card">
          <Form layout="vertical">
            <div class="policy-governance__filter-grid">
              <Form.Item label="关键字">
                <input
                  v-model="filters.keyword"
                  aria-label="策略关键字"
                  class="policy-governance__native-input"
                  @input="filters.keyword = (($event.target as HTMLInputElement | null)?.value ?? '')"
                  placeholder="按策略名称或描述搜索"
                />
              </Form.Item>
              <Form.Item label="权限码">
                <input
                  v-model="filters.permissionCode"
                  aria-label="权限码过滤"
                  class="policy-governance__native-input"
                  @input="filters.permissionCode = (($event.target as HTMLInputElement | null)?.value ?? '')"
                  placeholder="permission.role.update"
                />
              </Form.Item>
              <Form.Item label="租户">
                <input
                  v-model="filters.tenantId"
                  aria-label="租户过滤"
                  class="policy-governance__native-input"
                  @input="filters.tenantId = (($event.target as HTMLInputElement | null)?.value ?? '')"
                  placeholder="tenant-1"
                />
              </Form.Item>
              <Form.Item label="状态">
                <div class="policy-governance__status-select">
                  <select
                    v-model="filters.isEnabled"
                    aria-label="状态过滤"
                    class="policy-governance__native-select"
                    @change="filters.isEnabled = (($event.target as HTMLSelectElement | null)?.value ?? '') as '' | 'false' | 'true'"
                  >
                    <option
                      v-for="option in statusOptions"
                      :key="option.value"
                      :value="option.value"
                    >
                      {{ option.label }}
                    </option>
                  </select>
                </div>
              </Form.Item>
            </div>
          </Form>

          <div class="policy-governance__filter-actions">
            <Space>
              <Button class="policy-governance__search-button" type="primary" @click="searchPolicies">
                查询
              </Button>
              <Button class="policy-governance__reset-button" @click="resetFilters">
                重置
              </Button>
            </Space>
          </div>
        </Card>

        <Card :bordered="false" class="policy-governance__table-card">
          <div class="policy-governance__pane-header">
            <div class="policy-governance__section-title">策略目录</div>
            <div class="policy-governance__meta">
              共 {{ pagination.total }} 条
            </div>
          </div>

          <p v-if="loadError" class="policy-governance__error">
            {{ loadError }}
          </p>

          <Table
            row-key="id"
            :columns="policyColumns"
            :data-source="policies"
            :loading="loading"
            :pagination="tablePagination"
            @change="handleTableChange"
          >
            <template #emptyText>
              <Empty description="暂无策略数据" />
            </template>
          </Table>
        </Card>
      </Card>

      <Drawer
        v-model:open="detailDrawerOpen"
        destroy-on-close
        placement="right"
        title="策略详情"
        width="560"
      >
        <div v-if="detailLoading" class="policy-governance__drawer-state">
          正在加载策略详情...
        </div>

        <div v-else-if="!selectedPolicy" class="policy-governance__drawer-state">
          请选择一条策略查看详情
        </div>

        <div v-else class="policy-governance__drawer-content">
          <div class="policy-governance__detail-grid">
            <div class="policy-governance__detail-item">
              <span class="policy-governance__detail-label">策略名称</span>
              <Tooltip :title="selectedPolicy.name">
                <span class="policy-governance__truncate">
                  {{ selectedPolicy.name }}
                </span>
              </Tooltip>
            </div>
            <div class="policy-governance__detail-item">
              <span class="policy-governance__detail-label">Effect</span>
              <Tag :color="getPolicyEffectPresentation(selectedPolicy.effect).color">
                {{ getPolicyEffectPresentation(selectedPolicy.effect).label }}
              </Tag>
            </div>
            <div class="policy-governance__detail-item">
              <span class="policy-governance__detail-label">主体类型</span>
              <Tooltip title="策略命中的主体类型，用于区分角色、账号或任意主体。">
                <span>{{ getPolicySubjectTypeLabel(selectedPolicy.subjectType) }}</span>
              </Tooltip>
            </div>
            <div class="policy-governance__detail-item">
              <span class="policy-governance__detail-label">主体标识</span>
              <Tooltip :title="selectedPolicy.subjectId || '-'">
                <span class="policy-governance__truncate">
                  {{ selectedPolicy.subjectId || '-' }}
                </span>
              </Tooltip>
            </div>
            <div class="policy-governance__detail-item">
              <span class="policy-governance__detail-label">权限码</span>
              <Tooltip :title="selectedPolicy.permissionCode || '-'">
                <span class="policy-governance__truncate">
                  {{ selectedPolicy.permissionCode || '-' }}
                </span>
              </Tooltip>
            </div>
            <div class="policy-governance__detail-item">
              <span class="policy-governance__detail-label">资源类型</span>
              <Tooltip title="资源类型用于限定策略命中的资源类别，不代表业务聚合生命周期。">
                <span class="policy-governance__truncate">
                  {{ selectedPolicy.resourceType || '-' }}
                </span>
              </Tooltip>
            </div>
            <div class="policy-governance__detail-item">
              <span class="policy-governance__detail-label">租户</span>
              <span>{{ selectedPolicy.tenantId || 'GLOBAL' }}</span>
            </div>
            <div class="policy-governance__detail-item">
              <span class="policy-governance__detail-label">优先级</span>
              <span>{{ selectedPolicy.priority ?? '-' }}</span>
            </div>
            <div class="policy-governance__detail-item">
              <span class="policy-governance__detail-label">状态</span>
              <Tag :color="selectedPolicy.isEnabled ? 'green' : 'default'">
                {{ selectedPolicy.isEnabled ? '启用' : '停用' }}
              </Tag>
            </div>
            <div class="policy-governance__detail-item policy-governance__detail-item--full">
              <span class="policy-governance__detail-label">描述</span>
              <Tooltip :title="selectedPolicy.description || '-'">
                <span>{{ selectedPolicy.description || '-' }}</span>
              </Tooltip>
            </div>
          </div>

          <div class="policy-governance__detail-section">
            <div class="policy-governance__section-title">conditionAstJson</div>
            <Tooltip title="这是后端持久化的条件 AST，只读展示，不在此页面编辑。">
              <pre class="policy-governance__code-block">
{{ formattedConditionAst || '-' }}
              </pre>
            </Tooltip>
          </div>

          <div class="policy-governance__detail-section">
            <div class="policy-governance__section-title">同权限策略</div>
            <ul v-if="linkedPolicies.length" class="policy-governance__linked-list">
              <li v-for="policy in linkedPolicies" :key="policy.id">
                {{ policy.name }}
              </li>
            </ul>
            <Empty v-else description="当前权限码下没有更多关联策略" />
          </div>
        </div>
      </Drawer>
    </div>
  </Page>
</template>

<style scoped>
.policy-governance-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  --policy-border: hsl(var(--border));
  --policy-card-bg: hsl(var(--card));
  --policy-card-bg-soft: hsl(var(--muted) / 0.55);
  --policy-card-bg-strong: hsl(var(--muted) / 0.82);
  --policy-title: hsl(var(--foreground));
  --policy-text: hsl(var(--foreground) / 0.92);
  --policy-muted: hsl(var(--muted-foreground));
  --policy-danger: hsl(var(--destructive));
}

.policy-governance__panel :deep(.ant-card-body) {
  display: grid;
  gap: 16px;
  padding: 16px;
  background: var(--policy-card-bg);
}

.policy-governance__header,
.policy-governance__title-row,
.policy-governance__pane-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.policy-governance__section-title {
  color: var(--policy-title);
  font-size: 16px;
  font-weight: 600;
}

.policy-governance__section-title--primary {
  font-size: 18px;
}

.policy-governance__help-dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 999px;
  border: 1px solid var(--policy-border);
  background: var(--policy-card-bg-strong);
  color: var(--policy-muted);
  font-size: 12px;
  font-weight: 700;
  cursor: help;
}

.policy-governance__filters-card :deep(.ant-card-body),
.policy-governance__table-card :deep(.ant-card-body) {
  display: grid;
  gap: 16px;
  padding: 16px;
  background: var(--policy-card-bg);
}

.policy-governance__filter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.policy-governance__filter-actions {
  display: flex;
  justify-content: flex-end;
}

.policy-governance__status-select {
  width: 100%;
}

.policy-governance__native-select {
  width: 100%;
  min-height: 32px;
  padding: 4px 11px;
  border: 1px solid hsl(var(--input));
  border-radius: 6px;
  background: hsl(var(--input-background));
  color: var(--policy-text);
}

.policy-governance__native-input {
  width: 100%;
  min-height: 32px;
  padding: 4px 11px;
  border: 1px solid hsl(var(--input));
  border-radius: 6px;
  background: hsl(var(--input-background));
  color: var(--policy-text);
}

.policy-governance__meta,
.policy-governance__error {
  color: var(--policy-muted);
  font-size: 13px;
}

.policy-governance__error {
  color: var(--policy-danger);
}

.policy-governance__truncate {
  display: inline-block;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: bottom;
  white-space: nowrap;
}

.policy-governance__drawer-state {
  color: var(--policy-muted);
  font-size: 14px;
}

.policy-governance__drawer-content {
  display: grid;
  gap: 20px;
}

.policy-governance__detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 16px;
}

.policy-governance__detail-item {
  display: grid;
  gap: 6px;
}

.policy-governance__detail-item--full {
  grid-column: 1 / -1;
}

.policy-governance__detail-label {
  color: var(--policy-muted);
  font-size: 12px;
}

.policy-governance__detail-section {
  display: grid;
  gap: 10px;
}

.policy-governance__code-block {
  overflow: auto;
  margin: 0;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid var(--policy-border);
  background: hsl(var(--popover));
  color: var(--policy-text);
  font-size: 12px;
  line-height: 1.5;
}

.policy-governance__linked-list {
  margin: 0;
  padding-left: 18px;
}

.policy-governance__mfa-panel {
  margin-bottom: 16px;
}

.policy-governance__mfa-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px;
  border: 1px solid var(--policy-border);
  border-radius: 14px;
  background: var(--policy-card-bg-strong);
}

.policy-governance__mfa-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--policy-text);
}

.policy-governance__mfa-meta {
  margin-top: 4px;
  font-size: 12px;
  color: var(--policy-muted);
  line-height: 1.5;
}

.policy-governance__mfa-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid var(--policy-border);
  border-radius: 14px;
  background: var(--policy-card-bg-strong);
}

.policy-governance__mfa-order {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 999px;
  background: hsl(var(--accent));
  color: var(--policy-text);
  font-size: 13px;
  font-weight: 700;
}

:deep(.policy-governance__table-card .ant-table),
:deep(.policy-governance__table-card .ant-table-container) {
  background: transparent;
}

:deep(.policy-governance__table-card .ant-table-thead > tr > th) {
  background: var(--policy-card-bg-strong);
  color: var(--policy-text);
}

@media (max-width: 768px) {
  .policy-governance__filter-actions {
    justify-content: flex-start;
  }

  .policy-governance__detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
