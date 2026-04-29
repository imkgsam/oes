<script setup lang="ts">
import type { FinanceApi } from '#/api'

import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'

import { Page } from '@vben/common-ui'

import {
  getFinancialAccountByIdApi,
  listAccountTransactionsApi,
  recordAccountTransactionApi,
  updateFinancialAccountBasicsApi
} from '#/api'
import { useAuthContextStore } from '#/store/auth-context'

const route = useRoute()
const authContextStore = useAuthContextStore()
const activeTenantId = computed(() => authContextStore.sessionContext?.tenant?.tenantId ?? '')
const financialAccountId = computed(() => String(route.params.financialAccountId ?? ''))
const canReadAccount = computed(() =>
  authContextStore.actionCodes.includes('finance.financial_account.get_by_id')
)
const canUpdateAccount = computed(() =>
  authContextStore.actionCodes.includes('finance.financial_account.update_basics')
)
const canListTransactions = computed(() =>
  authContextStore.actionCodes.includes('finance.account_transaction.list')
)
const canRecordTransaction = computed(() =>
  authContextStore.actionCodes.includes('finance.account_transaction.record')
)

const loading = ref(false)
const account = ref<FinanceApi.FinancialAccount | null>(null)
const transactions = ref<FinanceApi.AccountTransaction[]>([])
const accountForm = reactive<FinanceApi.UpdateFinancialAccountBasicsPayload>({
  accountName: '',
  institutionName: '',
  status: 'ACTIVE'
})
const recordForm = reactive<FinanceApi.RecordAccountTransactionPayload>({
  amount: '88.00',
  currencyCode: 'USD',
  direction: 'INFLOW',
  memo: 'manual receipt from tenant-web',
  status: 'CONFIRMED',
  transactionTime: '2026-04-28T10:15:00.000Z'
})

/** loadAccountDetail refreshes the selected account detail snapshot and its real transaction list. */
async function loadAccountDetail() {
  if (!activeTenantId.value || !financialAccountId.value || (!canReadAccount.value && !canListTransactions.value)) {
    return
  }

  loading.value = true
  try {
    if (canReadAccount.value) {
      const result = await getFinancialAccountByIdApi(activeTenantId.value, financialAccountId.value)
      account.value = result
      accountForm.accountName = result.accountName
      accountForm.institutionName = result.institutionName
      accountForm.status = result.status as FinanceApi.FinancialAccountStatus
      recordForm.currencyCode = result.currencyCode
    }

    if (canListTransactions.value) {
      const result = await listAccountTransactionsApi(activeTenantId.value, {
        financialAccountId: financialAccountId.value,
        page: 1,
        pageSize: 20
      })
      transactions.value = result.accountTransactions ?? []
    }
  } finally {
    loading.value = false
  }
}

/** updateAccount submits one minimal account-basics update command and keeps the saved snapshot visible. */
async function updateAccount() {
  if (!activeTenantId.value || !financialAccountId.value) {
    return
  }

  account.value = await updateFinancialAccountBasicsApi(
    activeTenantId.value,
    financialAccountId.value,
    accountForm
  )
  accountForm.accountName = account.value.accountName
}

/** recordTransaction submits one minimal manual real-transaction command and prepends the saved record. */
async function recordTransaction() {
  if (!activeTenantId.value || !financialAccountId.value) {
    return
  }

  const result = await recordAccountTransactionApi(
    activeTenantId.value,
    financialAccountId.value,
    recordForm
  )
  transactions.value = [result, ...transactions.value]
}

onMounted(() => {
  void loadAccountDetail()
})
</script>

<template>
  <Page>
    <section class="finance-detail-page">
      <header class="finance-detail-card">
        <h1>资金账户详情</h1>
        <p v-if="account">{{ account.accountNo }} · {{ account.accountName }}</p>
      </header>

      <section class="finance-detail-card">
        <h2>账户概览</h2>
        <div v-if="account" class="finance-detail-grid">
          <div>账户类型: {{ account.accountType }}</div>
          <div>币种: {{ account.currencyCode }}</div>
          <div>状态: {{ account.status }}</div>
          <div>当前余额: {{ account.currentBalance }}</div>
        </div>
        <p v-else-if="loading">加载中...</p>
      </section>

      <section class="finance-detail-card">
        <h2>账户流水</h2>
        <table class="finance-detail-table">
          <thead>
            <tr>
              <th>流水号</th>
              <th>方向</th>
              <th>金额</th>
              <th>状态</th>
              <th>核销状态</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="transaction in transactions" :key="transaction.accountTransactionId">
              <td>{{ transaction.accountTransactionId }}</td>
              <td>{{ transaction.direction }}</td>
              <td>{{ transaction.amount }}</td>
              <td>{{ transaction.status }}</td>
              <td>{{ transaction.allocationStatus }}</td>
            </tr>
            <tr v-if="!transactions.length">
              <td colspan="5">暂无流水</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="finance-detail-card finance-detail-card--actions">
        <h2>最小操作</h2>
        <div class="finance-detail-actions">
          <button
            v-if="canUpdateAccount"
            data-testid="finance-update-account"
            type="button"
            @click="updateAccount"
          >
            更新账户基础信息
          </button>
          <button
            v-if="canRecordTransaction"
            data-testid="finance-record-transaction"
            type="button"
            @click="recordTransaction"
          >
            手工录入流水
          </button>
        </div>
      </section>
    </section>
  </Page>
</template>

<style scoped>
.finance-detail-page {
  display: grid;
  gap: 16px;
}

.finance-detail-card {
  padding: 16px;
  border: 1px solid hsl(var(--border));
  border-radius: 16px;
  background: hsl(var(--card));
}

.finance-detail-card--actions {
  background: linear-gradient(135deg, hsl(var(--card)), hsl(var(--muted) / 0.45));
}

.finance-detail-grid {
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.finance-detail-table {
  width: 100%;
  border-collapse: collapse;
}

.finance-detail-table th,
.finance-detail-table td {
  padding: 10px 8px;
  border-bottom: 1px solid hsl(var(--border));
  text-align: left;
}

.finance-detail-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
