<script setup lang="ts">
import type { SupplierManagementApi } from '#/api'
import type { TableColumnsType } from 'ant-design-vue'

import { computed, h, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { Page } from '@vben/common-ui'
import { IconifyIcon } from '@vben/icons'
import { Button, Dropdown, Menu, Table } from 'ant-design-vue'

import { listManagedSuppliersApi } from '#/api'
import { useAuthContextStore } from '#/store/auth-context'

interface SupplierFilterState {
  keyword: string
  status: '' | SupplierManagementApi.SupplierStatus
  tenantPartyId: string
}

interface SupplierTableActionItem<ActionKey extends string> {
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
const canCreateSupplier = computed(() =>
  authContextStore.actionCodes.includes('srm.supplier_profile.create')
)
const canListSuppliers = computed(() =>
  authContextStore.actionCodes.includes('srm.supplier_profile.list')
)
const canViewSupplierDetail = computed(() =>
  authContextStore.actionCodes.includes('srm.supplier_profile.get_by_id')
)
const filters = reactive<SupplierFilterState>({
  keyword: '',
  status: '',
  tenantPartyId: ''
})
const suppliers = ref<SupplierManagementApi.SupplierProfile[]>([])
const loading = ref(false)

/** renderSupplierNativeActions renders supplier row commands with Ant Design Vue Dropdown/Menu directly. */
function renderSupplierNativeActions<ActionKey extends string>(
  ariaLabel: string,
  items: Array<SupplierTableActionItem<ActionKey>>,
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

const supplierColumns = computed<TableColumnsType<SupplierManagementApi.SupplierProfile>>(() => [
  {
    dataIndex: 'supplierNo',
    key: 'supplierNo',
    title: '编号',
    customRender: ({ record }) => record.supplierNo || '-'
  },
  { dataIndex: 'displayName', key: 'displayName', title: '名称' },
  { dataIndex: 'status', key: 'status', title: '状态' },
  {
    dataIndex: 'supplierCategory',
    key: 'supplierCategory',
    title: '分类',
    customRender: ({ record }) => record.supplierCategory || '-'
  },
  {
    dataIndex: 'tags',
    key: 'tags',
    title: '标签',
    customRender: ({ record }) => record.tags.join(', ') || '-'
  },
  {
    key: 'partyBinding',
    title: '正式主体',
    customRender: ({ record }) =>
      record.partyBinding
        ? h('span', [
            record.partyBinding.tenantPartyId,
            h('small', record.partyBinding.partyDisplayName)
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
      renderSupplierNativeActions(
        '供应商操作',
        canViewSupplierDetail.value
          ? [{ key: 'detail', label: '详情', testId: `supplier-detail-button-${record.supplierId}` }]
          : [],
        () => openDetailPage(record.supplierId)
      )
  }
])

/** loadSuppliers refreshes the tenant-scoped SRM supplier directory using the current filter state. */
async function loadSuppliers() {
  if (!canListSuppliers.value || !activeTenantId.value) {
    suppliers.value = []
    return
  }

  loading.value = true
  try {
    const result = await listManagedSuppliersApi(activeTenantId.value, {
      keyword: filters.keyword.trim() || undefined,
      status: filters.status || undefined,
      tenantPartyId: filters.tenantPartyId.trim() || undefined,
      page: 1,
      pageSize: 20
    })
    suppliers.value = result.suppliers ?? []
  } finally {
    loading.value = false
  }
}

/** openCreatePage keeps supplier creation on the dedicated route instead of overloading the list view. */
function openCreatePage() {
  if (!canCreateSupplier.value) {
    return
  }

  router.push({
    name: 'TenantSupplierManagementCreate'
  })
}

/** openDetailPage keeps phase 1 editing inside the supplier detail route. */
function openDetailPage(supplierId: string) {
  if (!canViewSupplierDetail.value) {
    return
  }

  router.push({
    name: 'TenantSupplierManagementDetail',
    params: {
      supplierId
    }
  })
}

onMounted(() => {
  void loadSuppliers()
})
</script>

<template>
  <Page>
    <section class="supplier-page">
      <header class="supplier-page__hero">
        <div>
          <h1>供应商管理</h1>
          <p>tenant-web 的 SRM phase 1 供应商入口，只覆盖供应商列表、创建、tenantParty 绑定、联系人、地址、状态和 SupplierOffering。</p>
        </div>
        <div class="supplier-page__hero-side">
          <span class="supplier-pill">{{ activeTenantName }}</span>
          <button
            v-access:code="'srm.supplier_profile.create'"
            v-if="canCreateSupplier"
            data-testid="supplier-create-button"
            type="button"
            @click="openCreatePage"
          >
            创建供应商
          </button>
        </div>
      </header>

      <section class="supplier-card">
        <h2>筛选</h2>
        <div class="supplier-filters">
          <input
            data-testid="supplier-filter-keyword"
            v-model="filters.keyword"
            placeholder="编号 / 名称关键词"
          />
          <input
            data-testid="supplier-filter-party"
            v-model="filters.tenantPartyId"
            placeholder="tenantPartyId"
          />
          <select data-testid="supplier-filter-status" v-model="filters.status">
            <option value="">全部状态</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
          <button data-testid="supplier-filter-search" type="button" @click="loadSuppliers">
            {{ loading ? '加载中...' : '查询' }}
          </button>
        </div>
      </section>

      <section class="supplier-card">
        <h2>供应商列表</h2>
        <p class="supplier-note">phase 1 不扩展 SupplierItemMapping、RFQ、SupplierQuote、采购价格、MOQ、账期或 lead time。</p>
        <Table
          :columns="supplierColumns"
          :data-source="suppliers"
          :loading="loading"
          :locale="{ emptyText: '暂无供应商' }"
          :pagination="false"
          :scroll="{ x: 980 }"
          row-key="supplierId"
          size="middle"
        />
      </section>
    </section>
  </Page>
</template>

<style scoped>
.supplier-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
}

.supplier-page__hero {
  align-items: flex-start;
  background: linear-gradient(180deg, #ffffff 0%, #f7fbff 100%);
  border: 1px solid #dbe5f4;
  border-radius: 16px;
  display: flex;
  gap: 16px;
  justify-content: space-between;
  padding: 20px;
}

.supplier-page__hero h1 {
  margin: 0;
}

.supplier-page__hero p {
  color: #516074;
  margin: 8px 0 0;
}

.supplier-page__hero-side {
  align-items: flex-end;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.supplier-pill {
  background: #ecfeff;
  border-radius: 999px;
  color: #0f766e;
  font-size: 12px;
  padding: 6px 10px;
}

.supplier-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 16px;
}

.supplier-card h2 {
  margin: 0 0 12px;
}

.supplier-filters {
  display: grid;
  align-items: center;
  gap: 10px;
  grid-template-columns: minmax(260px, 1.4fr) minmax(220px, 1fr) minmax(160px, 0.7fr) minmax(92px, 0.45fr);
}

.supplier-filters input,
.supplier-filters select,
.supplier-filters button {
  min-height: 36px;
  border-radius: 10px;
}

.supplier-filters button {
  justify-self: end;
  min-width: 84px;
  width: min(100%, 104px);
}

@media (max-width: 960px) {
  .supplier-filters {
    grid-template-columns: 1fr;
  }
}

.supplier-note {
  color: #6b7280;
  margin: 0 0 12px;
}

.supplier-table {
  border-collapse: collapse;
  width: 100%;
}

.supplier-table th,
.supplier-table td {
  border-bottom: 1px solid #e2e8f0;
  padding: 10px 8px;
  text-align: left;
  vertical-align: top;
}

.supplier-table small {
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

@media (max-width: 960px) {
  .supplier-page__hero {
    flex-direction: column;
  }

  .supplier-page__hero-side {
    align-items: flex-start;
  }
}
</style>
