<script setup lang="ts">
import type { CustomerManagementApi } from '#/api'
import type { TableColumnsType } from 'ant-design-vue'

import { computed, h, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { Page } from '@vben/common-ui'
import { IconifyIcon } from '@vben/icons'
import { Button, Dropdown, Menu, Table } from 'ant-design-vue'

import { listManagedCustomerAccountsApi } from '#/api'
import { useAuthContextStore } from '#/store/auth-context'

interface CustomerFilterState {
  keyword: string
  primaryTenantPartyId: string
  status: '' | CustomerManagementApi.CustomerStatus
}

interface CustomerTableActionItem<ActionKey extends string> {
  danger?: boolean
  disabled?: boolean
  hidden?: boolean
  key: ActionKey
  label: string
  testId?: string
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

/** renderCustomerNativeActions renders customer row commands with Ant Design Vue Dropdown/Menu directly. */
function renderCustomerNativeActions<ActionKey extends string>(
  ariaLabel: string,
  items: Array<CustomerTableActionItem<ActionKey>>,
  onClick: (key: ActionKey) => void
) {
  const visibleItems = items.filter((item) => !item.hidden)

  if (!visibleItems.length) {
    return h('span', { class: 'tenant-table-action-empty' }, '无可用操作')
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
            type: 'text'
          },
          () => h(IconifyIcon, { icon: 'ant-design:more-outlined' })
        ),
      overlay: () =>
        h(
          Menu,
          {
            onClick: (info) => {
              const action = visibleItems.find((item) => item.key === String(info.key))

              if (!action || action.disabled) {
                return
              }

              onClick(action.key)
            }
          },
          () =>
            visibleItems.map((item) =>
              h(
                Menu.Item,
                {
                  danger: item.danger,
                  disabled: item.disabled,
                  key: item.key,
                  'data-testid': item.testId
                },
                () => item.label
              )
            )
        )
    }
  )
}

const customerColumns = computed<TableColumnsType<CustomerManagementApi.CustomerAccount>>(() => [
  { dataIndex: 'customerAccountNo', key: 'customerAccountNo', title: '编号' },
  { dataIndex: 'displayName', key: 'displayName', title: '名称' },
  { dataIndex: 'status', key: 'status', title: '状态' },
  {
    dataIndex: 'customerCategory',
    key: 'customerCategory',
    title: '分类',
    customRender: ({ record }) => record.customerCategory || '-'
  },
  {
    dataIndex: 'tags',
    key: 'tags',
    title: '标签',
    customRender: ({ record }) => record.tags.join(', ') || '-'
  },
  {
    key: 'primaryBinding',
    title: '主绑定',
    customRender: ({ record }) =>
      record.primaryBinding
        ? h('span', [
            record.primaryBinding.tenantPartyId,
            h('small', record.primaryBinding.partyDisplayName)
          ])
        : '-'
  },
  {
    align: 'center',
    fixed: 'right',
    key: 'actions',
    title: '操作',
    width: 72,
    customRender: ({ record }) =>
      renderCustomerNativeActions(
        '客户操作',
        canViewCustomerDetail.value
          ? [{ key: 'detail', label: '详情', testId: `customer-detail-button-${record.customerAccountId}` }]
          : [],
        () => openDetailPage(record.customerAccountId)
      )
  }
])

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
  if (!canCreateCustomer.value) {
    return
  }

  router.push({
    name: 'TenantCustomerManagementCreate'
  })
}

/** openDetailPage keeps phase 1 editing inside the customer detail route. */
function openDetailPage(customerAccountId: string) {
  if (!canViewCustomerDetail.value) {
    return
  }

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
            v-access:code="'crm.customer_account.create'"
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
        <Table
          :columns="customerColumns"
          :data-source="customerAccounts"
          :loading="loading"
          :locale="{ emptyText: '暂无客户' }"
          :pagination="false"
          row-key="customerAccountId"
          size="middle"
        />
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
  align-items: center;
  gap: 10px;
  grid-template-columns: minmax(260px, 1.4fr) minmax(220px, 1fr) minmax(160px, 0.7fr) minmax(92px, 0.45fr);
}

.customer-filters input,
.customer-filters select,
.customer-filters button {
  min-height: 36px;
  border-radius: 10px;
}

.customer-filters button {
  justify-self: end;
  min-width: 84px;
  width: min(100%, 104px);
}

@media (max-width: 960px) {
  .customer-filters {
    grid-template-columns: 1fr;
  }
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
