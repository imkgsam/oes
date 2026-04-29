import { requestClient } from '#/api/request'

export namespace FinanceApi {
  export type FinancialAccountType =
    | 'ALIPAY'
    | 'BANK'
    | 'CASH'
    | 'OTHER_PSP'
    | 'PAYPAL'
    | 'STRIPE'
    | 'WECHAT'
  export type FinancialAccountStatus = 'ACTIVE' | 'CLOSED' | 'INACTIVE'
  export type AccountTransactionDirection = 'INFLOW' | 'OUTFLOW'
  export type AccountTransactionSourceType = 'CSV_IMPORT' | 'FUTURE_API' | 'MANUAL'
  export type AccountTransactionStatus = 'CONFIRMED' | 'DRAFT' | 'VOIDED'
  export type AccountTransactionAllocationStatus =
    | 'FULLY_ALLOCATED'
    | 'PARTIALLY_ALLOCATED'
    | 'UNALLOCATED'
  export type CustomerFinancialAccountProviderType =
    | 'ALIPAY'
    | 'BANK'
    | 'OTHER'
    | 'PAYPAL'
    | 'STRIPE'
    | 'WECHAT'
  export type FinanceReleaseSignalStatus = 'HELD' | 'RELEASED' | 'REVIEW_REQUIRED'
  export type ReceivableScheduleStatus =
    | 'CANCELLED'
    | 'ON_HOLD'
    | 'OPEN'
    | 'PAID'
    | 'PARTIALLY_PAID'
  export type ReceivableScheduleLineStatus =
    | 'CANCELLED'
    | 'OPEN'
    | 'OVERDUE'
    | 'PAID'
    | 'PARTIALLY_PAID'

  export interface FinancialAccountSummary {
    accountName: string
    accountNo: string
    accountType: FinancialAccountType | string
    currencyCode: string
    currentBalance: string
    financialAccountId: string
    lastTransactionAt: string
    status: FinancialAccountStatus | string
  }

  export interface FinancialAccount extends FinancialAccountSummary {
    accountIdentifierMasked: string
    createdAt: string
    institutionName: string
    orgId: string
    tenantId: string
    updatedAt: string
  }

  export interface FinancialAccountListQuery {
    accountType?: FinancialAccountType
    currencyCode?: string
    keyword?: string
    orgId?: string
    page?: number
    pageSize?: number
    status?: FinancialAccountStatus
  }

  export interface FinancialAccountListResult {
    financialAccounts: FinancialAccountSummary[]
    page: number
    pageSize: number
    total: number
  }

  export interface CreateFinancialAccountPayload {
    accountIdentifier: string
    accountName: string
    accountType: FinancialAccountType
    currencyCode: string
    institutionName?: string
    openingBalance?: string
    openingBalanceAsOf?: string
    orgId?: string
  }

  export interface UpdateFinancialAccountBasicsPayload {
    accountIdentifier?: string
    accountName: string
    auditReason?: string
    institutionName?: string
    status: FinancialAccountStatus
  }

  export interface AccountTransaction {
    accountTransactionId: string
    allocatedAmount: string
    allocationStatus: AccountTransactionAllocationStatus | string
    amount: string
    attachmentRef: string
    counterpartyAccountSnapshot: string
    counterpartyName: string
    createdAt: string
    currencyCode: string
    direction: AccountTransactionDirection | string
    externalReference: string
    fileAssetId: string
    financialAccountId: string
    memo: string
    paymentExecutionId: string
    sourceType: AccountTransactionSourceType | string
    status: AccountTransactionStatus | string
    transactionTime: string
    unallocatedAmount: string
    valueDate: string
  }

  export interface AccountTransactionListQuery {
    allocationStatus?: AccountTransactionAllocationStatus
    direction?: AccountTransactionDirection
    externalReference?: string
    financialAccountId?: string
    occurredFrom?: string
    occurredTo?: string
    orgId?: string
    page?: number
    pageSize?: number
    sourceType?: AccountTransactionSourceType
  }

  export interface AccountTransactionListResult {
    accountTransactions: AccountTransaction[]
    page: number
    pageSize: number
    total: number
  }

  export interface ImportAccountTransactionInput {
    amount: string
    counterpartyAccountSnapshot?: string
    counterpartyName?: string
    currencyCode: string
    direction: AccountTransactionDirection
    externalReference?: string
    memo?: string
    transactionTime: string
    valueDate?: string
  }

  export interface ImportBatchSummary {
    acceptedCount: number
    accountTransactionImportBatchId: string
    attachmentRef: string
    duplicateCount: number
    failedCount: number
    fileAssetId: string
    sourceBatchReference: string
    sourceType: string
    totalRows: number
  }

  export interface ImportAccountTransactionsPayload {
    attachmentRef?: string
    auditReason?: string
    fileAssetId?: string
    importedBy?: string
    sourceBatchReference?: string
    sourceType?: AccountTransactionSourceType
    transactions: ImportAccountTransactionInput[]
  }

  export interface ImportAccountTransactionsResult {
    accountTransactionIds: string[]
    batch?: ImportBatchSummary
  }

  export interface RecordAccountTransactionPayload {
    amount: string
    attachmentRef?: string
    auditReason?: string
    counterpartyAccountSnapshot?: string
    counterpartyName?: string
    currencyCode: string
    direction: AccountTransactionDirection
    externalReference?: string
    fileAssetId?: string
    memo?: string
    sourceType?: AccountTransactionSourceType
    status?: AccountTransactionStatus
    transactionTime: string
    valueDate?: string
  }

  export interface CustomerFinancialAccount {
    accountHolderName: string
    accountIdentifierMasked: string
    accountProviderType: CustomerFinancialAccountProviderType | string
    currencyCode: string
    customerFinancialAccountId: string
    customerTenantPartyId: string
    isDefault: boolean
    verifiedStatus: 'UNVERIFIED' | 'VERIFIED'
  }

  export interface RegisterCustomerFinancialAccountPayload {
    accountHolderName: string
    accountIdentifier: string
    accountProviderType: CustomerFinancialAccountProviderType
    auditReason?: string
    currencyCode?: string
    customerTenantPartyId: string
    isDefault?: boolean
  }

  export interface ExchangeRate {
    baseCurrencyCode: string
    effectiveAt: string
    exchangeRateId: string
    quoteCurrencyCode: string
    rateValue: string
    setBy: string
    tenantId: string
    updatedAt: string
  }

  export interface GetExchangeRateQuery {
    baseCurrencyCode: string
    effectiveAt?: string
    quoteCurrencyCode: string
  }

  export interface SetExchangeRatePayload {
    auditReason?: string
    baseCurrencyCode: string
    effectiveAt: string
    quoteCurrencyCode: string
    rateValue: string
    setBy?: string
  }

  export interface ReceivableScheduleSummary {
    currencyCode: string
    customerDisplayName: string
    customerTenantPartyId: string
    financeReleaseStatus: FinanceReleaseSignalStatus | string
    nearestDueDate: string
    outstandingAmount: string
    receivableScheduleId: string
    scheduleNo: string
    sourceSalesOrderId: string
    status: ReceivableScheduleStatus | string
  }

  export interface ReceivableScheduleLine {
    allocatedAmount: string
    dueDate: string
    lineNo: number
    memo: string
    outstandingAmount: string
    receivableScheduleLineId: string
    scheduledAmount: string
    sourceSalesOrderLineId: string
    status: ReceivableScheduleLineStatus | string
  }

  export interface ReceivableSchedule {
    createdAt: string
    currencyCode: string
    customerSnapshot: string
    customerTenantPartyId: string
    lines: ReceivableScheduleLine[]
    orgId: string
    outstandingAmount: string
    receivableScheduleId: string
    salesExchangeRateSnapshot: string
    scheduleNo: string
    sourceSalesOrderId: string
    status: ReceivableScheduleStatus | string
    tenantId: string
    totalAllocatedAmount: string
    totalScheduledAmount: string
    updatedAt: string
  }

  export interface ReceivableScheduleListQuery {
    customerTenantPartyId?: string
    dueFrom?: string
    dueTo?: string
    financeReleaseStatus?: FinanceReleaseSignalStatus
    keyword?: string
    orgId?: string
    overdueOnly?: boolean
    page?: number
    pageSize?: number
    sourceSalesOrderId?: string
    status?: ReceivableScheduleStatus
  }

  export interface ReceivableScheduleListResult {
    page: number
    pageSize: number
    receivableSchedules: ReceivableScheduleSummary[]
    total: number
  }

  export interface CreateReceivableScheduleLineInput {
    dueDate: string
    memo?: string
    scheduledAmount: string
    sourceSalesOrderLineId?: string
  }

  export interface CreateReceivableScheduleFromSalesOrderPayload {
    auditReason?: string
    currencyCode: string
    customerSnapshot: string
    customerTenantPartyId: string
    lines: CreateReceivableScheduleLineInput[]
    orgId?: string
    salesExchangeRateSnapshot?: string
    salesOrderId: string
  }

  export interface FinanceReleaseSignal {
    basedOnSummary: string
    customerTenantPartyId: string
    effectiveAt: string
    expiresAt: string
    financeReleaseSignalId: string
    reasonCode: string
    reasonSummary: string
    salesOrderId: string
    signalStatus: FinanceReleaseSignalStatus | string
    tenantId: string
    updatedAt: string
  }

  export interface SetFinanceReleaseSignalPayload {
    auditReason?: string
    basedOnSummary?: string
    customerTenantPartyId: string
    effectiveAt: string
    expiresAt?: string
    reasonCode?: string
    reasonSummary?: string
    signalStatus: FinanceReleaseSignalStatus
  }

  export interface PaymentAllocation {
    accountTransactionId: string
    allocatedAmount: string
    allocatedAt: string
    currencyCode: string
    paymentAllocationId: string
    paymentExecutionId: string
    targetScheduleId: string
    targetScheduleLineId: string
    targetType: string
  }

  export interface PaymentAllocationListQuery {
    accountTransactionId?: string
    page?: number
    pageSize?: number
    receivableScheduleId?: string
    receivableScheduleLineId?: string
  }

  export interface PaymentAllocationListResult {
    page: number
    pageSize: number
    paymentAllocations: PaymentAllocation[]
    total: number
  }

  export interface AllocatePaymentToReceivableItem {
    allocatedAmount: string
    receivableScheduleId: string
    receivableScheduleLineId: string
  }

  export interface AllocatePaymentToReceivablePayload {
    accountTransactionId: string
    allocations: AllocatePaymentToReceivableItem[]
    auditReason?: string
  }
}

// Lists finance company accounts for the tenant finance workspace.
export async function listFinancialAccountsApi(
  tenantId: string,
  query: FinanceApi.FinancialAccountListQuery
) {
  return requestClient.get<FinanceApi.FinancialAccountListResult>(
    `/finance/tenants/${tenantId}/accounts`,
    { params: query }
  )
}

// Loads one finance company-account detail snapshot by id.
export async function getFinancialAccountByIdApi(tenantId: string, financialAccountId: string) {
  return requestClient.get<FinanceApi.FinancialAccount>(
    `/finance/tenants/${tenantId}/accounts/${financialAccountId}`
  )
}

// Creates one finance company account.
export async function createFinancialAccountApi(
  tenantId: string,
  payload: FinanceApi.CreateFinancialAccountPayload
) {
  return requestClient.post<FinanceApi.FinancialAccount>(
    `/finance/tenants/${tenantId}/accounts`,
    payload
  )
}

// Updates one finance company-account basic snapshot.
export async function updateFinancialAccountBasicsApi(
  tenantId: string,
  financialAccountId: string,
  payload: FinanceApi.UpdateFinancialAccountBasicsPayload
) {
  return requestClient.put<FinanceApi.FinancialAccount>(
    `/finance/tenants/${tenantId}/accounts/${financialAccountId}/basics`,
    payload
  )
}

// Lists finance real account transactions for the tenant finance workspace.
export async function listAccountTransactionsApi(
  tenantId: string,
  query: FinanceApi.AccountTransactionListQuery
) {
  return requestClient.get<FinanceApi.AccountTransactionListResult>(
    `/finance/tenants/${tenantId}/account-transactions`,
    { params: query }
  )
}

// Imports finance real account transactions into one company account.
export async function importAccountTransactionsApi(
  tenantId: string,
  financialAccountId: string,
  payload: FinanceApi.ImportAccountTransactionsPayload
) {
  return requestClient.post<FinanceApi.ImportAccountTransactionsResult>(
    `/finance/tenants/${tenantId}/accounts/${financialAccountId}/transactions/import`,
    payload
  )
}

// Records one finance real account transaction manually.
export async function recordAccountTransactionApi(
  tenantId: string,
  financialAccountId: string,
  payload: FinanceApi.RecordAccountTransactionPayload
) {
  return requestClient.post<FinanceApi.AccountTransaction>(
    `/finance/tenants/${tenantId}/accounts/${financialAccountId}/transactions`,
    payload
  )
}

// Registers one finance customer remittance account reference.
export async function registerCustomerFinancialAccountApi(
  tenantId: string,
  payload: FinanceApi.RegisterCustomerFinancialAccountPayload
) {
  return requestClient.post<FinanceApi.CustomerFinancialAccount>(
    `/finance/tenants/${tenantId}/customer-financial-accounts`,
    payload
  )
}

// Loads one finance standard exchange rate by point-in-time query.
export async function getExchangeRateApi(
  tenantId: string,
  query: FinanceApi.GetExchangeRateQuery
) {
  return requestClient.get<FinanceApi.ExchangeRate>(
    `/finance/tenants/${tenantId}/exchange-rate`,
    { params: query }
  )
}

// Writes one finance standard exchange rate record.
export async function setExchangeRateApi(
  tenantId: string,
  payload: FinanceApi.SetExchangeRatePayload
) {
  return requestClient.post<FinanceApi.ExchangeRate>(
    `/finance/tenants/${tenantId}/exchange-rates`,
    payload
  )
}

// Lists finance receivable schedules for the tenant finance workspace.
export async function listReceivableSchedulesApi(
  tenantId: string,
  query: FinanceApi.ReceivableScheduleListQuery
) {
  return requestClient.get<FinanceApi.ReceivableScheduleListResult>(
    `/finance/tenants/${tenantId}/receivable-schedules`,
    { params: query }
  )
}

// Loads one finance receivable schedule detail snapshot by id.
export async function getReceivableScheduleByIdApi(
  tenantId: string,
  receivableScheduleId: string
) {
  return requestClient.get<FinanceApi.ReceivableSchedule>(
    `/finance/tenants/${tenantId}/receivable-schedules/${receivableScheduleId}`
  )
}

// Loads the current finance release signal for one sales order.
export async function getFinanceReleaseSignalApi(tenantId: string, salesOrderId: string) {
  return requestClient.get<FinanceApi.FinanceReleaseSignal>(
    `/finance/tenants/${tenantId}/finance-release-signals/${salesOrderId}`
  )
}

// Creates one finance receivable schedule from an established sales order summary.
export async function createReceivableScheduleFromSalesOrderApi(
  tenantId: string,
  payload: FinanceApi.CreateReceivableScheduleFromSalesOrderPayload
) {
  return requestClient.post<FinanceApi.ReceivableSchedule>(
    `/finance/tenants/${tenantId}/receivable-schedules/from-sales-order`,
    payload
  )
}

// Writes one finance release signal for a sales order.
export async function setFinanceReleaseSignalApi(
  tenantId: string,
  salesOrderId: string,
  payload: FinanceApi.SetFinanceReleaseSignalPayload
) {
  return requestClient.post<FinanceApi.FinanceReleaseSignal>(
    `/finance/tenants/${tenantId}/finance-release-signals/${salesOrderId}`,
    payload
  )
}

// Lists finance payment allocations linked to receivable schedules.
export async function listPaymentAllocationsApi(
  tenantId: string,
  query: FinanceApi.PaymentAllocationListQuery
) {
  return requestClient.get<FinanceApi.PaymentAllocationListResult>(
    `/finance/tenants/${tenantId}/payment-allocations`,
    { params: query }
  )
}

// Allocates one real inflow transaction to receivable schedule lines.
export async function allocatePaymentToReceivableApi(
  tenantId: string,
  payload: FinanceApi.AllocatePaymentToReceivablePayload
) {
  return requestClient.post<FinanceApi.PaymentAllocation[]>(
    `/finance/tenants/${tenantId}/payment-allocations/allocate-to-receivable`,
    payload
  )
}
