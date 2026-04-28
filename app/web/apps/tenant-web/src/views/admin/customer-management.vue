<script setup lang="ts">
import type { CustomerManagementApi } from '#/api'

import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { Page } from '@vben/common-ui'

import { listManagedCustomerAccountsApi } from '#/api'
import { useAuthContextStore } from '#/store/auth-context'

interface CustomerFilterState {
  keyword: string
  primaryTenantPartyId: string
  status: '' | CustomerManagementApi.CustomerStatus
}

const authContextStore = useAuthContextStore()
const router = useRouter()
const activeTenantId = computed(() => authContextStore.sessionContext?.tenant?.tenantId ?? '')
const activeTenantName = computed(
  () => authContextStore.sessionContext?.tenant?.name ?? authContextStore.tenantName ?? '当前租户'
)
const canCreateCustomer = computed(() =>
  authContextStore.actionCodes.includes('crm.customer_account.create')
)
const canListCustomers = computed(() =>
  authContextStore.actionCodes.includes('crm.customer_account.list')
)
const canViewCustomerDetail = computed(() =>
  authContextStore.actionCodes.includes('crm.customer_account.get_by_id')
)
const filters = reactive<CustomerFilterState>({
  keyword: '',
  primaryTenantPartyId: '',
  status: ''
})
const customerAccounts = ref<CustomerManagementApi.CustomerAccount[]>([])
const loading = ref(false)

/** loadCustomerAccounts refreshes the tenant-scoped CRM customer directory using the current filter state. */
async function loadCustomerAccounts() {
  if (!canListCustomers.value || !activeTenantId.value) {
    customerAccounts.value = []
    return
  }

  loading.value = true
  try {
    const result = await listManagedCustomerAccountsApi(activeTenantId.value, {
      keyword: filters.keyword.trim() || undefined,
      primaryTenantPartyId: filters.primaryTenantPartyId.trim() || undefined,
      status: filters.status || undefined,
      page: 1,
      pageSize: 20
    })
    customerAccounts.value = result.customerAccounts ?? []
  } finally {
    loading.value = false
  }
}

/** openCreatePage keeps customer creation on the dedicated route instead of overloading the list view. */
function openCreatePage() {
  router.push({
    name: 'TenantCustomerManagementCreate'
  })
}

/** openDetailPage keeps phase 1 editing inside the customer detail route. */
function openDetailPage(customerAccountId: string) {
  router.push({
    name: 'TenantCustomerManagementDetail',
    params: {
      customerAccountId
    }
  })
}

onMounted(() => {
  void loadCustomerAccounts()
})
</script>

<template>
  <Page>
    <section class="customer-page">
      <header class="customer-page__hero">
        <div>
          <h1>客户管理</h1>
          <p>tenant-web 的 CRM phase 1 客户管理入口，只覆盖客户列表、创建、主绑定、联系人、地址与状态切换。</p>
        </div>
        <div class="customer-page__hero-side">
          <span class="customer-pill">{{ activeTenantName }}</span>
          <button
            v-if="canCreateCustomer"
            data-testid="customer-create-button"
            type="button"
            @click="openCreatePage"
          >
            创建客户
          </button>
        </div>
      </header>

      <section class="customer-card">
        <h2>筛选</h2>
        <div class="customer-filters">
          <input
            data-testid="customer-filter-keyword"
            v-model="filters.keyword"
            placeholder="编号 / 名称关键词"
          />
          <input
            data-testid="customer-filter-party"
            v-model="filters.primaryTenantPartyId"
            placeholder="primary tenantPartyId"
          />
          <select data-testid="customer-filter-status" v-model="filters.status">
            <option value="">全部状态</option>
            <option value="ACTIVE_CUSTOMER">ACTIVE_CUSTOMER</option>
            <option value="BLOCKED">BLOCKED</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>
          <button data-testid="customer-filter-search" type="button" @click="loadCustomerAccounts">
            {{ loading ? '加载中...' : '查询' }}
          </button>
        </div>
      </section>

      <section class="customer-card">
        <h2>客户列表</h2>
        <p class="customer-note">phase 1 不扩展多主体、多 legal entity、财务信息、Customer 360 或 CustomerItemMapping。</p>
        <table class="customer-table">
          <thead>
            <tr>
              <th>编号</th>
              <th>名称</th>
              <th>状态</th>
              <th>分类</th>
              <th>标签</th>
              <th>主绑定</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="customer in customerAccounts" :key="customer.customerAccountId">
              <td>{{ customer.customerAccountNo }}</td>
              <td>{{ customer.displayName }}</td>
              <td>{{ customer.status }}</td>
              <td>{{ customer.customerCategory || '-' }}</td>
              <td>{{ customer.tags.join(', ') || '-' }}</td>
              <td>
                <span v-if="customer.primaryBinding">
                  {{ customer.primaryBinding.tenantPartyId }}
                  <small>{{ customer.primaryBinding.partyDisplayName }}</small>
                </span>
                <span v-else>-</span>
              </td>
              <td>
                <button
                  v-if="canViewCustomerDetail"
                  :data-testid="`customer-detail-button-${customer.customerAccountId}`"
                  type="button"
                  @click="openDetailPage(customer.customerAccountId)"
                >
                  详情
                </button>
              </td>
            </tr>
            <tr v-if="!customerAccounts.length">
              <td colspan="7">暂无客户</td>
            </tr>
          </tbody>
        </table>
      </section>
    </section>
  </Page>
</template>

<style scoped>
.customer-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
}

.customer-page__hero {
  align-items: flex-start;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  border: 1px solid #dbe5f4;
  border-radius: 16px;
  display: flex;
  gap: 16px;
  justify-content: space-between;
  padding: 20px;
}

.customer-page__hero h1 {
  margin: 0;
}

.customer-page__hero p {
  color: #516074;
  margin: 8px 0 0;
}

.customer-page__hero-side {
  align-items: flex-end;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.customer-pill {
  background: #eff6ff;
  border-radius: 999px;
  color: #1d4ed8;
  font-size: 12px;
  padding: 6px 10px;
}

.customer-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 16px;
}

.customer-card h2 {
  margin: 0 0 12px;
}

.customer-filters {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
}

.customer-note {
  color: #6b7280;
  margin: 0 0 12px;
}

.customer-table {
  border-collapse: collapse;
  width: 100%;
}

.customer-table th,
.customer-table td {
  border-bottom: 1px solid #e2e8f0;
  padding: 10px 8px;
  text-align: left;
  vertical-align: top;
}

.customer-table small {
  color: #64748b;
  display: block;
}

button,
input,
select {
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  min-height: 36px;
  padding: 8px 10px;
}

button {
  background: #0f172a;
  color: #fff;
  cursor: pointer;
}
</style>
