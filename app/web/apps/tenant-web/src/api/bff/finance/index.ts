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
  export type PayableScheduleStatus =
    | 'CANCELLED'
    | 'ON_HOLD'
    | 'OPEN'
    | 'PAID'
    | 'PARTIALLY_PAID'
  export type PayableLineRequestGovernanceStatus =
    | 'APPROVED_PENDING_EXECUTION'
    | 'DUE_NO_REQUEST'
    | 'EARLY_REQUEST'
    | 'NONE'
    | 'PAID'
    | 'PARTIALLY_PAID'
    | 'REQUEST_SUBMITTED'
  export type PaymentRequestStatus =
    | 'APPROVED'
    | 'CANCELLED'
    | 'EXECUTED'
    | 'PARTIALLY_EXECUTED'
    | 'REJECTED'
    | 'SUBMITTED'
  export type PaymentRequestSource = 'FINANCE_INITIATED' | 'PROCUREMENT_INITIATED'
  export type PaymentExecutionStatus = 'MATCHED' | 'RECORDED' | 'VOIDED'

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
    paymentRequestId: string
    targetScheduleId: string
    targetScheduleLineId: string
    targetType: string
  }

  export interface PaymentAllocationListQuery {
    accountTransactionId?: string
    allocatedFrom?: string
    allocatedTo?: string
    page?: number
    pageSize?: number
    paymentExecutionId?: string
    receivableScheduleId?: string
    receivableScheduleLineId?: string
    targetScheduleId?: string
    targetScheduleLineId?: string
    targetType?: string
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

  export interface PayableScheduleSummary {
    currencyCode: string
    nearestDueDate: string
    outstandingAmount: string
    payableScheduleId: string
    requestGovernanceStatusSummary: PayableLineRequestGovernanceStatus | string
    scheduleNo: string
    sourcePurchaseOrderId: string
    sourcePurchaseOrderNo: string
    status: PayableScheduleStatus | string
    supplierDisplayName: string
    supplierTenantPartyId: string
  }

  export interface PayableScheduleLine {
    allocatedAmount: string
    dueDate: string
    executedAmount: string
    lineNo: number
    lineType: string
    memo: string
    outstandingAmount: string
    payableScheduleLineId: string
    requestGovernanceStatus: PayableLineRequestGovernanceStatus | string
    requestedAmount: string
    scheduledAmount: string
    sourcePurchaseOrderLineId: string
    sourceRef: string
    status: string
    supersedesSourceRef: string
  }

  export interface PayableSchedule {
    createdAt: string
    currencyCode: string
    lines: PayableScheduleLine[]
    orgId: string
    outstandingAmount: string
    payableScheduleId: string
    procurementSnapshotReference: string
    scheduleNo: string
    sourcePurchaseOrderId: string
    sourcePurchaseOrderNo: string
    sourceType: string
    status: PayableScheduleStatus | string
    supplierSnapshot: string
    supplierTenantPartyId: string
    tenantId: string
    totalAllocatedAmount: string
    totalExecutedAmount: string
    totalRequestedAmount: string
    totalScheduledAmount: string
    updatedAt: string
  }

  export interface PayableScheduleListQuery {
    dueFrom?: string
    dueTo?: string
    keyword?: string
    orgId?: string
    overdueOnly?: boolean
    page?: number
    pageSize?: number
    requestGovernanceStatus?: PayableLineRequestGovernanceStatus
    sourcePurchaseOrderId?: string
    status?: PayableScheduleStatus
    supplierTenantPartyId?: string
  }

  export interface PayableScheduleListResult {
    page: number
    pageSize: number
    payableSchedules: PayableScheduleSummary[]
    total: number
  }

  export interface CreatePayableScheduleFromPurchaseOrderLineInput {
    dueDate: string
    lineType: string
    memo?: string
    scheduledAmount: string
    sourcePurchaseOrderLineId?: string
    sourceRef: string
  }

  export interface CreatePayableScheduleFromPurchaseOrderPayload {
    auditReason?: string
    currencyCode: string
    lines: CreatePayableScheduleFromPurchaseOrderLineInput[]
    orgId?: string
    procurementSnapshotReference?: string
    purchaseOrderId: string
    purchaseOrderNo?: string
    supplierSnapshot: string
    supplierTenantPartyId: string
  }

  export interface ApplyPayableScheduleAdjustmentItem {
    action: string
    dueDate?: string
    lineType?: string
    memo?: string
    newSourceRef?: string
    scheduledAmount?: string
    sourcePurchaseOrderLineId?: string
    targetSourceRef?: string
  }

  export interface ApplyPayableScheduleAdjustmentFromPurchaseOrderChangePayload {
    adjustments: ApplyPayableScheduleAdjustmentItem[]
    auditReason?: string
    changeReason?: string
    orgId?: string
    procurementSnapshotReference?: string
    purchaseOrderChangeId: string
    purchaseOrderId: string
  }

  export interface PaymentRequestSummary {
    currencyCode: string
    paymentRequestId: string
    requestNo: string
    requestSource: PaymentRequestSource | string
    requestedAmount: string
    requestedAt: string
    status: PaymentRequestStatus | string
    supplierDisplayName: string
    supplierTenantPartyId: string
  }

  export interface PaymentRequestListQuery {
    beneficiarySupplierFinancialAccountId?: string
    orgId?: string
    page?: number
    pageSize?: number
    requestedFrom?: string
    requestedTo?: string
    requestSource?: PaymentRequestSource
    sourcePurchaseOrderId?: string
    status?: PaymentRequestStatus
    supplierTenantPartyId?: string
  }

  export interface PaymentRequestListResult {
    page: number
    pageSize: number
    paymentRequests: PaymentRequestSummary[]
    total: number
  }

  export interface PaymentRequestLine {
    isEarlyRequest: boolean
    lineStatus: string
    payableScheduleId: string
    payableScheduleLineId: string
    paymentRequestLineId: string
    requestedAmount: string
    scheduleDueDate: string
  }

  export interface SupplierBillEvidenceSnapshot {
    attachmentRef: string
    capturedAt: string
    currencyCode: string
    documentAmount: string
    documentDate: string
    evidenceSnapshotId: string
    evidenceType: string
    externalDocumentNo: string
    note: string
  }

  export interface PaymentRequest {
    beneficiarySupplierFinancialAccountId: string
    currencyCode: string
    evidenceSnapshots: SupplierBillEvidenceSnapshot[]
    lines: PaymentRequestLine[]
    orgId: string
    paymentRequestId: string
    reason: string
    requestNo: string
    requestSource: PaymentRequestSource | string
    requestedAmount: string
    requestedAt: string
    sourcePurchaseOrderId: string
    status: PaymentRequestStatus | string
    supplierTenantPartyId: string
    tenantId: string
    updatedAt: string
  }

  export interface PaymentRequestLineInput {
    payableScheduleId: string
    payableScheduleLineId: string
    requestedAmount: string
  }

  export interface SupplierBillEvidenceSnapshotInput {
    attachmentRef?: string
    currencyCode?: string
    documentAmount?: string
    documentDate?: string
    evidenceType: string
    externalDocumentNo?: string
    note?: string
  }

  export interface CreatePaymentRequestPayload {
    auditReason?: string
    beneficiarySupplierFinancialAccountId: string
    currencyCode: string
    evidenceSnapshots?: SupplierBillEvidenceSnapshotInput[]
    orgId?: string
    reason?: string
    requestedAmount: string
    requestedLines: PaymentRequestLineInput[]
    requestSource: PaymentRequestSource
    sourcePurchaseOrderId?: string
    supplierTenantPartyId: string
  }

  export interface DecidePaymentRequestPayload {
    auditReason?: string
    decision: 'APPROVED' | 'REJECTED'
    decisionReason?: string
  }

  export interface PaymentExecutionSummary {
    currencyCode: string
    executedAmount: string
    executedAt: string
    paymentExecutionId: string
    paymentRequestId: string
    status: PaymentExecutionStatus | string
    supplierTenantPartyId: string
  }

  export interface PaymentExecutionListQuery {
    executedFrom?: string
    executedTo?: string
    linkedAccountTransactionId?: string
    orgId?: string
    page?: number
    pageSize?: number
    paymentRequestId?: string
    sourceFinancialAccountId?: string
    status?: PaymentExecutionStatus
    supplierTenantPartyId?: string
  }

  export interface PaymentExecutionListResult {
    page: number
    pageSize: number
    paymentExecutions: PaymentExecutionSummary[]
    total: number
  }

  export interface PaymentExecution {
    attachmentRefs: string[]
    beneficiaryAccountSnapshot: string
    beneficiarySupplierFinancialAccountId: string
    currencyCode: string
    executedAmount: string
    executedAt: string
    executionReference: string
    linkedAccountTransactionId: string
    paymentExecutionId: string
    paymentRequestId: string
    sourceFinancialAccountId: string
    status: PaymentExecutionStatus | string
  }

  export interface ExecutePaymentRequestPayload {
    attachmentRefs?: string[]
    auditReason?: string
    currencyCode: string
    executedAmount: string
    executedAt: string
    executionReference?: string
    linkedAccountTransactionId?: string
    sourceFinancialAccountId: string
  }

  export interface ExecutePaymentRequestResult {
    paymentExecution: PaymentExecution
    paymentRequest: PaymentRequest
  }

  export interface AllocatePaymentToPayableItem {
    allocatedAmount: string
    payableScheduleId: string
    payableScheduleLineId: string
  }

  export interface AllocatePaymentToPayablePayload {
    accountTransactionId: string
    allocations: AllocatePaymentToPayableItem[]
    auditReason?: string
    paymentExecutionId?: string
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

// Lists finance payable schedules for the tenant finance workspace.
export async function listPayableSchedulesApi(
  tenantId: string,
  query: FinanceApi.PayableScheduleListQuery
) {
  return requestClient.get<FinanceApi.PayableScheduleListResult>(
    `/finance/tenants/${tenantId}/payable-schedules`,
    { params: query }
  )
}

// Loads one finance payable schedule detail snapshot by id.
export async function getPayableScheduleByIdApi(tenantId: string, payableScheduleId: string) {
  return requestClient.get<FinanceApi.PayableSchedule>(
    `/finance/tenants/${tenantId}/payable-schedules/${payableScheduleId}`
  )
}

// Creates one finance payable schedule from a controlled purchase-order summary.
export async function createPayableScheduleFromPurchaseOrderApi(
  tenantId: string,
  payload: FinanceApi.CreatePayableScheduleFromPurchaseOrderPayload
) {
  return requestClient.post<FinanceApi.PayableSchedule>(
    `/finance/tenants/${tenantId}/payable-schedules/from-purchase-order`,
    payload
  )
}

// Applies a controlled purchase-order change to one finance payable schedule.
export async function applyPayableScheduleAdjustmentFromPurchaseOrderChangeApi(
  tenantId: string,
  payload: FinanceApi.ApplyPayableScheduleAdjustmentFromPurchaseOrderChangePayload
) {
  return requestClient.post<FinanceApi.PayableSchedule>(
    `/finance/tenants/${tenantId}/payable-schedules/from-purchase-order-change`,
    payload
  )
}

// Lists finance payment requests for phase 1B payment governance.
export async function listPaymentRequestsApi(
  tenantId: string,
  query: FinanceApi.PaymentRequestListQuery
) {
  return requestClient.get<FinanceApi.PaymentRequestListResult>(
    `/finance/tenants/${tenantId}/payment-requests`,
    { params: query }
  )
}

// Creates one finance payment request without changing payable truth.
export async function createPaymentRequestApi(
  tenantId: string,
  payload: FinanceApi.CreatePaymentRequestPayload
) {
  return requestClient.post<FinanceApi.PaymentRequest>(
    `/finance/tenants/${tenantId}/payment-requests`,
    payload
  )
}

// Approves or rejects one finance payment request.
export async function decidePaymentRequestApi(
  tenantId: string,
  paymentRequestId: string,
  payload: FinanceApi.DecidePaymentRequestPayload
) {
  return requestClient.post<FinanceApi.PaymentRequest>(
    `/finance/tenants/${tenantId}/payment-requests/${paymentRequestId}/decisions`,
    payload
  )
}

// Lists finance payment execution records without exposing company account balances.
export async function listPaymentExecutionsApi(
  tenantId: string,
  query: FinanceApi.PaymentExecutionListQuery
) {
  return requestClient.get<FinanceApi.PaymentExecutionListResult>(
    `/finance/tenants/${tenantId}/payment-executions`,
    { params: query }
  )
}

// Records one finance payment execution without creating account-transaction truth.
export async function executePaymentRequestApi(
  tenantId: string,
  paymentRequestId: string,
  payload: FinanceApi.ExecutePaymentRequestPayload
) {
  return requestClient.post<FinanceApi.ExecutePaymentRequestResult>(
    `/finance/tenants/${tenantId}/payment-requests/${paymentRequestId}/executions`,
    payload
  )
}

// Allocates one real outflow transaction to payable schedule lines.
export async function allocatePaymentToPayableApi(
  tenantId: string,
  payload: FinanceApi.AllocatePaymentToPayablePayload
) {
  return requestClient.post<FinanceApi.PaymentAllocation[]>(
    `/finance/tenants/${tenantId}/payment-allocations/allocate-to-payable`,
    payload
  )
}
