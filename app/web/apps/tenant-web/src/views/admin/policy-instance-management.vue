<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';

import {
  createPolicyInstanceApi,
  getPolicyInstanceByIdApi,
  listPolicyInstancesApi,
  setPolicyInstanceEnabledApi,
  type PolicyInstanceManagementApi,
} from '#/api';

const loading = ref(false);
const mutationLoading = ref(false);
const detailLoading = ref(false);
const loadError = ref('');
const policies = ref<PolicyInstanceManagementApi.PolicyInstance[]>([]);
const selectedPolicy = ref<null | PolicyInstanceManagementApi.PolicyInstance>(null);
const pagination = ref({ page: 1, pageSize: 20, total: 0 });
const createDraft = reactive({
  accountId: 'account-1',
  tenantId: 'tenant-1',
  warehouseIds: 'W1, W2',
});

const selectedParamsText = computed(() =>
  selectedPolicy.value ? JSON.stringify(selectedPolicy.value.params ?? {}, null, 2) : '',
);

// loadPolicyInstances reads persisted template-based policy facts from the Gateway readonly endpoint.
async function loadPolicyInstances() {
  loading.value = true;
  loadError.value = '';
  try {
    const result = await listPolicyInstancesApi({
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
    });
    policies.value = result.policyInstances;
    pagination.value = {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
    };
    selectedPolicy.value = result.policyInstances[0] ?? null;
  } catch (error) {
    loadError.value =
      error instanceof Error ? error.message : 'PolicyInstance 列表加载失败';
  } finally {
    loading.value = false;
  }
}

// openPolicyInstanceDetail loads one persisted PolicyInstance detail without enabling mutation actions.
async function openPolicyInstanceDetail(id: string) {
  detailLoading.value = true;
  loadError.value = '';
  try {
    selectedPolicy.value = await getPolicyInstanceByIdApi(id);
  } catch (error) {
    loadError.value =
      error instanceof Error ? error.message : 'PolicyInstance 详情加载失败';
  } finally {
    detailLoading.value = false;
  }
}

// createWarehouseScopePolicyInstance persists a first WMS warehouse-scope PolicyInstance operation.
async function createWarehouseScopePolicyInstance() {
  mutationLoading.value = true;
  loadError.value = '';
  try {
    await createPolicyInstanceApi({
      tenantId: createDraft.tenantId.trim(),
      subjectSelector: {
        type: 'ACCOUNT',
        accountId: createDraft.accountId.trim(),
      },
      permissionCode: 'wms.inventory.view',
      resourceType: 'inventory',
      templateCode: 'resource-field-in-set',
      effect: 'ALLOW',
      params: {
        field: 'warehouseId',
        allowedValues: splitCsv(createDraft.warehouseIds),
      },
      enabled: true,
      priority: 100,
    });
    await loadPolicyInstances();
  } catch (error) {
    loadError.value =
      error instanceof Error ? error.message : 'PolicyInstance 创建失败';
  } finally {
    mutationLoading.value = false;
  }
}

// setPolicyInstanceEnabled toggles one persisted PolicyInstance operation through the Gateway.
async function setPolicyInstanceEnabled(policy: PolicyInstanceManagementApi.PolicyInstance) {
  mutationLoading.value = true;
  loadError.value = '';
  try {
    await setPolicyInstanceEnabledApi(policy.id, !policy.enabled);
    await loadPolicyInstances();
  } catch (error) {
    loadError.value =
      error instanceof Error ? error.message : 'PolicyInstance 状态更新失败';
  } finally {
    mutationLoading.value = false;
  }
}

function formatSelector(policy: PolicyInstanceManagementApi.PolicyInstance) {
  const selector = policy.subjectSelector;

  if (selector.type === 'ACCOUNT') {
    return `ACCOUNT ${selector.accountId ?? '-'}`;
  }
  if (selector.type === 'ROLE') {
    return `ROLE ${selector.roleId ?? '-'}`;
  }
  return 'TENANT_WIDE';
}

function formatParamSummary(policy: PolicyInstanceManagementApi.PolicyInstance) {
  const field = policy.params?.field ?? policy.params?.resourceField ?? '-';
  const allowedValues = policy.params?.allowedValues;

  if (allowedValues?.length) {
    return `${field}: ${allowedValues.join(', ')}`;
  }

  return `${field}: ${policy.params?.value ?? '-'}`;
}

function splitCsv(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

onMounted(() => {
  void loadPolicyInstances();
});
</script>

<template>
  <div class="policy-instance-management-page">
    <section class="policy-instance-management__header">
      <div>
        <div class="policy-instance-management__eyebrow">PolicyInstance</div>
        <h1>资源授权实例</h1>
      </div>
      <button
        class="policy-instance-management__button"
        type="button"
        :disabled="loading || mutationLoading"
        @click="loadPolicyInstances"
      >
        {{ loading ? '刷新中' : '刷新' }}
      </button>
    </section>

    <p v-if="loadError" class="policy-instance-management__error">
      {{ loadError }}
    </p>

    <section class="policy-instance-management__create">
      <label>
        <span>租户</span>
        <input v-model="createDraft.tenantId" type="text" />
      </label>
      <label>
        <span>账号</span>
        <input v-model="createDraft.accountId" type="text" />
      </label>
      <label>
        <span>仓库</span>
        <input v-model="createDraft.warehouseIds" type="text" />
      </label>
      <button
        class="policy-instance-management__button"
        data-testid="policy-instance-create"
        type="button"
        :disabled="mutationLoading"
        @click="createWarehouseScopePolicyInstance"
      >
        {{ mutationLoading ? '提交中' : '创建 WMS 范围' }}
      </button>
    </section>

    <section class="policy-instance-management__layout">
      <article class="policy-instance-management__list">
        <div class="policy-instance-management__list-head">
          <h2>实例列表</h2>
          <span>{{ pagination.total }} 条</span>
        </div>

        <div v-if="loading" class="policy-instance-management__skeleton">
          <div />
          <div />
          <div />
        </div>

        <div
          v-else-if="!policies.length"
          class="policy-instance-management__empty"
        >
          暂无 PolicyInstance
        </div>

        <div v-else class="policy-instance-management__table" role="table">
          <div class="policy-instance-management__row policy-instance-management__row--head" role="row">
            <span>权限码</span>
            <span>资源</span>
            <span>模板</span>
            <span>Effect</span>
            <span>范围</span>
            <span>状态</span>
            <span>操作</span>
          </div>
          <div
            v-for="policy in policies"
            :key="policy.id"
            class="policy-instance-management__row"
            role="row"
          >
            <span>{{ policy.permissionCode }}</span>
            <span>{{ policy.resourceType || '-' }}</span>
            <span>{{ policy.templateCode }}</span>
            <span>
              <b :class="policy.effect === 'DENY' ? 'is-deny' : 'is-allow'">
                {{ policy.effect }}
              </b>
            </span>
            <span>{{ formatSelector(policy) }}</span>
            <span>
              {{ policy.enabled ? '启用' : '停用' }}
            </span>
            <span class="policy-instance-management__row-actions">
              <button
                class="policy-instance-management__link"
                data-testid="open-policy-instance-detail"
                type="button"
                @click="openPolicyInstanceDetail(policy.id)"
              >
                查看
              </button>
              <button
                class="policy-instance-management__link"
                data-testid="toggle-policy-instance-enabled"
                type="button"
                :disabled="mutationLoading"
                @click="setPolicyInstanceEnabled(policy)"
              >
                {{ policy.enabled ? '停用' : '启用' }}
              </button>
            </span>
          </div>
        </div>
      </article>

      <aside class="policy-instance-management__detail">
        <div class="policy-instance-management__list-head">
          <h2>详情</h2>
          <span v-if="detailLoading">加载中</span>
        </div>

        <div v-if="!selectedPolicy" class="policy-instance-management__empty">
          请选择一个实例
        </div>

        <template v-else>
          <dl class="policy-instance-management__facts">
            <div>
              <dt>ID</dt>
              <dd>{{ selectedPolicy.id }}</dd>
            </div>
            <div>
              <dt>租户</dt>
              <dd>{{ selectedPolicy.tenantId }}</dd>
            </div>
            <div>
              <dt>权限码</dt>
              <dd>{{ selectedPolicy.permissionCode }}</dd>
            </div>
            <div>
              <dt>资源类型</dt>
              <dd>{{ selectedPolicy.resourceType || '-' }}</dd>
            </div>
            <div>
              <dt>模板</dt>
              <dd>{{ selectedPolicy.templateCode }}</dd>
            </div>
            <div>
              <dt>主体</dt>
              <dd>{{ formatSelector(selectedPolicy) }}</dd>
            </div>
            <div>
              <dt>范围</dt>
              <dd>{{ formatParamSummary(selectedPolicy) }}</dd>
            </div>
            <div>
              <dt>状态</dt>
              <dd>{{ selectedPolicy.enabled ? '启用' : '停用' }}</dd>
            </div>
          </dl>

          <pre>{{ selectedParamsText }}</pre>
        </template>
      </aside>
    </section>
  </div>
</template>

<style scoped>
.policy-instance-management-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
}

.policy-instance-management__header,
.policy-instance-management__list-head {
  align-items: center;
  display: flex;
  justify-content: space-between;
}

.policy-instance-management__eyebrow {
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
}

.policy-instance-management__header h1,
.policy-instance-management__list-head h2 {
  color: #111827;
  line-height: 1.2;
  margin: 0;
}

.policy-instance-management__header h1 {
  font-size: 24px;
}

.policy-instance-management__list-head h2 {
  font-size: 16px;
}

.policy-instance-management__button,
.policy-instance-management__link {
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 700;
  min-height: 34px;
  padding: 0 12px;
}

.policy-instance-management__button {
  background: #155eef;
  border-color: #155eef;
  color: white;
}

.policy-instance-management__button:disabled {
  cursor: wait;
  opacity: 0.7;
}

.policy-instance-management__link {
  background: white;
  color: #155eef;
}

.policy-instance-management__button:active,
.policy-instance-management__link:active {
  transform: translateY(1px);
}

.policy-instance-management__layout {
  display: grid;
  gap: 16px;
  grid-template-columns: minmax(0, 1fr) 360px;
}

.policy-instance-management__create {
  align-items: end;
  border: 1px solid #d6dbe5;
  border-radius: 8px;
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(3, minmax(140px, 1fr)) auto;
  padding: 14px 16px;
}

.policy-instance-management__create label {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.policy-instance-management__create span {
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
}

.policy-instance-management__create input {
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  color: #111827;
  min-height: 34px;
  min-width: 0;
  padding: 0 10px;
}

.policy-instance-management__list,
.policy-instance-management__detail {
  border: 1px solid #d6dbe5;
  border-radius: 8px;
  min-width: 0;
  padding: 16px;
}

.policy-instance-management__table {
  display: grid;
  gap: 0;
  margin-top: 12px;
  overflow-x: auto;
}

.policy-instance-management__row {
  align-items: center;
  border-top: 1px solid #e2e8f0;
  display: grid;
  gap: 12px;
  grid-template-columns: minmax(180px, 1.3fr) 100px minmax(150px, 1fr) 70px minmax(140px, 1fr) 64px 112px;
  min-width: 920px;
  padding: 10px 0;
}

.policy-instance-management__row--head {
  border-top: 0;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
}

.policy-instance-management__row span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.policy-instance-management__row-actions {
  display: flex;
  gap: 8px;
}

.policy-instance-management__row-actions .policy-instance-management__link {
  min-width: 48px;
  padding: 0 8px;
}

.policy-instance-management__facts {
  display: grid;
  gap: 10px;
  margin: 14px 0;
}

.policy-instance-management__facts div {
  display: grid;
  gap: 4px;
}

.policy-instance-management__facts dt {
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
}

.policy-instance-management__facts dd {
  color: #111827;
  margin: 0;
  overflow-wrap: anywhere;
}

.policy-instance-management__detail pre {
  background: #0f172a;
  border-radius: 6px;
  color: #e2e8f0;
  font-size: 12px;
  line-height: 1.5;
  margin: 0;
  max-height: 320px;
  overflow: auto;
  padding: 12px;
  white-space: pre-wrap;
  word-break: break-word;
}

.policy-instance-management__empty,
.policy-instance-management__error,
.policy-instance-management__list-head span {
  color: #64748b;
}

.policy-instance-management__empty {
  padding: 24px 0;
}

.policy-instance-management__error {
  color: #b42318;
  margin: 0;
}

.policy-instance-management__skeleton {
  display: grid;
  gap: 8px;
  margin-top: 12px;
}

.policy-instance-management__skeleton div {
  animation: policy-instance-management-shimmer 1.2s ease-in-out infinite;
  background: linear-gradient(90deg, #f1f5f9, #e2e8f0, #f1f5f9);
  background-size: 200% 100%;
  border-radius: 6px;
  height: 42px;
}

.is-allow {
  color: #027a48;
}

.is-deny {
  color: #b42318;
}

@keyframes policy-instance-management-shimmer {
  0% {
    background-position: 0 0;
  }

  100% {
    background-position: -200% 0;
  }
}

@media (max-width: 1100px) {
  .policy-instance-management__layout {
    grid-template-columns: 1fr;
  }

  .policy-instance-management__create {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 700px) {
  .policy-instance-management__header {
    align-items: flex-start;
    flex-direction: column;
    gap: 12px;
  }
}
</style>
