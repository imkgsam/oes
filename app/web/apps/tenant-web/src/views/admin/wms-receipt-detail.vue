<script setup lang="ts">
import type { WmsApi } from '#/api'

import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'

import { Page } from '@vben/common-ui'

import {
  cancelReceiptDraftApi,
  getReceiptByIdApi,
  postReceiptApi,
  replaceReceiptLinesApi
} from '#/api'
import { useAuthContextStore } from '#/store/auth-context'

interface EditableReceiptLine {
  confirmedQuantity: string
  inventoryStatus: WmsApi.InventoryStatus
  itemId: string
  receiptLineId?: string
  restrictedReasonCode?: WmsApi.RestrictedReasonCode
  targetLocationId: string
  uom: string
}

const authContextStore = useAuthContextStore()
const route = useRoute()
const activeTenantId = computed(() => authContextStore.sessionContext?.tenant?.tenantId ?? '')
const canReadReceipt = computed(() => authContextStore.actionCodes.includes('wms.receipt.read'))
const canManageReceipt = computed(() =>
  authContextStore.actionCodes.includes('wms.receipt.manage')
)
const receipt = ref<null | WmsApi.Receipt>(null)
const editableLines = reactive<EditableReceiptLine[]>([])

/** hydrateEditableLines mirrors the current receipt lines into a lightweight draft editor without inventing extra WMS semantics. */
function hydrateEditableLines(currentReceipt: WmsApi.Receipt) {
  editableLines.splice(
    0,
    editableLines.length,
    ...currentReceipt.lines.map((line) => ({
      confirmedQuantity: line.confirmedQuantity,
      inventoryStatus: (line.inventoryStatus as WmsApi.InventoryStatus) || 'AVAILABLE',
      itemId: line.itemId,
      receiptLineId: line.receiptLineId,
      restrictedReasonCode: line.restrictedReason?.reasonCode as WmsApi.RestrictedReasonCode | undefined,
      targetLocationId: line.targetLocationId,
      uom: line.uom
    }))
  )
}

/** loadReceipt refreshes the current receipt detail snapshot. */
async function loadReceipt() {
  if (!activeTenantId.value || !canReadReceipt.value) {
    return
  }

  const result = await getReceiptByIdApi(activeTenantId.value, String(route.params.receiptId ?? ''))
  receipt.value = result
  hydrateEditableLines(result)
}

/** saveLines full-replaces the current draft lines using the lightweight editor payload. */
async function saveLines() {
  if (!activeTenantId.value || !receipt.value || !canManageReceipt.value) {
    return
  }

  const result = await replaceReceiptLinesApi(activeTenantId.value, receipt.value.receiptId, {
    auditReason: 'edit receipt draft lines from tenant-web',
    lines: editableLines.map((line) => ({
      confirmedQuantity: line.confirmedQuantity,
      inventoryStatus: line.inventoryStatus,
      itemId: line.itemId,
      receiptLineId: line.receiptLineId,
      restrictedReason:
        line.inventoryStatus === 'RESTRICTED' && line.restrictedReasonCode
          ? {
              reasonCode: line.restrictedReasonCode
            }
          : undefined,
      targetLocationId: line.targetLocationId,
      uom: line.uom
    }))
  })

  receipt.value = result
  hydrateEditableLines(result)
}

/** postReceipt transitions the current receipt from draft into posted state through the BFF command surface. */
async function postReceipt() {
  if (!activeTenantId.value || !receipt.value || !canManageReceipt.value) {
    return
  }

  receipt.value = await postReceiptApi(activeTenantId.value, receipt.value.receiptId, {
    auditReason: 'post receipt from tenant-web',
    postComment: undefined
  })
}

/** cancelDraft transitions the current receipt draft into cancelled state through the BFF command surface. */
async function cancelDraft() {
  if (!activeTenantId.value || !receipt.value || !canManageReceipt.value) {
    return
  }

  receipt.value = await cancelReceiptDraftApi(activeTenantId.value, receipt.value.receiptId, {
    auditReason: 'cancel receipt draft from tenant-web',
    cancelReason: 'cancelled from tenant-web receipt detail'
  })
}

/** discrepancySummary exposes a lightweight UI summary of the physical discrepancy facts already returned by WMS. */
const discrepancySummary = computed(() =>
  (receipt.value?.lines ?? [])
    .filter((line) => line.physicalDiscrepancy?.discrepancyType)
    .map((line) => ({
      discrepancyQuantity: line.physicalDiscrepancy?.discrepancyQuantity ?? '',
      discrepancyType: line.physicalDiscrepancy?.discrepancyType ?? 'UNSPECIFIED',
      lineNo: line.lineNo,
      note: line.physicalDiscrepancy?.note ?? ''
    }))
)

onMounted(() => {
  void loadReceipt()
})
</script>

<template>
  <Page>
    <section class="wms-receipt-detail">
      <header>
        <h1>收货详情</h1>
        <p v-if="receipt">{{ receipt.receiptNo }} / {{ receipt.status }}</p>
      </header>

      <section class="wms-receipt-card">
        <h2>Physical Discrepancy Summary</h2>
        <ul>
          <li v-for="entry in discrepancySummary" :key="`${entry.lineNo}-${entry.discrepancyType}`">
            Line {{ entry.lineNo }} - {{ entry.discrepancyType }} - {{ entry.discrepancyQuantity || '-' }}
          </li>
          <li v-if="!discrepancySummary.length">暂无 physical discrepancy</li>
        </ul>
      </section>

      <section class="wms-receipt-card">
        <h2>Draft Lines</h2>
        <div v-for="(line, index) in editableLines" :key="line.receiptLineId || index" class="wms-line-row">
          <input :data-testid="`wms-receipt-line-${index}-item-id`" v-model="line.itemId" placeholder="itemId" />
          <input :data-testid="`wms-receipt-line-${index}-quantity`" v-model="line.confirmedQuantity" placeholder="quantity" />
          <input v-model="line.targetLocationId" placeholder="targetLocationId" />
          <input v-model="line.uom" placeholder="uom" />
          <select v-model="line.inventoryStatus">
            <option value="AVAILABLE">AVAILABLE</option>
            <option value="RESTRICTED">RESTRICTED</option>
          </select>
          <select
            :data-testid="`wms-receipt-line-${index}-restricted-reason`"
            v-model="line.restrictedReasonCode"
          >
            <option :value="undefined">无受限原因</option>
            <option value="DAMAGED">DAMAGED</option>
            <option value="QUALITY_HOLD">QUALITY_HOLD</option>
          </select>
        </div>
        <div class="wms-receipt-actions">
          <button
            v-access:code="'wms.receipt.manage'"
            v-if="canManageReceipt"
            data-testid="wms-receipt-save-lines"
            type="button"
            @click="saveLines"
          >
            保存草稿行
          </button>
          <button
            v-access:code="'wms.receipt.manage'"
            v-if="canManageReceipt"
            data-testid="wms-receipt-post"
            type="button"
            @click="postReceipt"
          >
            过账
          </button>
          <button
            v-access:code="'wms.receipt.manage'"
            v-if="canManageReceipt"
            data-testid="wms-receipt-cancel"
            type="button"
            @click="cancelDraft"
          >
            取消草稿
          </button>
        </div>
      </section>
    </section>
  </Page>
</template>

<style scoped>
.wms-receipt-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
}

.wms-receipt-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border: 1px solid #d7dfef;
  border-radius: 14px;
}

.wms-line-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 8px;
}

.wms-receipt-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
