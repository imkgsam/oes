<script setup lang="ts">
import type { ProcurementApi } from '#/api'

import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { Page } from '@vben/common-ui'

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
        <table class="procurement-table">
          <thead>
            <tr>
              <th>PR 编号</th>
              <th>类型</th>
              <th>状态</th>
              <th>申请人</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="purchaseRequest in purchaseRequests" :key="purchaseRequest.purchaseRequestId">
              <td>{{ purchaseRequest.requestNo }}</td>
              <td>{{ purchaseRequest.requestType }}</td>
              <td>{{ purchaseRequest.status }}</td>
              <td>{{ purchaseRequest.requesterDisplayName }}</td>
              <td>
                <button
                  v-access:code="'procurement.purchase_request.get_by_id'"
                  v-if="canViewPurchaseRequest"
                  :data-testid="`procurement-open-pr-${purchaseRequest.purchaseRequestId}`"
                  type="button"
                  @click="openPurchaseRequestDetail(purchaseRequest.purchaseRequestId)"
                >
                  详情
                </button>
              </td>
            </tr>
            <tr v-if="!purchaseRequests.length">
              <td colspan="5">暂无采购申请</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="procurement-card">
        <h2>采购订单</h2>
        <table class="procurement-table">
          <thead>
            <tr>
              <th>PO 编号</th>
              <th>供应商</th>
              <th>状态</th>
              <th>货币</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="purchaseOrder in purchaseOrders" :key="purchaseOrder.purchaseOrderId">
              <td>{{ purchaseOrder.orderNo }}</td>
              <td>{{ purchaseOrder.supplierDisplayName }}</td>
              <td>{{ purchaseOrder.status }}</td>
              <td>{{ purchaseOrder.currencyCode }}</td>
              <td>
                <button
                  v-access:code="'procurement.purchase_order.get_by_id'"
                  v-if="canViewPurchaseOrder"
                  :data-testid="`procurement-open-po-${purchaseOrder.purchaseOrderId}`"
                  type="button"
                  @click="openPurchaseOrderDetail(purchaseOrder.purchaseOrderId)"
                >
                  详情
                </button>
              </td>
            </tr>
            <tr v-if="!purchaseOrders.length">
              <td colspan="5">暂无采购订单</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="procurement-card">
        <h2>收货预期</h2>
        <table class="procurement-table">
          <thead>
            <tr>
              <th>Expectation</th>
              <th>PO</th>
              <th>未收数量</th>
              <th>状态</th>
              <th>差异</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="receivingExpectation in receivingExpectations"
              :key="receivingExpectation.receivingExpectationId"
            >
              <td>{{ receivingExpectation.receivingExpectationId }}</td>
              <td>{{ receivingExpectation.purchaseOrderId }}</td>
              <td>{{ receivingExpectation.openQuantity }}</td>
              <td>{{ receivingExpectation.status }}</td>
              <td>{{ receivingExpectation.hasOpenDiscrepancy ? 'OPEN' : 'NONE' }}</td>
              <td>
                <button
                  v-access:code="'procurement.receiving_expectation.get_by_id'"
                  v-if="canViewReceivingExpectation"
                  :data-testid="`procurement-open-re-${receivingExpectation.receivingExpectationId}`"
                  type="button"
                  @click="openReceivingExpectationDetail(receivingExpectation.receivingExpectationId)"
                >
                  详情
                </button>
              </td>
            </tr>
            <tr v-if="!receivingExpectations.length">
              <td colspan="6">暂无收货预期</td>
            </tr>
          </tbody>
        </table>
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

.procurement-table {
  border-collapse: collapse;
  width: 100%;
}

.procurement-table th,
.procurement-table td {
  border-bottom: 1px solid #e5e7eb;
  padding: 10px 8px;
  text-align: left;
}
</style>
