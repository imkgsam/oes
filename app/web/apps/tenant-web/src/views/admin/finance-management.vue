<script setup lang="ts">
import type { FinanceApi } from '#/api'

import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { Page } from '@vben/common-ui'

import {
  allocatePaymentToReceivableApi,
  createFinancialAccountApi,
  createReceivableScheduleFromSalesOrderApi,
  getExchangeRateApi,
  getFinanceReleaseSignalApi,
  listFinancialAccountsApi,
  listReceivableSchedulesApi,
  registerCustomerFinancialAccountApi,
  setExchangeRateApi,
  setFinanceReleaseSignalApi
} from '#/api'
import { useAuthContextStore } from '#/store/auth-context'

interface FinanceFilterState {
  accountKeyword: string
  accountStatus: '' | FinanceApi.FinancialAccountStatus
  receivableKeyword: string
  receivableStatus: '' | FinanceApi.ReceivableScheduleStatus
}

const authContextStore = useAuthContextStore()
const router = useRouter()
const activeTenantId = computed(() => authContextStore.sessionContext?.tenant?.tenantId ?? '')
const activeTenantName = computed(
  () => authContextStore.sessionContext?.tenant?.name ?? authContextStore.tenantName ?? '当前租户'
)
const canListFinancialAccounts = computed(() =>
  authContextStore.actionCodes.includes('finance.financial_account.list')
)
const canCreateFinancialAccount = computed(() =>
  authContextStore.actionCodes.includes('finance.financial_account.create')
)
const canListReceivableSchedules = computed(() =>
  authContextStore.actionCodes.includes('finance.receivable_schedule.list')
)
const canRegisterCustomerAccount = computed(() =>
  authContextStore.actionCodes.includes('finance.customer_financial_account.register')
)
const canGetExchangeRate = computed(() =>
  authContextStore.actionCodes.includes('finance.exchange_rate.get')
)
const canSetExchangeRate = computed(() =>
  authContextStore.actionCodes.includes('finance.exchange_rate.set')
)
const canGetFinanceReleaseSignal = computed(() =>
  authContextStore.actionCodes.includes('finance.finance_release_signal.get')
)
const canSetFinanceReleaseSignal = computed(() =>
  authContextStore.actionCodes.includes('finance.finance_release_signal.set')
)
const canCreateReceivableSchedule = computed(() =>
  authContextStore.actionCodes.includes('finance.receivable_schedule.create_from_sales_order')
)
const canAllocatePayment = computed(() =>
  authContextStore.actionCodes.includes('finance.payment_allocation.allocate_to_receivable')
)

const filters = reactive<FinanceFilterState>({
  accountKeyword: '',
  accountStatus: '',
  receivableKeyword: '',
  receivableStatus: ''
})
const createAccountForm = reactive<FinanceApi.CreateFinancialAccountPayload>({
  accountIdentifier: '00112233',
  accountName: 'Main USD Account',
  accountType: 'BANK',
  currencyCode: 'USD',
  institutionName: 'Bank One',
  openingBalance: '1200.00',
  openingBalanceAsOf: '2026-04-28'
})
const customerAccountForm = reactive<FinanceApi.RegisterCustomerFinancialAccountPayload>({
  accountHolderName: 'Customer One',
  accountIdentifier: '99887766',
  accountProviderType: 'BANK',
  currencyCode: 'USD',
  customerTenantPartyId: 'customer-1',
  isDefault: true
})
const exchangeRateLookupForm = reactive<FinanceApi.GetExchangeRateQuery>({
  baseCurrencyCode: 'USD',
  effectiveAt: '2026-04-28T00:00:00.000Z',
  quoteCurrencyCode: 'CNY'
})
const exchangeRateWriteForm = reactive<FinanceApi.SetExchangeRatePayload>({
  baseCurrencyCode: 'USD',
  effectiveAt: '2026-04-28T00:00:00.000Z',
  quoteCurrencyCode: 'CNY',
  rateValue: '7.230000',
  setBy: 'operator-1'
})
const releaseSignalSalesOrderId = ref('so-1')
const releaseSignalPayload = reactive<FinanceApi.SetFinanceReleaseSignalPayload>({
  basedOnSummary: 'credit ok',
  customerTenantPartyId: 'customer-1',
  effectiveAt: '2026-04-28T11:30:00.000Z',
  reasonCode: 'CREDIT_OK',
  reasonSummary: 'within limit',
  signalStatus: 'RELEASED'
})
const receivableScheduleForm = reactive<FinanceApi.CreateReceivableScheduleFromSalesOrderPayload>({
  currencyCode: 'USD',
  customerSnapshot: 'Customer One',
  customerTenantPartyId: 'customer-1',
  lines: [
    {
      dueDate: '2026-05-10',
      memo: 'first milestone',
      scheduledAmount: '150.00',
      sourceSalesOrderLineId: 'so-line-1'
    }
  ],
  salesExchangeRateSnapshot: 'USD/CNY 7.20',
  salesOrderId: 'so-1'
})
const allocationForm = reactive<FinanceApi.AllocatePaymentToReceivablePayload>({
  accountTransactionId: 'txn-1',
  allocations: [
    {
      allocatedAmount: '50.00',
      receivableScheduleId: 'rs-1',
      receivableScheduleLineId: 'line-1'
    }
  ]
})

const loading = ref(false)
const financialAccounts = ref<FinanceApi.FinancialAccountSummary[]>([])
const receivableSchedules = ref<FinanceApi.ReceivableScheduleSummary[]>([])
const exchangeRate = ref<FinanceApi.ExchangeRate | null>(null)
const financeReleaseSignal = ref<FinanceApi.FinanceReleaseSignal | null>(null)
const lastCustomerAccountId = ref('')
const lastAllocationCount = ref(0)

/** loadWorkspace refreshes the finance account and receivable directories for the current tenant workspace. */
async function loadWorkspace() {
  if (!activeTenantId.value) {
    financialAccounts.value = []
    receivableSchedules.value = []
    return
  }

  loading.value = true
  try {
    const [accountResult, receivableResult] = await Promise.all([
      canListFinancialAccounts.value
        ? listFinancialAccountsApi(activeTenantId.value, {
            keyword: filters.accountKeyword.trim() || undefined,
            page: 1,
            pageSize: 20,
            status: filters.accountStatus || undefined
          })
        : Promise.resolve({ financialAccounts: [] as FinanceApi.FinancialAccountSummary[] }),
      canListReceivableSchedules.value
        ? listReceivableSchedulesApi(activeTenantId.value, {
            keyword: filters.receivableKeyword.trim() || undefined,
            page: 1,
            pageSize: 20,
            status: filters.receivableStatus || undefined
          })
        : Promise.resolve({ receivableSchedules: [] as FinanceApi.ReceivableScheduleSummary[] })
    ])

    financialAccounts.value = accountResult.financialAccounts ?? []
    receivableSchedules.value = receivableResult.receivableSchedules ?? []

    const firstSchedule = receivableSchedules.value[0]
    if (firstSchedule) {
      releaseSignalSalesOrderId.value = firstSchedule.sourceSalesOrderId || releaseSignalSalesOrderId.value
      releaseSignalPayload.customerTenantPartyId =
        firstSchedule.customerTenantPartyId || releaseSignalPayload.customerTenantPartyId
      receivableScheduleForm.salesOrderId =
        firstSchedule.sourceSalesOrderId || receivableScheduleForm.salesOrderId
      receivableScheduleForm.customerTenantPartyId =
        firstSchedule.customerTenantPartyId || receivableScheduleForm.customerTenantPartyId
      receivableScheduleForm.customerSnapshot =
        firstSchedule.customerDisplayName || receivableScheduleForm.customerSnapshot
      allocationForm.allocations[0]!.receivableScheduleId =
        firstSchedule.receivableScheduleId || allocationForm.allocations[0]!.receivableScheduleId
    }
  } finally {
    loading.value = false
  }
}

/** openFinancialAccountDetail keeps account detail interactions inside the dedicated route. */
function openFinancialAccountDetail(financialAccountId: string) {
  router.push({
    name: 'TenantFinancialAccountDetail',
    params: {
      financialAccountId
    }
  })
}

/** openReceivableScheduleDetail keeps receivable detail interactions inside the dedicated route. */
function openReceivableScheduleDetail(receivableScheduleId: string) {
  router.push({
    name: 'TenantReceivableScheduleDetail',
    params: {
      receivableScheduleId
    }
  })
}

/** createFinancialAccount submits one minimal company-account creation command and refreshes the directory. */
async function createFinancialAccount() {
  if (!activeTenantId.value) {
    return
  }

  await createFinancialAccountApi(activeTenantId.value, createAccountForm)
  await loadWorkspace()
}

/** registerCustomerAccount submits one minimal customer remittance-account registration command. */
async function registerCustomerAccount() {
  if (!activeTenantId.value) {
    return
  }

  const result = await registerCustomerFinancialAccountApi(
    activeTenantId.value,
    customerAccountForm
  )
  lastCustomerAccountId.value = result.customerFinancialAccountId
}

/** loadExchangeRate refreshes the current exchange-rate lookup result for the workspace form. */
async function loadExchangeRate() {
  if (!activeTenantId.value) {
    return
  }

  exchangeRate.value = await getExchangeRateApi(activeTenantId.value, exchangeRateLookupForm)
}

/** saveExchangeRate submits one standard FX write command and keeps the saved result visible. */
async function saveExchangeRate() {
  if (!activeTenantId.value) {
    return
  }

  exchangeRate.value = await setExchangeRateApi(activeTenantId.value, exchangeRateWriteForm)
}

/** loadFinanceReleaseSignal refreshes the finance release signal for the current sales-order input. */
async function loadFinanceReleaseSignal() {
  if (!activeTenantId.value || !releaseSignalSalesOrderId.value.trim()) {
    return
  }

  financeReleaseSignal.value = await getFinanceReleaseSignalApi(
    activeTenantId.value,
    releaseSignalSalesOrderId.value.trim()
  )
}

/** saveFinanceReleaseSignal submits one finance release signal command and keeps the saved result visible. */
async function saveFinanceReleaseSignal() {
  if (!activeTenantId.value || !releaseSignalSalesOrderId.value.trim()) {
    return
  }

  financeReleaseSignal.value = await setFinanceReleaseSignalApi(
    activeTenantId.value,
    releaseSignalSalesOrderId.value.trim(),
    releaseSignalPayload
  )
}

/** createReceivableSchedule submits one minimal receivable schedule creation command from a sales-order summary. */
async function createReceivableSchedule() {
  if (!activeTenantId.value) {
    return
  }

  await createReceivableScheduleFromSalesOrderApi(activeTenantId.value, receivableScheduleForm)
  await loadWorkspace()
}

/** allocatePayment submits one minimal receipt-allocation command against receivable lines. */
async function allocatePayment() {
  if (!activeTenantId.value) {
    return
  }

  const result = await allocatePaymentToReceivableApi(activeTenantId.value, allocationForm)
  lastAllocationCount.value = result.length
}

onMounted(() => {
  void loadWorkspace()
})
</script>

<template>
  <Page>
    <section class="finance-page">
      <header class="finance-page__hero">
        <div>
          <h1>财务管理</h1>
          <p>phase 1A 只覆盖资金账户、真实流水、客户付款账号、应收计划、收款核销、汇率与财务放行信号。</p>
        </div>
        <span class="finance-pill">{{ activeTenantName }}</span>
      </header>

      <section class="finance-card">
        <h2>目录筛选</h2>
        <div class="finance-grid finance-grid--filters">
          <input v-model="filters.accountKeyword" placeholder="账户关键词" />
          <select v-model="filters.accountStatus">
            <option value="">全部账户状态</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
            <option value="CLOSED">CLOSED</option>
          </select>
          <input v-model="filters.receivableKeyword" placeholder="应收关键词" />
          <select v-model="filters.receivableStatus">
            <option value="">全部应收状态</option>
            <option value="OPEN">OPEN</option>
            <option value="PARTIALLY_PAID">PARTIALLY_PAID</option>
            <option value="PAID">PAID</option>
          </select>
          <button type="button" @click="loadWorkspace">
            {{ loading ? '刷新中...' : '刷新目录' }}
          </button>
        </div>
      </section>

      <section class="finance-card">
        <h2>资金账户</h2>
        <table class="finance-table">
          <thead>
            <tr>
              <th>账户编号</th>
              <th>账户名称</th>
              <th>类型</th>
              <th>币种</th>
              <th>余额</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="account in financialAccounts" :key="account.financialAccountId">
              <td>{{ account.accountNo }}</td>
              <td>{{ account.accountName }}</td>
              <td>{{ account.accountType }}</td>
              <td>{{ account.currencyCode }}</td>
              <td>{{ account.currentBalance }}</td>
              <td>
                <button
                  type="button"
                  :data-testid="`finance-open-account-${account.financialAccountId}`"
                  @click="openFinancialAccountDetail(account.financialAccountId)"
                >
                  详情
                </button>
              </td>
            </tr>
            <tr v-if="!financialAccounts.length">
              <td colspan="6">暂无资金账户</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="finance-card">
        <h2>应收计划</h2>
        <table class="finance-table">
          <thead>
            <tr>
              <th>计划编号</th>
              <th>客户</th>
              <th>状态</th>
              <th>未收金额</th>
              <th>财务放行</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="schedule in receivableSchedules"
              :key="schedule.receivableScheduleId"
            >
              <td>{{ schedule.scheduleNo }}</td>
              <td>{{ schedule.customerDisplayName }}</td>
              <td>{{ schedule.status }}</td>
              <td>{{ schedule.outstandingAmount }}</td>
              <td>{{ schedule.financeReleaseStatus }}</td>
              <td>
                <button
                  type="button"
                  :data-testid="`finance-open-receivable-${schedule.receivableScheduleId}`"
                  @click="openReceivableScheduleDetail(schedule.receivableScheduleId)"
                >
                  详情
                </button>
              </td>
            </tr>
            <tr v-if="!receivableSchedules.length">
              <td colspan="6">暂无应收计划</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="finance-card finance-card--actions">
        <h2>最小操作入口</h2>
        <div class="finance-grid">
          <div v-if="canCreateFinancialAccount" class="finance-panel">
            <h3>创建资金账户</h3>
            <button data-testid="finance-create-account" type="button" @click="createFinancialAccount">
              创建账户
            </button>
          </div>

          <div v-if="canRegisterCustomerAccount" class="finance-panel">
            <h3>登记客户付款账号</h3>
            <button
              data-testid="finance-register-customer-account"
              type="button"
              @click="registerCustomerAccount"
            >
              登记账号
            </button>
            <p v-if="lastCustomerAccountId">最新登记: {{ lastCustomerAccountId }}</p>
          </div>

          <div v-if="canGetExchangeRate || canSetExchangeRate" class="finance-panel">
            <h3>汇率管理</h3>
            <div class="finance-inline-actions">
              <button
                v-if="canGetExchangeRate"
                data-testid="finance-get-exchange-rate"
                type="button"
                @click="loadExchangeRate"
              >
                查询汇率
              </button>
              <button
                v-if="canSetExchangeRate"
                data-testid="finance-set-exchange-rate"
                type="button"
                @click="saveExchangeRate"
              >
                设置汇率
              </button>
            </div>
            <p v-if="exchangeRate">
              {{ exchangeRate.baseCurrencyCode }}/{{ exchangeRate.quoteCurrencyCode }} = {{ exchangeRate.rateValue }}
            </p>
          </div>

          <div v-if="canGetFinanceReleaseSignal || canSetFinanceReleaseSignal" class="finance-panel">
            <h3>财务放行信号</h3>
            <div class="finance-inline-actions">
              <button
                v-if="canGetFinanceReleaseSignal"
                data-testid="finance-get-release-signal"
                type="button"
                @click="loadFinanceReleaseSignal"
              >
                查看信号
              </button>
              <button
                v-if="canSetFinanceReleaseSignal"
                data-testid="finance-set-release-signal"
                type="button"
                @click="saveFinanceReleaseSignal"
              >
                设置信号
              </button>
            </div>
            <p v-if="financeReleaseSignal">{{ financeReleaseSignal.signalStatus }}</p>
          </div>

          <div v-if="canCreateReceivableSchedule" class="finance-panel">
            <h3>建立应收计划</h3>
            <button
              data-testid="finance-create-receivable-schedule"
              type="button"
              @click="createReceivableSchedule"
            >
              建立计划
            </button>
          </div>

          <div v-if="canAllocatePayment" class="finance-panel">
            <h3>收款核销</h3>
            <button data-testid="finance-allocate-payment" type="button" @click="allocatePayment">
              核销收款
            </button>
            <p v-if="lastAllocationCount">新增核销条数: {{ lastAllocationCount }}</p>
          </div>
        </div>
      </section>
    </section>
  </Page>
</template>

<style scoped>
.finance-page {
  display: grid;
  gap: 16px;
}

.finance-page__hero {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}

.finance-pill {
  padding: 6px 12px;
  border: 1px solid hsl(var(--border));
  border-radius: 999px;
  background: hsl(var(--muted) / 0.45);
}

.finance-card {
  padding: 16px;
  border: 1px solid hsl(var(--border));
  border-radius: 16px;
  background: hsl(var(--card));
}

.finance-card--actions {
  background: linear-gradient(135deg, hsl(var(--card)), hsl(var(--muted) / 0.45));
}

.finance-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.finance-grid--filters {
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.finance-panel {
  padding: 12px;
  border: 1px solid hsl(var(--border));
  border-radius: 12px;
  background: hsl(var(--background) / 0.65);
}

.finance-inline-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.finance-table {
  width: 100%;
  border-collapse: collapse;
}

.finance-table th,
.finance-table td {
  padding: 10px 8px;
  border-bottom: 1px solid hsl(var(--border));
  text-align: left;
}

input,
select,
button {
  min-height: 36px;
}
</style>
