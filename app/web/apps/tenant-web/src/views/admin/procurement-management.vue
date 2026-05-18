<script setup lang="ts">
import type { ProcurementApi } from '#/api'
import type { TableColumnsType } from 'ant-design-vue'

import { computed, h, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { Page } from '@vben/common-ui'
import { IconifyIcon } from '@vben/icons'
import { Button, Dropdown, Menu, Table } from 'ant-design-vue'

import {
  listPurchaseOrdersApi,
  listPurchaseRequestsApi,
  listReceivingExpectationsApi
} from '#/api'
import { useAuthContextStore } from '#/store/auth-context'

interface ProcurementFilterState {
  orderKeyword: string
  orderStatus: '' | ProcurementApi.PurchaseOrderStatus
  requestKeyword: string
  requestStatus: '' | ProcurementApi.PurchaseRequestStatus
  requestType: '' | ProcurementApi.PurchaseRequestType
  showOpenDiscrepancyOnly: boolean | undefined
  receivingStatus: '' | ProcurementApi.ReceivingExpectationStatus
}

interface ProcurementTableActionItem<ActionKey extends string> {
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
const canCreatePurchaseRequest = computed(() =>
  authContextStore.actionCodes.includes('procurement.purchase_request.create')
)
const canListPurchaseRequests = computed(() =>
  authContextStore.actionCodes.includes('procurement.purchase_request.list')
)
const canViewPurchaseRequest = computed(() =>
  authContextStore.actionCodes.includes('procurement.purchase_request.get_by_id')
)
const canListPurchaseOrders = computed(() =>
  authContextStore.actionCodes.includes('procurement.purchase_order.list')
)
const canViewPurchaseOrder = computed(() =>
  authContextStore.actionCodes.includes('procurement.purchase_order.get_by_id')
)
const canListReceivingExpectations = computed(() =>
  authContextStore.actionCodes.includes('procurement.receiving_expectation.list')
)
const canViewReceivingExpectation = computed(() =>
  authContextStore.actionCodes.includes('procurement.receiving_expectation.get_by_id')
)
const filters = reactive<ProcurementFilterState>({
  orderKeyword: '',
  orderStatus: '',
  requestKeyword: '',
  requestStatus: '',
  requestType: '',
  showOpenDiscrepancyOnly: undefined,
  receivingStatus: ''
})
const loading = ref(false)
const purchaseRequests = ref<ProcurementApi.PurchaseRequestSummary[]>([])
const purchaseOrders = ref<ProcurementApi.PurchaseOrderSummary[]>([])
const receivingExpectations = ref<ProcurementApi.ReceivingExpectationSummary[]>([])

/** renderProcurementNativeActions renders procurement row commands with Ant Design Vue Dropdown/Menu directly. */
function renderProcurementNativeActions<ActionKey extends string>(
  ariaLabel: string,
  items: Array<ProcurementTableActionItem<ActionKey>>,
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

const purchaseRequestColumns = computed<TableColumnsType<ProcurementApi.PurchaseRequestSummary>>(() => [
  { dataIndex: 'requestNo', key: 'requestNo', title: 'PR 编号' },
  { dataIndex: 'requestType', key: 'requestType', title: '类型' },
  { dataIndex: 'status', key: 'status', title: '状态' },
  { dataIndex: 'requesterDisplayName', key: 'requesterDisplayName', title: '申请人' },
  {
    align: 'center',
    fixed: 'right',
    key: 'actions',
    title: '操作',
    width: 72,
    customRender: ({ record }) =>
      renderProcurementNativeActions(
        '采购申请操作',
        canViewPurchaseRequest.value
          ? [{ key: 'detail', label: '详情', testId: `procurement-open-pr-${record.purchaseRequestId}` }]
          : [],
        () => openPurchaseRequestDetail(record.purchaseRequestId)
      )
  }
])
const purchaseOrderColumns = computed<TableColumnsType<ProcurementApi.PurchaseOrderSummary>>(() => [
  { dataIndex: 'orderNo', key: 'orderNo', title: 'PO 编号' },
  { dataIndex: 'supplierDisplayName', key: 'supplierDisplayName', title: '供应商' },
  { dataIndex: 'status', key: 'status', title: '状态' },
  { dataIndex: 'currencyCode', key: 'currencyCode', title: '货币' },
  {
    align: 'center',
    fixed: 'right',
    key: 'actions',
    title: '操作',
    width: 72,
    customRender: ({ record }) =>
      renderProcurementNativeActions(
        '采购订单操作',
        canViewPurchaseOrder.value
          ? [{ key: 'detail', label: '详情', testId: `procurement-open-po-${record.purchaseOrderId}` }]
          : [],
        () => openPurchaseOrderDetail(record.purchaseOrderId)
      )
  }
])
const receivingExpectationColumns = computed<TableColumnsType<ProcurementApi.ReceivingExpectationSummary>>(() => [
  { dataIndex: 'receivingExpectationId', key: 'receivingExpectationId', title: 'Expectation' },
  { dataIndex: 'purchaseOrderId', key: 'purchaseOrderId', title: 'PO' },
  { dataIndex: 'openQuantity', key: 'openQuantity', title: '未收数量' },
  { dataIndex: 'status', key: 'status', title: '状态' },
  {
    key: 'discrepancy',
    title: '差异',
    customRender: ({ record }) => (record.hasOpenDiscrepancy ? 'OPEN' : 'NONE')
  },
  {
    align: 'center',
    fixed: 'right',
    key: 'actions',
    title: '操作',
    width: 72,
    customRender: ({ record }) =>
      renderProcurementNativeActions(
        '收货预期操作',
        canViewReceivingExpectation.value
          ? [{ key: 'detail', label: '详情', testId: `procurement-open-re-${record.receivingExpectationId}` }]
          : [],
        () => openReceivingExpectationDetail(record.receivingExpectationId)
      )
  }
])

/** loadWorkspace refreshes the three procurement phase 1 directories for the current tenant workspace. */
async function loadWorkspace() {
  if (!activeTenantId.value) {
    purchaseRequests.value = []
    purchaseOrders.value = []
    receivingExpectations.value = []
    return
  }

  loading.value = true
  try {
    const [requestResult, orderResult, receivingResult] = await Promise.all([
      canListPurchaseRequests.value
        ? listPurchaseRequestsApi(activeTenantId.value, {
            keyword: filters.requestKeyword.trim() || undefined,
            page: 1,
            pageSize: 20,
            requestType: filters.requestType || undefined,
            status: filters.requestStatus || undefined
          })
        : Promise.resolve({ purchaseRequests: [] as ProcurementApi.PurchaseRequestSummary[] }),
      canListPurchaseOrders.value
        ? listPurchaseOrdersApi(activeTenantId.value, {
            keyword: filters.orderKeyword.trim() || undefined,
            page: 1,
            pageSize: 20,
            status: filters.orderStatus || undefined
          })
        : Promise.resolve({ purchaseOrders: [] as ProcurementApi.PurchaseOrderSummary[] }),
      canListReceivingExpectations.value
        ? listReceivingExpectationsApi(activeTenantId.value, {
            hasOpenDiscrepancy: filters.showOpenDiscrepancyOnly,
            page: 1,
            pageSize: 20,
            status: filters.receivingStatus || undefined
          })
        : Promise.resolve({
            receivingExpectations: [] as ProcurementApi.ReceivingExpectationSummary[]
          })
    ])

    purchaseRequests.value = requestResult.purchaseRequests ?? []
    purchaseOrders.value = orderResult.purchaseOrders ?? []
    receivingExpectations.value = receivingResult.receivingExpectations ?? []
  } finally {
    loading.value = false
  }
}

/** openCreatePurchaseRequest keeps PR creation on the dedicated route instead of overloading the workspace list. */
function openCreatePurchaseRequest() {
  if (!canCreatePurchaseRequest.value) {
    return
  }

  router.push({
    name: 'TenantPurchaseRequestCreate'
  })
}

/** openPurchaseRequestDetail keeps PR actions inside the dedicated detail route. */
function openPurchaseRequestDetail(purchaseRequestId: string) {
  if (!canViewPurchaseRequest.value) {
    return
  }

  router.push({
    name: 'TenantPurchaseRequestDetail',
    params: {
      purchaseRequestId
    }
  })
}

/** openPurchaseOrderDetail keeps PO actions inside the dedicated detail route. */
function openPurchaseOrderDetail(purchaseOrderId: string) {
  if (!canViewPurchaseOrder.value) {
    return
  }

  router.push({
    name: 'TenantPurchaseOrderDetail',
    params: {
      purchaseOrderId
    }
  })
}

/** openReceivingExpectationDetail keeps discrepancy summaries inside the dedicated detail route. */
function openReceivingExpectationDetail(receivingExpectationId: string) {
  if (!canViewReceivingExpectation.value) {
    return
  }

  router.push({
    name: 'TenantReceivingExpectationDetail',
    params: {
      receivingExpectationId
    }
  })
}

onMounted(() => {
  void loadWorkspace()
})
</script>

<template>
  <Page>
    <section class="procurement-page">
      <header class="procurement-page__hero">
        <div>
          <h1>采购管理</h1>
          <p>phase 1 只覆盖 PR、PO、ReceivingExpectation、Discrepancy 与 PO Change 的最小查看与操作。</p>
        </div>
        <div class="procurement-page__hero-side">
          <span class="procurement-pill">{{ activeTenantName }}</span>
          <button
            v-access:code="'procurement.purchase_request.create'"
            v-if="canCreatePurchaseRequest"
            data-testid="procurement-open-create-pr"
            type="button"
            @click="openCreatePurchaseRequest"
          >
            创建采购申请
          </button>
        </div>
      </header>

      <section class="procurement-card">
        <h2>筛选</h2>
        <div class="procurement-filters">
          <input v-model="filters.requestKeyword" placeholder="PR 关键词" />
          <select v-model="filters.requestType">
            <option value="">全部 PR 类型</option>
            <option value="DEPARTMENTAL">DEPARTMENTAL</option>
            <option value="SALES_DEDICATED">SALES_DEDICATED</option>
          </select>
          <select v-model="filters.requestStatus">
            <option value="">全部 PR 状态</option>
            <option value="DRAFT">DRAFT</option>
            <option value="SUBMITTED">SUBMITTED</option>
            <option value="APPROVED">APPROVED</option>
          </select>
          <input v-model="filters.orderKeyword" placeholder="PO 关键词" />
          <select v-model="filters.orderStatus">
            <option value="">全部 PO 状态</option>
            <option value="DRAFT">DRAFT</option>
            <option value="ISSUED">ISSUED</option>
            <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
          </select>
          <select v-model="filters.receivingStatus">
            <option value="">全部收货预期状态</option>
            <option value="OPEN">OPEN</option>
            <option value="PARTIALLY_RECEIVED">PARTIALLY_RECEIVED</option>
            <option value="COMPLETED">COMPLETED</option>
          </select>
          <label class="procurement-checkbox">
            <input v-model="filters.showOpenDiscrepancyOnly" :value="true" type="checkbox" />
            仅看未关闭差异
          </label>
          <button type="button" @click="loadWorkspace">
            {{ loading ? '加载中...' : '刷新目录' }}
          </button>
        </div>
      </section>

      <section class="procurement-card">
        <h2>采购申请</h2>
        <Table
          :columns="purchaseRequestColumns"
          :data-source="purchaseRequests"
          :loading="loading"
          :locale="{ emptyText: '暂无采购申请' }"
          :pagination="false"
          row-key="purchaseRequestId"
          size="middle"
        />
      </section>

      <section class="procurement-card">
        <h2>采购订单</h2>
        <Table
          :columns="purchaseOrderColumns"
          :data-source="purchaseOrders"
          :loading="loading"
          :locale="{ emptyText: '暂无采购订单' }"
          :pagination="false"
          row-key="purchaseOrderId"
          size="middle"
        />
      </section>

      <section class="procurement-card">
        <h2>收货预期</h2>
        <Table
          :columns="receivingExpectationColumns"
          :data-source="receivingExpectations"
          :loading="loading"
          :locale="{ emptyText: '暂无收货预期' }"
          :pagination="false"
          row-key="receivingExpectationId"
          size="middle"
        />
      </section>
    </section>
  </Page>
</template>

<style scoped>
.procurement-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
}

.procurement-page__hero {
  align-items: flex-start;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid #dbe5f4;
  border-radius: 16px;
  display: flex;
  gap: 16px;
  justify-content: space-between;
  padding: 20px;
}

.procurement-page__hero h1 {
  margin: 0;
}

.procurement-page__hero p {
  color: #516074;
  margin: 8px 0 0;
}

.procurement-page__hero-side {
  align-items: flex-end;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.procurement-pill {
  background: #eff6ff;
  border-radius: 999px;
  color: #1d4ed8;
  font-size: 12px;
  padding: 6px 10px;
}

.procurement-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 16px;
}

.procurement-card h2 {
  margin: 0 0 12px;
}

.procurement-filters {
  display: grid;
  align-items: center;
  gap: 10px;
  grid-template-columns:
    minmax(200px, 1.2fr)
    repeat(2, minmax(150px, 0.8fr))
    minmax(200px, 1.2fr)
    repeat(2, minmax(150px, 0.8fr))
    minmax(144px, 0.7fr)
    minmax(96px, 0.45fr);
}

.procurement-filters input,
.procurement-filters select,
.procurement-filters button {
  min-height: 36px;
  border-radius: 10px;
}

.procurement-filters button {
  justify-self: end;
  min-width: 84px;
  width: min(100%, 104px);
}

@media (max-width: 1200px) {
  .procurement-filters {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  }
}

@media (max-width: 720px) {
  .procurement-filters {
    grid-template-columns: 1fr;
  }
}

.procurement-checkbox {
  align-items: center;
  display: flex;
  gap: 8px;
}

</style>
