<script setup lang="ts">
import type { ProcurementApi } from '#/api'

import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { Page } from '@vben/common-ui'

import {
  cancelPurchaseRequestApi,
  convertPurchaseRequestToPurchaseOrderApi,
  decidePurchaseRequestApi,
  getPurchaseRequestByIdApi,
  submitPurchaseRequestApi
} from '#/api'
import { useAuthContextStore } from '#/store/auth-context'

const authContextStore = useAuthContextStore()
const route = useRoute()
const router = useRouter()
const activeTenantId = computed(() => authContextStore.sessionContext?.tenant?.tenantId ?? '')
const purchaseRequest = ref<null | ProcurementApi.PurchaseRequest>(null)
const submitComment = ref('')
const decisionComment = ref('')
const cancelReason = ref('')
const convertForm = reactive({
  currencyCode: '',
  supplierId: ''
})
const canView = computed(() =>
  authContextStore.actionCodes.includes('procurement.purchase_request.get_by_id')
)

/** loadPurchaseRequest refreshes the current PR detail snapshot for phase 1 actions. */
async function loadPurchaseRequest() {
  if (!activeTenantId.value || !canView.value) {
    return
  }

  purchaseRequest.value = await getPurchaseRequestByIdApi(
    activeTenantId.value,
    String(route.params.purchaseRequestId ?? '')
  )
}

/** submitPurchaseRequest forwards the current PR submission command with a minimal audit reason. */
async function submitCurrentPurchaseRequest() {
  if (!activeTenantId.value) {
    return
  }

  const result = await submitPurchaseRequestApi(
    activeTenantId.value,
    String(route.params.purchaseRequestId ?? ''),
    {
      auditReason: 'submit from tenant-web purchase request detail',
      submissionComment: submitComment.value || undefined
    }
  )

  if (result) {
    purchaseRequest.value = result
  }
}

/** approvePurchaseRequest forwards the current PR decision command with the frozen APPROVED semantic only. */
async function approveCurrentPurchaseRequest() {
  if (!activeTenantId.value) {
    return
  }

  const result = await decidePurchaseRequestApi(
    activeTenantId.value,
    String(route.params.purchaseRequestId ?? ''),
    {
      auditReason: 'decision from tenant-web purchase request detail',
      comment: decisionComment.value || undefined,
      decision: 'APPROVED'
    }
  )

  if (result) {
    purchaseRequest.value = result
  }
}

/** cancelCurrentPurchaseRequest forwards the current PR cancel command with a minimal audit reason. */
async function cancelCurrentPurchaseRequest() {
  if (!activeTenantId.value) {
    return
  }

  const result = await cancelPurchaseRequestApi(
    activeTenantId.value,
    String(route.params.purchaseRequestId ?? ''),
    {
      auditReason: 'cancel from tenant-web purchase request detail',
      cancelReason: cancelReason.value
    }
  )

  if (result) {
    purchaseRequest.value = result
  }
}

/** convertCurrentPurchaseRequest forwards the selected PR lines into one PO draft conversion and opens the new PO detail route. */
async function convertCurrentPurchaseRequest() {
  if (!activeTenantId.value || !purchaseRequest.value) {
    return
  }

  const result = await convertPurchaseRequestToPurchaseOrderApi(
    activeTenantId.value,
    String(route.params.purchaseRequestId ?? ''),
    {
      auditReason: 'convert from tenant-web purchase request detail',
      currencyCode: convertForm.currencyCode,
      selectedLines: purchaseRequest.value.lines.map((line) => ({
        purchaseOrderQuantity: line.requestedQuantity,
        purchaseRequestLineId: line.purchaseRequestLineId
      })),
      supplierId: convertForm.supplierId
    }
  )

  if (result.purchaseOrderId) {
    router.push({
      name: 'TenantPurchaseOrderDetail',
      params: {
        purchaseOrderId: result.purchaseOrderId
      }
    })
  }
}

onMounted(() => {
  void loadPurchaseRequest()
})
</script>

<template>
  <Page>
    <section class="procurement-detail">
      <h1>采购申请详情</h1>
      <p v-if="purchaseRequest">{{ purchaseRequest.requestNo }}</p>
      <ul v-if="purchaseRequest">
        <li v-for="line in purchaseRequest.lines" :key="line.purchaseRequestLineId">
          {{ line.itemCode || line.description }} / {{ line.requestedQuantity }}
        </li>
      </ul>
      <div class="procurement-detail__actions">
        <input data-testid="purchase-request-submit-comment" v-model="submitComment" placeholder="提交备注" />
        <button data-testid="purchase-request-submit" type="button" @click="submitCurrentPurchaseRequest">
          提交
        </button>
        <input data-testid="purchase-request-decision-comment" v-model="decisionComment" placeholder="审批备注" />
        <button data-testid="purchase-request-approve" type="button" @click="approveCurrentPurchaseRequest">
          审批
        </button>
        <input data-testid="purchase-request-cancel-reason" v-model="cancelReason" placeholder="取消原因" />
        <button data-testid="purchase-request-cancel" type="button" @click="cancelCurrentPurchaseRequest">
          取消
        </button>
        <input
          data-testid="purchase-request-convert-supplier-id"
          v-model="convertForm.supplierId"
          placeholder="supplierId"
        />
        <input
          data-testid="purchase-request-convert-currency"
          v-model="convertForm.currencyCode"
          placeholder="币种"
        />
        <button data-testid="purchase-request-convert" type="button" @click="convertCurrentPurchaseRequest">
          转 PO
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
