<script setup lang="ts">
import type { FinanceApi } from '#/api'

import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

import { Page } from '@vben/common-ui'

import {
  getFinanceReleaseSignalApi,
  getReceivableScheduleByIdApi,
  listPaymentAllocationsApi
} from '#/api'
import { useAuthContextStore } from '#/store/auth-context'

const route = useRoute()
const authContextStore = useAuthContextStore()
const activeTenantId = computed(() => authContextStore.sessionContext?.tenant?.tenantId ?? '')
const receivableScheduleId = computed(() => String(route.params.receivableScheduleId ?? ''))
const canReadReceivable = computed(() =>
  authContextStore.actionCodes.includes('finance.receivable_schedule.get_by_id')
)
const canReadFinanceReleaseSignal = computed(() =>
  authContextStore.actionCodes.includes('finance.finance_release_signal.get')
)
const canListAllocations = computed(() =>
  authContextStore.actionCodes.includes('finance.payment_allocation.list')
)

const loading = ref(false)
const receivableSchedule = ref<FinanceApi.ReceivableSchedule | null>(null)
const financeReleaseSignal = ref<FinanceApi.FinanceReleaseSignal | null>(null)
const paymentAllocations = ref<FinanceApi.PaymentAllocation[]>([])

/** loadReceivableDetail refreshes the selected receivable schedule and its linked finance summary reads. */
async function loadReceivableDetail() {
  if (!activeTenantId.value || !receivableScheduleId.value || !canReadReceivable.value) {
    return
  }

  loading.value = true
  try {
    receivableSchedule.value = await getReceivableScheduleByIdApi(
      activeTenantId.value,
      receivableScheduleId.value
    )

    if (canReadFinanceReleaseSignal.value && receivableSchedule.value?.sourceSalesOrderId) {
      financeReleaseSignal.value = await getFinanceReleaseSignalApi(
        activeTenantId.value,
        receivableSchedule.value.sourceSalesOrderId
      )
    }

    if (canListAllocations.value) {
      const result = await listPaymentAllocationsApi(activeTenantId.value, {
        page: 1,
        pageSize: 20,
        receivableScheduleId: receivableScheduleId.value
      })
      paymentAllocations.value = result.paymentAllocations ?? []
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void loadReceivableDetail()
})
</script>

<template>
  <Page>
    <section class="receivable-detail-page">
      <header class="receivable-detail-card">
        <h1>应收计划详情</h1>
        <p v-if="receivableSchedule">{{ receivableSchedule.scheduleNo }} · {{ receivableSchedule.status }}</p>
        <p v-else-if="loading">加载中...</p>
      </header>

      <section class="receivable-detail-card">
        <h2>计划明细</h2>
        <div v-if="receivableSchedule" class="receivable-detail-summary">
          <div>客户: {{ receivableSchedule.customerSnapshot }}</div>
          <div>来源订单: {{ receivableSchedule.sourceSalesOrderId }}</div>
          <div>未收金额: {{ receivableSchedule.outstandingAmount }}</div>
        </div>
        <table class="receivable-detail-table">
          <thead>
            <tr>
              <th>行号</th>
              <th>到期日</th>
              <th>计划金额</th>
              <th>已核销</th>
              <th>未收</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="line in receivableSchedule?.lines ?? []"
              :key="line.receivableScheduleLineId"
            >
              <td>{{ line.lineNo }}</td>
              <td>{{ line.dueDate }}</td>
              <td>{{ line.scheduledAmount }}</td>
              <td>{{ line.allocatedAmount }}</td>
              <td>{{ line.outstandingAmount }}</td>
              <td>{{ line.status }}</td>
            </tr>
            <tr v-if="!(receivableSchedule?.lines?.length ?? 0)">
              <td colspan="6">暂无计划行</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="receivable-detail-card">
        <h2>财务放行与核销</h2>
        <p v-if="financeReleaseSignal">
          当前放行信号: {{ financeReleaseSignal.signalStatus }}
        </p>
        <table class="receivable-detail-table">
          <thead>
            <tr>
              <th>核销号</th>
              <th>流水号</th>
              <th>金额</th>
              <th>目标计划行</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="allocation in paymentAllocations"
              :key="allocation.paymentAllocationId"
            >
              <td>{{ allocation.paymentAllocationId }}</td>
              <td>{{ allocation.accountTransactionId }}</td>
              <td>{{ allocation.allocatedAmount }}</td>
              <td>{{ allocation.targetScheduleLineId }}</td>
            </tr>
            <tr v-if="!paymentAllocations.length">
              <td colspan="4">暂无核销记录</td>
            </tr>
          </tbody>
        </table>
      </section>
    </section>
  </Page>
</template>

<style scoped>
.receivable-detail-page {
  display: grid;
  gap: 16px;
}

.receivable-detail-card {
  padding: 16px;
  border: 1px solid hsl(var(--border));
  border-radius: 16px;
  background: hsl(var(--card));
}

.receivable-detail-summary {
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  margin-bottom: 12px;
}

.receivable-detail-table {
  width: 100%;
  border-collapse: collapse;
}

.receivable-detail-table th,
.receivable-detail-table td {
  padding: 10px 8px;
  border-bottom: 1px solid hsl(var(--border));
  text-align: left;
}
</style>
