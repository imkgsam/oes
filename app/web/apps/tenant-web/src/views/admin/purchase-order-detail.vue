<script setup lang="ts">
import type { ProcurementApi } from '#/api'

import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { Page } from '@vben/common-ui'

import {
  applyPurchaseOrderChangeApi,
  cancelPurchaseOrderApi,
  confirmSupplierAcknowledgementApi,
  createReceivingExpectationApi,
  getPurchaseOrderByIdApi,
  issuePurchaseOrderApi,
  listPurchaseOrderChangesApi
} from '#/api'
import { useAuthContextStore } from '#/store/auth-context'

const authContextStore = useAuthContextStore()
const route = useRoute()
const router = useRouter()
const activeTenantId = computed(() => authContextStore.sessionContext?.tenant?.tenantId ?? '')
const purchaseOrder = ref<null | ProcurementApi.PurchaseOrder>(null)
const changes = ref<ProcurementApi.PurchaseOrderChange[]>([])
const issueComment = ref('')
const acknowledgementComment = ref('')
const changeReason = ref('')
const cancelReason = ref('')
const expectationQuantity = ref('')

/** loadPurchaseOrder refreshes the current PO detail snapshot and its change history. */
async function loadPurchaseOrder() {
  if (!activeTenantId.value) {
    return
  }

  const purchaseOrderId = String(route.params.purchaseOrderId ?? '')
  const [purchaseOrderResult, changeResult] = await Promise.all([
    getPurchaseOrderByIdApi(activeTenantId.value, purchaseOrderId),
    listPurchaseOrderChangesApi(activeTenantId.value, purchaseOrderId, {
      page: 1,
      pageSize: 20
    })
  ])

  purchaseOrder.value = purchaseOrderResult
  changes.value = changeResult.changes ?? []
}

/** issueCurrentPurchaseOrder forwards the current PO issue command with a minimal audit reason. */
async function issueCurrentPurchaseOrder() {
  if (!activeTenantId.value) {
    return
  }

  const result = await issuePurchaseOrderApi(
    activeTenantId.value,
    String(route.params.purchaseOrderId ?? ''),
    {
      auditReason: 'issue from tenant-web purchase order detail',
      issueComment: issueComment.value || undefined
    }
  )

  if (result) {
    purchaseOrder.value = result
  }
}

/** acknowledgeCurrentPurchaseOrder forwards the supplier acknowledgement summary for the current PO. */
async function acknowledgeCurrentPurchaseOrder() {
  if (!activeTenantId.value) {
    return
  }

  const result = await confirmSupplierAcknowledgementApi(
    activeTenantId.value,
    String(route.params.purchaseOrderId ?? ''),
    {
      auditReason: 'acknowledgement from tenant-web purchase order detail',
      comment: acknowledgementComment.value || undefined
    }
  )

  if (result) {
    purchaseOrder.value = result
  }
}

/** applyCurrentPurchaseOrderChange forwards a minimal applied change summary using the current PO line state. */
async function applyCurrentPurchaseOrderChange() {
  if (!activeTenantId.value || !purchaseOrder.value) {
    return
  }

  const result = await applyPurchaseOrderChangeApi(
    activeTenantId.value,
    String(route.params.purchaseOrderId ?? ''),
    {
      auditReason: 'change from tenant-web purchase order detail',
      changeReason: changeReason.value,
      changeType: 'MANUAL_UPDATE',
      targetState: {
        lines: purchaseOrder.value.lines.map((line) => ({
          allocations: line.allocations.map((allocation) => ({
            allocationType: allocation.allocationType as ProcurementApi.PurchaseOrderAllocationType,
            quantity: allocation.quantity,
            reason: allocation.reason || undefined,
            referenceId: allocation.referenceId
          })),
          description: line.description,
          itemId: line.itemId || undefined,
          lineType: line.lineType as ProcurementApi.PurchaseRequestLineType,
          orderedQuantity: line.orderedQuantity,
          orderedUnitPrice: line.orderedUnitPrice || undefined,
          purchaseOrderLineId: line.purchaseOrderLineId,
          uom: line.uom
        }))
      }
    }
  )

  if (result?.purchaseOrder) {
    purchaseOrder.value = result.purchaseOrder
  }
  if (result?.change) {
    changes.value = [result.change, ...changes.value]
  }
}

/** cancelCurrentPurchaseOrder forwards the current PO cancel command with a minimal audit reason. */
async function cancelCurrentPurchaseOrder() {
  if (!activeTenantId.value) {
    return
  }

  const result = await cancelPurchaseOrderApi(
    activeTenantId.value,
    String(route.params.purchaseOrderId ?? ''),
    {
      auditReason: 'cancel from tenant-web purchase order detail',
      cancelReason: cancelReason.value
    }
  )

  if (result) {
    purchaseOrder.value = result
  }
}

/** createCurrentReceivingExpectation creates one receiving expectation for the first PO line and opens the expectation detail route. */
async function createCurrentReceivingExpectation() {
  if (!activeTenantId.value || !purchaseOrder.value || purchaseOrder.value.lines.length === 0) {
    return
  }

  const firstLine = purchaseOrder.value.lines[0]
  if (!firstLine?.purchaseOrderLineId) {
    return
  }

  const result = await createReceivingExpectationApi(activeTenantId.value, {
    expectedQuantity: expectationQuantity.value,
    purchaseOrderId: purchaseOrder.value.purchaseOrderId,
    purchaseOrderLineId: firstLine.purchaseOrderLineId
  })

  if (result.receivingExpectationId) {
    router.push({
      name: 'TenantReceivingExpectationDetail',
      params: {
        receivingExpectationId: result.receivingExpectationId
      }
    })
  }
}

onMounted(() => {
  void loadPurchaseOrder()
})
</script>

<template>
  <Page>
    <section class="procurement-detail">
      <h1>采购订单详情</h1>
      <p v-if="purchaseOrder">{{ purchaseOrder.orderNo }}</p>
      <ul v-if="purchaseOrder">
        <li v-for="line in purchaseOrder.lines" :key="line.purchaseOrderLineId">
          {{ line.itemCode || line.description }} / {{ line.orderedQuantity }}
        </li>
      </ul>
      <div class="procurement-detail__changes">
        <div v-for="change in changes" :key="change.purchaseOrderChangeId">
          {{ change.changeSummary }}
        </div>
      </div>
      <div class="procurement-detail__actions">
        <input data-testid="purchase-order-issue-comment" v-model="issueComment" placeholder="发单备注" />
        <button data-testid="purchase-order-issue" type="button" @click="issueCurrentPurchaseOrder">
          发出
        </button>
        <input data-testid="purchase-order-ack-comment" v-model="acknowledgementComment" placeholder="确认备注" />
        <button data-testid="purchase-order-ack" type="button" @click="acknowledgeCurrentPurchaseOrder">
          供应商确认
        </button>
        <input data-testid="purchase-order-change-reason" v-model="changeReason" placeholder="变更原因" />
        <button data-testid="purchase-order-change" type="button" @click="applyCurrentPurchaseOrderChange">
          留痕变更
        </button>
        <input data-testid="purchase-order-cancel-reason" v-model="cancelReason" placeholder="取消原因" />
        <button data-testid="purchase-order-cancel" type="button" @click="cancelCurrentPurchaseOrder">
          取消
        </button>
        <input
          data-testid="purchase-order-expectation-quantity"
          v-model="expectationQuantity"
          placeholder="预期收货数量"
        />
        <button
          data-testid="purchase-order-create-expectation"
          type="button"
          @click="createCurrentReceivingExpectation"
        >
          创建收货预期
        </button>
      </div>
    </section>
  </Page>
</template>

<style scoped>
.procurement-detail {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
}

.procurement-detail__actions {
  display: grid;
  gap: 8px;
}
</style>
