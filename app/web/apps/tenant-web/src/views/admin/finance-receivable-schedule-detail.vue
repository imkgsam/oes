<script setup lang="ts">
import type { FinanceApi } from '#/api'
import type { TableColumnsType } from 'ant-design-vue'

import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

import { Page } from '@vben/common-ui'
import { Table } from 'ant-design-vue'

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
const receivableLines = computed(() => receivableSchedule.value?.lines ?? [])
const receivableLineColumns: TableColumnsType<NonNullable<FinanceApi.ReceivableSchedule['lines']>[number]> = [
  { dataIndex: 'lineNo', key: 'lineNo', title: '行号' },
  { dataIndex: 'dueDate', key: 'dueDate', title: '到期日' },
  { dataIndex: 'scheduledAmount', key: 'scheduledAmount', title: '计划金额' },
  { dataIndex: 'allocatedAmount', key: 'allocatedAmount', title: '已核销' },
  { dataIndex: 'outstandingAmount', key: 'outstandingAmount', title: '未收' },
  { dataIndex: 'status', key: 'status', title: '状态' }
]
const paymentAllocationColumns: TableColumnsType<FinanceApi.PaymentAllocation> = [
  { dataIndex: 'paymentAllocationId', key: 'paymentAllocationId', title: '核销号' },
  { dataIndex: 'accountTransactionId', key: 'accountTransactionId', title: '流水号' },
  { dataIndex: 'allocatedAmount', key: 'allocatedAmount', title: '金额' },
  { dataIndex: 'targetScheduleLineId', key: 'targetScheduleLineId', title: '目标计划行' }
]

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
        <Table
          :columns="receivableLineColumns"
          :data-source="receivableLines"
          :loading="loading"
          :locale="{ emptyText: '暂无计划行' }"
          :pagination="false"
          row-key="receivableScheduleLineId"
          size="middle"
        />
      </section>

      <section class="receivable-detail-card">
        <h2>财务放行与核销</h2>
        <p v-if="financeReleaseSignal">
          当前放行信号: {{ financeReleaseSignal.signalStatus }}
        </p>
        <Table
          :columns="paymentAllocationColumns"
          :data-source="paymentAllocations"
          :loading="loading"
          :locale="{ emptyText: '暂无核销记录' }"
          :pagination="false"
          row-key="paymentAllocationId"
          size="middle"
        />
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

</style>
