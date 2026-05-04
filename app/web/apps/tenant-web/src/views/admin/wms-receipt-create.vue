<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useRouter } from 'vue-router'

import { Page } from '@vben/common-ui'

import { createReceiptDraftApi } from '#/api'
import { useAuthContextStore } from '#/store/auth-context'

interface ReceiptCreateFormState {
  note: string
  orgId: string
  receiptDate: string
  receiptSourceType: 'MANUAL' | 'RECEIVING_EXPECTATION_REFERENCE'
  warehouseId: string
}

const authContextStore = useAuthContextStore()
const router = useRouter()
const activeTenantId = computed(() => authContextStore.sessionContext?.tenant?.tenantId ?? '')
const canManageReceipt = computed(() =>
  authContextStore.actionCodes.includes('wms.receipt.manage')
)
const form = reactive<ReceiptCreateFormState>({
  note: '',
  orgId: '',
  receiptDate: '',
  receiptSourceType: 'MANUAL',
  warehouseId: ''
})

/** createReceiptDraft creates one lightweight WMS receipt draft header and redirects into the dedicated receipt detail flow. */
async function createReceiptDraft() {
  if (!activeTenantId.value || !form.warehouseId.trim() || !canManageReceipt.value) {
    return
  }

  const receipt = await createReceiptDraftApi(activeTenantId.value, {
    note: form.note.trim() || undefined,
    orgId: form.orgId.trim() || undefined,
    receiptDate: form.receiptDate || undefined,
    receiptSourceType: form.receiptSourceType,
    warehouseId: form.warehouseId.trim()
  })

  await router.push({
    name: 'TenantWmsReceiptDetail',
    params: {
      receiptId: receipt.receiptId
    }
  })
}
</script>

<template>
  <Page>
    <section class="wms-receipt-create">
      <h1>创建收货草稿</h1>
      <div class="wms-receipt-create__form">
        <input v-model="form.warehouseId" placeholder="warehouseId" />
        <input v-model="form.orgId" placeholder="orgId（可选）" />
        <input v-model="form.receiptDate" placeholder="receiptDate（YYYY-MM-DD）" />
        <select v-model="form.receiptSourceType">
          <option value="MANUAL">MANUAL</option>
          <option value="RECEIVING_EXPECTATION_REFERENCE">RECEIVING_EXPECTATION_REFERENCE</option>
        </select>
        <input v-model="form.note" placeholder="备注" />
        <button
          v-access:code="'wms.receipt.manage'"
          v-if="canManageReceipt"
          type="button"
          @click="createReceiptDraft"
        >
          创建并进入详情
        </button>
      </div>
    </section>
  </Page>
</template>

<style scoped>
.wms-receipt-create {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
}

.wms-receipt-create__form {
  display: grid;
  gap: 8px;
  max-width: 520px;
}
</style>
