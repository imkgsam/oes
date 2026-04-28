<script setup lang="ts">
import type { ProcurementApi } from '#/api'

import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

import { Page } from '@vben/common-ui'

import {
  getReceivingExpectationByIdApi,
  recordReceivingDiscrepancyResolutionApi
} from '#/api'
import { useAuthContextStore } from '#/store/auth-context'

const authContextStore = useAuthContextStore()
const route = useRoute()
const activeTenantId = computed(() => authContextStore.sessionContext?.tenant?.tenantId ?? '')
const receivingExpectation = ref<null | ProcurementApi.ReceivingExpectation>(null)
const resolutionCode = ref<ProcurementApi.ReceivingResolutionCode>('WAIT_REDELIVERY')
const resolutionNote = ref('')

/** loadReceivingExpectation refreshes the current receiving expectation detail snapshot. */
async function loadReceivingExpectation() {
  if (!activeTenantId.value) {
    return
  }

  receivingExpectation.value = await getReceivingExpectationByIdApi(
    activeTenantId.value,
    String(route.params.receivingExpectationId ?? '')
  )
}

/** recordResolution stores one procurement discrepancy resolution summary without widening into WMS receipt truth. */
async function recordResolution() {
  if (
    !activeTenantId.value ||
    !receivingExpectation.value?.discrepancy?.receivingDiscrepancyId
  ) {
    return
  }

  const result = await recordReceivingDiscrepancyResolutionApi(
    activeTenantId.value,
    String(route.params.receivingExpectationId ?? ''),
    receivingExpectation.value.discrepancy.receivingDiscrepancyId,
    {
      auditReason: 'resolution from tenant-web receiving expectation detail',
      resolutionCode: resolutionCode.value,
      resolutionNote: resolutionNote.value || undefined
    }
  )

  if (result?.receivingExpectation) {
    receivingExpectation.value = result.receivingExpectation
  }
}

onMounted(() => {
  void loadReceivingExpectation()
})
</script>

<template>
  <Page>
    <section class="procurement-detail">
      <h1>收货预期详情</h1>
      <p v-if="receivingExpectation?.discrepancy">{{ receivingExpectation.discrepancy.summary }}</p>
      <div class="procurement-detail__actions">
        <select data-testid="receiving-resolution-code" v-model="resolutionCode">
          <option value="WAIT_REDELIVERY">WAIT_REDELIVERY</option>
          <option value="ACCEPT_SHORT_CLOSE">ACCEPT_SHORT_CLOSE</option>
          <option value="RETURN_OR_REJECT_EXCESS">RETURN_OR_REJECT_EXCESS</option>
          <option value="MANUAL_FOLLOW_UP">MANUAL_FOLLOW_UP</option>
        </select>
        <input data-testid="receiving-resolution-note" v-model="resolutionNote" placeholder="处理说明" />
        <button data-testid="receiving-resolution-submit" type="button" @click="recordResolution">
          记录处理摘要
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
