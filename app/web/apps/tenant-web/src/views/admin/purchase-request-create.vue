<script setup lang="ts">
import type { ProcurementApi } from '#/api'

import { computed, reactive } from 'vue'
import { useRouter } from 'vue-router'

import { Page } from '@vben/common-ui'

import { createPurchaseRequestApi } from '#/api'
import { useAuthContextStore } from '#/store/auth-context'

const authContextStore = useAuthContextStore()
const router = useRouter()
const activeTenantId = computed(() => authContextStore.sessionContext?.tenant?.tenantId ?? '')
const canCreatePurchaseRequest = computed(() =>
  authContextStore.actionCodes.includes('procurement.purchase_request.create')
)
const form = reactive<{
  line: ProcurementApi.PurchaseRequestLineInput
  reason: string
  requestType: ProcurementApi.PurchaseRequestType
  title: string
}>({
  line: {
    description: '',
    itemId: '',
    lineType: 'STANDARD_ITEM',
    requestedQuantity: '',
    uom: ''
  },
  reason: '',
  requestType: 'DEPARTMENTAL',
  title: ''
})

/** submitPurchaseRequestDraft creates one PR draft and redirects into the dedicated detail route. */
async function submitPurchaseRequestDraft() {
  if (!activeTenantId.value || !canCreatePurchaseRequest.value) {
    return
  }

  const result = await createPurchaseRequestApi(activeTenantId.value, {
    lines: [
      {
        description: form.line.description,
        itemId: form.line.itemId || undefined,
        lineType: form.line.lineType,
        requestedQuantity: form.line.requestedQuantity,
        uom: form.line.uom
      }
    ],
    reason: form.reason || undefined,
    requestType: form.requestType,
    title: form.title || undefined
  })

  if (result.purchaseRequestId) {
    router.push({
      name: 'TenantPurchaseRequestDetail',
      params: {
        purchaseRequestId: result.purchaseRequestId
      }
    })
  }
}
</script>

<template>
  <Page>
    <section class="procurement-form">
      <h1>创建采购申请</h1>
      <div class="procurement-form__grid">
        <select data-testid="purchase-request-create-type" v-model="form.requestType">
          <option value="DEPARTMENTAL">DEPARTMENTAL</option>
          <option value="SALES_DEDICATED">SALES_DEDICATED</option>
        </select>
        <input data-testid="purchase-request-create-title" v-model="form.title" placeholder="标题" />
        <input data-testid="purchase-request-create-reason" v-model="form.reason" placeholder="原因" />
        <select data-testid="purchase-request-line-type-0" v-model="form.line.lineType">
          <option value="STANDARD_ITEM">STANDARD_ITEM</option>
          <option value="TEXT">TEXT</option>
        </select>
        <input data-testid="purchase-request-line-item-id-0" v-model="form.line.itemId" placeholder="itemId" />
        <input
          data-testid="purchase-request-line-description-0"
          v-model="form.line.description"
          placeholder="描述"
        />
        <input
          data-testid="purchase-request-line-quantity-0"
          v-model="form.line.requestedQuantity"
          placeholder="数量"
        />
        <input data-testid="purchase-request-line-uom-0" v-model="form.line.uom" placeholder="UOM" />
      </div>
      <button
        v-access:code="'procurement.purchase_request.create'"
        v-if="canCreatePurchaseRequest"
        data-testid="purchase-request-create-submit"
        type="button"
        @click="submitPurchaseRequestDraft"
      >
        创建
      </button>
    </section>
  </Page>
</template>

<style scoped>
.procurement-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
}

.procurement-form__grid {
  display: grid;
  gap: 12px;
}
</style>
