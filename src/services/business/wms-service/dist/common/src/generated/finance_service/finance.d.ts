import { Observable } from "rxjs";
export declare enum FinancialAccountType {
    FINANCIAL_ACCOUNT_TYPE_UNSPECIFIED = 0,
    FINANCIAL_ACCOUNT_TYPE_BANK = 1,
    FINANCIAL_ACCOUNT_TYPE_CASH = 2,
    FINANCIAL_ACCOUNT_TYPE_WECHAT = 3,
    FINANCIAL_ACCOUNT_TYPE_ALIPAY = 4,
    FINANCIAL_ACCOUNT_TYPE_PAYPAL = 5,
    FINANCIAL_ACCOUNT_TYPE_STRIPE = 6,
    FINANCIAL_ACCOUNT_TYPE_OTHER_PSP = 7
}
export declare enum FinancialAccountStatus {
    FINANCIAL_ACCOUNT_STATUS_UNSPECIFIED = 0,
    FINANCIAL_ACCOUNT_STATUS_ACTIVE = 1,
    FINANCIAL_ACCOUNT_STATUS_INACTIVE = 2,
    FINANCIAL_ACCOUNT_STATUS_CLOSED = 3
}
export declare enum AccountTransactionDirection {
    ACCOUNT_TRANSACTION_DIRECTION_UNSPECIFIED = 0,
    ACCOUNT_TRANSACTION_DIRECTION_INFLOW = 1,
    ACCOUNT_TRANSACTION_DIRECTION_OUTFLOW = 2
}
export declare enum AccountTransactionSourceType {
    ACCOUNT_TRANSACTION_SOURCE_TYPE_UNSPECIFIED = 0,
    ACCOUNT_TRANSACTION_SOURCE_TYPE_MANUAL = 1,
    ACCOUNT_TRANSACTION_SOURCE_TYPE_CSV_IMPORT = 2,
    ACCOUNT_TRANSACTION_SOURCE_TYPE_FUTURE_API = 3
}
export declare enum AccountTransactionStatus {
    ACCOUNT_TRANSACTION_STATUS_UNSPECIFIED = 0,
    ACCOUNT_TRANSACTION_STATUS_DRAFT = 1,
    ACCOUNT_TRANSACTION_STATUS_CONFIRMED = 2,
    ACCOUNT_TRANSACTION_STATUS_VOIDED = 3
}
export declare enum AccountTransactionAllocationStatus {
    ACCOUNT_TRANSACTION_ALLOCATION_STATUS_UNSPECIFIED = 0,
    ACCOUNT_TRANSACTION_ALLOCATION_STATUS_UNALLOCATED = 1,
    ACCOUNT_TRANSACTION_ALLOCATION_STATUS_PARTIALLY_ALLOCATED = 2,
    ACCOUNT_TRANSACTION_ALLOCATION_STATUS_FULLY_ALLOCATED = 3
}
export declare enum CustomerFinancialAccountProviderType {
    CUSTOMER_FINANCIAL_ACCOUNT_PROVIDER_TYPE_UNSPECIFIED = 0,
    CUSTOMER_FINANCIAL_ACCOUNT_PROVIDER_TYPE_BANK = 1,
    CUSTOMER_FINANCIAL_ACCOUNT_PROVIDER_TYPE_WECHAT = 2,
    CUSTOMER_FINANCIAL_ACCOUNT_PROVIDER_TYPE_ALIPAY = 3,
    CUSTOMER_FINANCIAL_ACCOUNT_PROVIDER_TYPE_PAYPAL = 4,
    CUSTOMER_FINANCIAL_ACCOUNT_PROVIDER_TYPE_STRIPE = 5,
    CUSTOMER_FINANCIAL_ACCOUNT_PROVIDER_TYPE_OTHER = 6
}
export declare enum CustomerFinancialAccountVerifiedStatus {
    CUSTOMER_FINANCIAL_ACCOUNT_VERIFIED_STATUS_UNSPECIFIED = 0,
    CUSTOMER_FINANCIAL_ACCOUNT_VERIFIED_STATUS_UNVERIFIED = 1,
    CUSTOMER_FINANCIAL_ACCOUNT_VERIFIED_STATUS_VERIFIED = 2
}
export declare enum ReceivableScheduleStatus {
    RECEIVABLE_SCHEDULE_STATUS_UNSPECIFIED = 0,
    RECEIVABLE_SCHEDULE_STATUS_OPEN = 1,
    RECEIVABLE_SCHEDULE_STATUS_PARTIALLY_PAID = 2,
    RECEIVABLE_SCHEDULE_STATUS_PAID = 3,
    RECEIVABLE_SCHEDULE_STATUS_CANCELLED = 4,
    RECEIVABLE_SCHEDULE_STATUS_ON_HOLD = 5
}
export declare enum ReceivableScheduleLineStatus {
    RECEIVABLE_SCHEDULE_LINE_STATUS_UNSPECIFIED = 0,
    RECEIVABLE_SCHEDULE_LINE_STATUS_OPEN = 1,
    RECEIVABLE_SCHEDULE_LINE_STATUS_PARTIALLY_PAID = 2,
    RECEIVABLE_SCHEDULE_LINE_STATUS_PAID = 3,
    RECEIVABLE_SCHEDULE_LINE_STATUS_CANCELLED = 4,
    RECEIVABLE_SCHEDULE_LINE_STATUS_OVERDUE = 5
}
export declare enum FinanceReleaseSignalStatus {
    FINANCE_RELEASE_SIGNAL_STATUS_UNSPECIFIED = 0,
    FINANCE_RELEASE_SIGNAL_STATUS_RELEASED = 1,
    FINANCE_RELEASE_SIGNAL_STATUS_HELD = 2,
    FINANCE_RELEASE_SIGNAL_STATUS_REVIEW_REQUIRED = 3
}
export interface OperatorContext {
    operatorId?: string | undefined;
    operatorType?: string | undefined;
    orgId?: string | undefined;
}
export interface TraceContext {
    traceId?: string | undefined;
    requestId?: string | undefined;
}
export interface AuditContext {
    auditId?: string | undefined;
    reason?: string | undefined;
    source?: string | undefined;
}
export interface FinancialAccount {
    financialAccountId?: string | undefined;
    accountNo?: string | undefined;
    tenantId?: string | undefined;
    orgId?: string | undefined;
    accountType?: FinancialAccountType | undefined;
    accountName?: string | undefined;
    currencyCode?: string | undefined;
    institutionName?: string | undefined;
    accountIdentifierMasked?: string | undefined;
    status?: FinancialAccountStatus | undefined;
    lastTransactionAt?: string | undefined;
    currentBalance?: string | undefined;
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
}
export interface FinancialAccountSummary {
    financialAccountId?: string | undefined;
    accountNo?: string | undefined;
    accountType?: FinancialAccountType | undefined;
    accountName?: string | undefined;
    currencyCode?: string | undefined;
    status?: FinancialAccountStatus | undefined;
    lastTransactionAt?: string | undefined;
    currentBalance?: string | undefined;
}
export interface AccountTransaction {
    accountTransactionId?: string | undefined;
    financialAccountId?: string | undefined;
    direction?: AccountTransactionDirection | undefined;
    amount?: string | undefined;
    currencyCode?: string | undefined;
    transactionTime?: string | undefined;
    valueDate?: string | undefined;
    sourceType?: AccountTransactionSourceType | undefined;
    status?: AccountTransactionStatus | undefined;
    externalReference?: string | undefined;
    counterpartyName?: string | undefined;
    counterpartyAccountSnapshot?: string | undefined;
    memo?: string | undefined;
    paymentExecutionId?: string | undefined;
    allocationStatus?: AccountTransactionAllocationStatus | undefined;
    allocatedAmount?: string | undefined;
    unallocatedAmount?: string | undefined;
    fileAssetId?: string | undefined;
    attachmentRef?: string | undefined;
    createdAt?: string | undefined;
}
export interface ImportBatchSummary {
    accountTransactionImportBatchId?: string | undefined;
    sourceType?: string | undefined;
    sourceBatchReference?: string | undefined;
    fileAssetId?: string | undefined;
    attachmentRef?: string | undefined;
    totalRows?: number | undefined;
    acceptedCount?: number | undefined;
    duplicateCount?: number | undefined;
    failedCount?: number | undefined;
}
export interface CustomerFinancialAccount {
    customerFinancialAccountId?: string | undefined;
    customerTenantPartyId?: string | undefined;
    accountHolderName?: string | undefined;
    accountProviderType?: CustomerFinancialAccountProviderType | undefined;
    accountIdentifierMasked?: string | undefined;
    currencyCode?: string | undefined;
    isDefault?: boolean | undefined;
    verifiedStatus?: CustomerFinancialAccountVerifiedStatus | undefined;
}
export interface ExchangeRate {
    exchangeRateId?: string | undefined;
    tenantId?: string | undefined;
    baseCurrencyCode?: string | undefined;
    quoteCurrencyCode?: string | undefined;
    rateValue?: string | undefined;
    effectiveAt?: string | undefined;
    setBy?: string | undefined;
    updatedAt?: string | undefined;
}
export interface ReceivableScheduleLine {
    receivableScheduleLineId?: string | undefined;
    lineNo?: number | undefined;
    dueDate?: string | undefined;
    scheduledAmount?: string | undefined;
    allocatedAmount?: string | undefined;
    outstandingAmount?: string | undefined;
    status?: ReceivableScheduleLineStatus | undefined;
    sourceSalesOrderLineId?: string | undefined;
    memo?: string | undefined;
}
export interface ReceivableSchedule {
    receivableScheduleId?: string | undefined;
    scheduleNo?: string | undefined;
    tenantId?: string | undefined;
    orgId?: string | undefined;
    sourceSalesOrderId?: string | undefined;
    customerTenantPartyId?: string | undefined;
    customerSnapshot?: string | undefined;
    currencyCode?: string | undefined;
    status?: ReceivableScheduleStatus | undefined;
    totalScheduledAmount?: string | undefined;
    totalAllocatedAmount?: string | undefined;
    outstandingAmount?: string | undefined;
    lines?: ReceivableScheduleLine[] | undefined;
    salesExchangeRateSnapshot?: string | undefined;
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
}
export interface ReceivableScheduleSummary {
    receivableScheduleId?: string | undefined;
    scheduleNo?: string | undefined;
    sourceSalesOrderId?: string | undefined;
    customerTenantPartyId?: string | undefined;
    customerDisplayName?: string | undefined;
    currencyCode?: string | undefined;
    status?: ReceivableScheduleStatus | undefined;
    outstandingAmount?: string | undefined;
    nearestDueDate?: string | undefined;
    financeReleaseStatus?: FinanceReleaseSignalStatus | undefined;
}
export interface FinanceReleaseSignal {
    financeReleaseSignalId?: string | undefined;
    tenantId?: string | undefined;
    salesOrderId?: string | undefined;
    customerTenantPartyId?: string | undefined;
    signalStatus?: FinanceReleaseSignalStatus | undefined;
    reasonCode?: string | undefined;
    reasonSummary?: string | undefined;
    effectiveAt?: string | undefined;
    expiresAt?: string | undefined;
    basedOnSummary?: string | undefined;
    updatedAt?: string | undefined;
}
export interface PaymentAllocation {
    paymentAllocationId?: string | undefined;
    accountTransactionId?: string | undefined;
    paymentExecutionId?: string | undefined;
    targetType?: string | undefined;
    targetScheduleId?: string | undefined;
    targetScheduleLineId?: string | undefined;
    allocatedAmount?: string | undefined;
    currencyCode?: string | undefined;
    allocatedAt?: string | undefined;
    paymentRequestId?: string | undefined;
}
export interface PayableScheduleLine {
    payableScheduleLineId?: string | undefined;
    lineNo?: number | undefined;
    lineType?: string | undefined;
    sourceRef?: string | undefined;
    dueDate?: string | undefined;
    scheduledAmount?: string | undefined;
    requestedAmount?: string | undefined;
    executedAmount?: string | undefined;
    allocatedAmount?: string | undefined;
    outstandingAmount?: string | undefined;
    status?: string | undefined;
    requestGovernanceStatus?: string | undefined;
    sourcePurchaseOrderLineId?: string | undefined;
    supersedesSourceRef?: string | undefined;
    memo?: string | undefined;
}
export interface PayableSchedule {
    payableScheduleId?: string | undefined;
    scheduleNo?: string | undefined;
    tenantId?: string | undefined;
    orgId?: string | undefined;
    sourceType?: string | undefined;
    sourcePurchaseOrderId?: string | undefined;
    sourcePurchaseOrderNo?: string | undefined;
    procurementSnapshotReference?: string | undefined;
    supplierTenantPartyId?: string | undefined;
    supplierSnapshot?: string | undefined;
    currencyCode?: string | undefined;
    status?: string | undefined;
    totalScheduledAmount?: string | undefined;
    totalRequestedAmount?: string | undefined;
    totalExecutedAmount?: string | undefined;
    totalAllocatedAmount?: string | undefined;
    outstandingAmount?: string | undefined;
    lines?: PayableScheduleLine[] | undefined;
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
}
export interface PayableScheduleSummary {
    payableScheduleId?: string | undefined;
    scheduleNo?: string | undefined;
    sourcePurchaseOrderId?: string | undefined;
    sourcePurchaseOrderNo?: string | undefined;
    supplierTenantPartyId?: string | undefined;
    supplierDisplayName?: string | undefined;
    currencyCode?: string | undefined;
    status?: string | undefined;
    requestGovernanceStatusSummary?: string | undefined;
    outstandingAmount?: string | undefined;
    nearestDueDate?: string | undefined;
}
export interface PaymentRequestLine {
    paymentRequestLineId?: string | undefined;
    payableScheduleId?: string | undefined;
    payableScheduleLineId?: string | undefined;
    scheduleDueDate?: string | undefined;
    requestedAmount?: string | undefined;
    isEarlyRequest?: boolean | undefined;
    lineStatus?: string | undefined;
}
export interface SupplierBillEvidenceSnapshot {
    evidenceSnapshotId?: string | undefined;
    evidenceType?: string | undefined;
    externalDocumentNo?: string | undefined;
    documentDate?: string | undefined;
    currencyCode?: string | undefined;
    documentAmount?: string | undefined;
    attachmentRef?: string | undefined;
    note?: string | undefined;
    capturedAt?: string | undefined;
}
export interface PaymentRequest {
    paymentRequestId?: string | undefined;
    requestNo?: string | undefined;
    tenantId?: string | undefined;
    orgId?: string | undefined;
    requestSource?: string | undefined;
    sourcePurchaseOrderId?: string | undefined;
    supplierTenantPartyId?: string | undefined;
    beneficiarySupplierFinancialAccountId?: string | undefined;
    currencyCode?: string | undefined;
    requestedAmount?: string | undefined;
    status?: string | undefined;
    reason?: string | undefined;
    lines?: PaymentRequestLine[] | undefined;
    evidenceSnapshots?: SupplierBillEvidenceSnapshot[] | undefined;
    requestedAt?: string | undefined;
    updatedAt?: string | undefined;
}
export interface PaymentRequestSummary {
    paymentRequestId?: string | undefined;
    requestNo?: string | undefined;
    requestSource?: string | undefined;
    supplierTenantPartyId?: string | undefined;
    supplierDisplayName?: string | undefined;
    currencyCode?: string | undefined;
    requestedAmount?: string | undefined;
    status?: string | undefined;
    requestedAt?: string | undefined;
}
export interface PaymentExecution {
    paymentExecutionId?: string | undefined;
    paymentRequestId?: string | undefined;
    sourceFinancialAccountId?: string | undefined;
    beneficiarySupplierFinancialAccountId?: string | undefined;
    beneficiaryAccountSnapshot?: string | undefined;
    executedAmount?: string | undefined;
    currencyCode?: string | undefined;
    executedAt?: string | undefined;
    executionReference?: string | undefined;
    attachmentRefs?: string[] | undefined;
    linkedAccountTransactionId?: string | undefined;
    status?: string | undefined;
}
export interface PaymentExecutionSummary {
    paymentExecutionId?: string | undefined;
    paymentRequestId?: string | undefined;
    supplierTenantPartyId?: string | undefined;
    executedAmount?: string | undefined;
    currencyCode?: string | undefined;
    status?: string | undefined;
    executedAt?: string | undefined;
}
export interface CreateFinancialAccountRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    auditContext?: AuditContext | undefined;
    orgId?: string | undefined;
    accountType?: FinancialAccountType | undefined;
    accountName?: string | undefined;
    currencyCode?: string | undefined;
    institutionName?: string | undefined;
    accountIdentifier?: string | undefined;
    openingBalance?: string | undefined;
    openingBalanceAsOf?: string | undefined;
}
export interface CreateFinancialAccountResponse {
    financialAccount?: FinancialAccount | undefined;
}
export interface UpdateFinancialAccountBasicsRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    auditContext?: AuditContext | undefined;
    financialAccountId?: string | undefined;
    accountName?: string | undefined;
    institutionName?: string | undefined;
    accountIdentifier?: string | undefined;
    status?: FinancialAccountStatus | undefined;
}
export interface UpdateFinancialAccountBasicsResponse {
    financialAccount?: FinancialAccount | undefined;
}
export interface ImportAccountTransactionInput {
    direction?: AccountTransactionDirection | undefined;
    amount?: string | undefined;
    currencyCode?: string | undefined;
    transactionTime?: string | undefined;
    valueDate?: string | undefined;
    externalReference?: string | undefined;
    counterpartyName?: string | undefined;
    counterpartyAccountSnapshot?: string | undefined;
    memo?: string | undefined;
}
export interface ImportAccountTransactionsRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    auditContext?: AuditContext | undefined;
    financialAccountId?: string | undefined;
    sourceBatchReference?: string | undefined;
    fileAssetId?: string | undefined;
    attachmentRef?: string | undefined;
    importedBy?: string | undefined;
    sourceType?: AccountTransactionSourceType | undefined;
    transactions?: ImportAccountTransactionInput[] | undefined;
}
export interface ImportAccountTransactionsResponse {
    batch?: ImportBatchSummary | undefined;
    accountTransactionIds?: string[] | undefined;
}
export interface RecordAccountTransactionRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    auditContext?: AuditContext | undefined;
    financialAccountId?: string | undefined;
    direction?: AccountTransactionDirection | undefined;
    amount?: string | undefined;
    currencyCode?: string | undefined;
    transactionTime?: string | undefined;
    valueDate?: string | undefined;
    sourceType?: AccountTransactionSourceType | undefined;
    status?: AccountTransactionStatus | undefined;
    externalReference?: string | undefined;
    counterpartyName?: string | undefined;
    counterpartyAccountSnapshot?: string | undefined;
    memo?: string | undefined;
    fileAssetId?: string | undefined;
    attachmentRef?: string | undefined;
}
export interface RecordAccountTransactionResponse {
    accountTransaction?: AccountTransaction | undefined;
}
export interface RegisterCustomerFinancialAccountRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    auditContext?: AuditContext | undefined;
    customerTenantPartyId?: string | undefined;
    accountHolderName?: string | undefined;
    accountProviderType?: CustomerFinancialAccountProviderType | undefined;
    accountIdentifier?: string | undefined;
    currencyCode?: string | undefined;
    isDefault?: boolean | undefined;
}
export interface RegisterCustomerFinancialAccountResponse {
    customerFinancialAccount?: CustomerFinancialAccount | undefined;
}
export interface SetExchangeRateRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    auditContext?: AuditContext | undefined;
    baseCurrencyCode?: string | undefined;
    quoteCurrencyCode?: string | undefined;
    rateValue?: string | undefined;
    effectiveAt?: string | undefined;
    setBy?: string | undefined;
}
export interface SetExchangeRateResponse {
    exchangeRate?: ExchangeRate | undefined;
}
export interface GetFinancialAccountRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    financialAccountId?: string | undefined;
}
export interface GetFinancialAccountResponse {
    financialAccount?: FinancialAccount | undefined;
}
export interface SearchFinancialAccountsRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    orgId?: string | undefined;
    keyword?: string | undefined;
    accountType?: FinancialAccountType | undefined;
    currencyCode?: string | undefined;
    status?: FinancialAccountStatus | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}
export interface SearchFinancialAccountsResponse {
    financialAccounts?: FinancialAccountSummary[] | undefined;
    total?: number | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}
export interface SearchAccountTransactionsRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    orgId?: string | undefined;
    financialAccountId?: string | undefined;
    direction?: AccountTransactionDirection | undefined;
    sourceType?: AccountTransactionSourceType | undefined;
    allocationStatus?: AccountTransactionAllocationStatus | undefined;
    externalReference?: string | undefined;
    occurredFrom?: string | undefined;
    occurredTo?: string | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}
export interface SearchAccountTransactionsResponse {
    accountTransactions?: AccountTransaction[] | undefined;
    total?: number | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}
export interface GetExchangeRateRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    baseCurrencyCode?: string | undefined;
    quoteCurrencyCode?: string | undefined;
    effectiveAt?: string | undefined;
}
export interface GetExchangeRateResponse {
    exchangeRate?: ExchangeRate | undefined;
}
export interface CreateReceivableScheduleLineInput {
    dueDate?: string | undefined;
    scheduledAmount?: string | undefined;
    sourceSalesOrderLineId?: string | undefined;
    memo?: string | undefined;
}
export interface CreateReceivableScheduleFromSalesOrderRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    auditContext?: AuditContext | undefined;
    orgId?: string | undefined;
    salesOrderId?: string | undefined;
    customerTenantPartyId?: string | undefined;
    customerSnapshot?: string | undefined;
    currencyCode?: string | undefined;
    salesExchangeRateSnapshot?: string | undefined;
    lines?: CreateReceivableScheduleLineInput[] | undefined;
}
export interface CreateReceivableScheduleFromSalesOrderResponse {
    receivableSchedule?: ReceivableSchedule | undefined;
}
export interface SetFinanceReleaseSignalRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    auditContext?: AuditContext | undefined;
    salesOrderId?: string | undefined;
    customerTenantPartyId?: string | undefined;
    signalStatus?: FinanceReleaseSignalStatus | undefined;
    reasonCode?: string | undefined;
    reasonSummary?: string | undefined;
    effectiveAt?: string | undefined;
    expiresAt?: string | undefined;
    basedOnSummary?: string | undefined;
}
export interface SetFinanceReleaseSignalResponse {
    financeReleaseSignal?: FinanceReleaseSignal | undefined;
}
export interface GetReceivableScheduleRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    receivableScheduleId?: string | undefined;
}
export interface GetReceivableScheduleResponse {
    receivableSchedule?: ReceivableSchedule | undefined;
}
export interface SearchReceivableSchedulesRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    orgId?: string | undefined;
    keyword?: string | undefined;
    customerTenantPartyId?: string | undefined;
    sourceSalesOrderId?: string | undefined;
    status?: ReceivableScheduleStatus | undefined;
    financeReleaseStatus?: FinanceReleaseSignalStatus | undefined;
    overdueOnly?: boolean | undefined;
    dueFrom?: string | undefined;
    dueTo?: string | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}
export interface SearchReceivableSchedulesResponse {
    receivableSchedules?: ReceivableScheduleSummary[] | undefined;
    total?: number | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}
export interface GetFinanceReleaseSignalRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    salesOrderId?: string | undefined;
}
export interface GetFinanceReleaseSignalResponse {
    financeReleaseSignal?: FinanceReleaseSignal | undefined;
}
export interface CreatePayableScheduleFromPurchaseOrderLine {
    lineType?: string | undefined;
    sourceRef?: string | undefined;
    dueDate?: string | undefined;
    scheduledAmount?: string | undefined;
    sourcePurchaseOrderLineId?: string | undefined;
    memo?: string | undefined;
}
export interface CreatePayableScheduleFromPurchaseOrderRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    auditContext?: AuditContext | undefined;
    orgId?: string | undefined;
    purchaseOrderId?: string | undefined;
    purchaseOrderNo?: string | undefined;
    procurementSnapshotReference?: string | undefined;
    supplierTenantPartyId?: string | undefined;
    supplierSnapshot?: string | undefined;
    currencyCode?: string | undefined;
    lines?: CreatePayableScheduleFromPurchaseOrderLine[] | undefined;
}
export interface CreatePayableScheduleFromPurchaseOrderResponse {
    payableSchedule?: PayableSchedule | undefined;
}
export interface ApplyPayableScheduleAdjustmentItem {
    action?: string | undefined;
    targetSourceRef?: string | undefined;
    newSourceRef?: string | undefined;
    lineType?: string | undefined;
    dueDate?: string | undefined;
    scheduledAmount?: string | undefined;
    sourcePurchaseOrderLineId?: string | undefined;
    memo?: string | undefined;
}
export interface ApplyPayableScheduleAdjustmentFromPurchaseOrderChangeRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    auditContext?: AuditContext | undefined;
    orgId?: string | undefined;
    purchaseOrderId?: string | undefined;
    purchaseOrderChangeId?: string | undefined;
    procurementSnapshotReference?: string | undefined;
    changeReason?: string | undefined;
    adjustments?: ApplyPayableScheduleAdjustmentItem[] | undefined;
}
export interface ApplyPayableScheduleAdjustmentFromPurchaseOrderChangeResponse {
    payableSchedule?: PayableSchedule | undefined;
}
export interface PaymentRequestLineInput {
    payableScheduleId?: string | undefined;
    payableScheduleLineId?: string | undefined;
    requestedAmount?: string | undefined;
}
export interface SupplierBillEvidenceSnapshotInput {
    evidenceType?: string | undefined;
    externalDocumentNo?: string | undefined;
    documentDate?: string | undefined;
    currencyCode?: string | undefined;
    documentAmount?: string | undefined;
    attachmentRef?: string | undefined;
    note?: string | undefined;
}
export interface CreatePaymentRequestRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    auditContext?: AuditContext | undefined;
    orgId?: string | undefined;
    requestSource?: string | undefined;
    sourcePurchaseOrderId?: string | undefined;
    supplierTenantPartyId?: string | undefined;
    beneficiarySupplierFinancialAccountId?: string | undefined;
    currencyCode?: string | undefined;
    requestedAmount?: string | undefined;
    requestedLines?: PaymentRequestLineInput[] | undefined;
    evidenceSnapshots?: SupplierBillEvidenceSnapshotInput[] | undefined;
    reason?: string | undefined;
}
export interface CreatePaymentRequestResponse {
    paymentRequest?: PaymentRequest | undefined;
}
export interface DecidePaymentRequestRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    auditContext?: AuditContext | undefined;
    paymentRequestId?: string | undefined;
    decision?: string | undefined;
    decisionReason?: string | undefined;
}
export interface DecidePaymentRequestResponse {
    paymentRequest?: PaymentRequest | undefined;
}
export interface ExecutePaymentRequestRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    auditContext?: AuditContext | undefined;
    paymentRequestId?: string | undefined;
    sourceFinancialAccountId?: string | undefined;
    executedAmount?: string | undefined;
    currencyCode?: string | undefined;
    executedAt?: string | undefined;
    executionReference?: string | undefined;
    attachmentRefs?: string[] | undefined;
    linkedAccountTransactionId?: string | undefined;
}
export interface ExecutePaymentRequestResponse {
    paymentRequest?: PaymentRequest | undefined;
    paymentExecution?: PaymentExecution | undefined;
}
export interface AllocatePaymentToPayableItem {
    payableScheduleId?: string | undefined;
    payableScheduleLineId?: string | undefined;
    allocatedAmount?: string | undefined;
}
export interface AllocatePaymentToPayableRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    auditContext?: AuditContext | undefined;
    accountTransactionId?: string | undefined;
    paymentExecutionId?: string | undefined;
    allocations?: AllocatePaymentToPayableItem[] | undefined;
}
export interface AllocatePaymentToPayableResponse {
    paymentAllocations?: PaymentAllocation[] | undefined;
}
export interface GetPayableScheduleRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    payableScheduleId?: string | undefined;
}
export interface GetPayableScheduleResponse {
    payableSchedule?: PayableSchedule | undefined;
}
export interface SearchPayableSchedulesRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    orgId?: string | undefined;
    keyword?: string | undefined;
    supplierTenantPartyId?: string | undefined;
    sourcePurchaseOrderId?: string | undefined;
    status?: string | undefined;
    requestGovernanceStatus?: string | undefined;
    overdueOnly?: boolean | undefined;
    dueFrom?: string | undefined;
    dueTo?: string | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}
export interface SearchPayableSchedulesResponse {
    payableSchedules?: PayableScheduleSummary[] | undefined;
    total?: number | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}
export interface SearchPaymentRequestsRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    orgId?: string | undefined;
    requestSource?: string | undefined;
    supplierTenantPartyId?: string | undefined;
    sourcePurchaseOrderId?: string | undefined;
    status?: string | undefined;
    beneficiarySupplierFinancialAccountId?: string | undefined;
    requestedFrom?: string | undefined;
    requestedTo?: string | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}
export interface SearchPaymentRequestsResponse {
    paymentRequests?: PaymentRequestSummary[] | undefined;
    total?: number | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}
export interface SearchPaymentExecutionsRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    orgId?: string | undefined;
    paymentRequestId?: string | undefined;
    supplierTenantPartyId?: string | undefined;
    sourceFinancialAccountId?: string | undefined;
    linkedAccountTransactionId?: string | undefined;
    status?: string | undefined;
    executedFrom?: string | undefined;
    executedTo?: string | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}
export interface SearchPaymentExecutionsResponse {
    paymentExecutions?: PaymentExecutionSummary[] | undefined;
    total?: number | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}
export interface AllocatePaymentToReceivableItem {
    receivableScheduleId?: string | undefined;
    receivableScheduleLineId?: string | undefined;
    allocatedAmount?: string | undefined;
}
export interface AllocatePaymentToReceivableRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    auditContext?: AuditContext | undefined;
    accountTransactionId?: string | undefined;
    allocations?: AllocatePaymentToReceivableItem[] | undefined;
}
export interface AllocatePaymentToReceivableResponse {
    paymentAllocations?: PaymentAllocation[] | undefined;
}
export interface SearchPaymentAllocationsRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    accountTransactionId?: string | undefined;
    receivableScheduleId?: string | undefined;
    receivableScheduleLineId?: string | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
    paymentExecutionId?: string | undefined;
    targetType?: string | undefined;
    targetScheduleId?: string | undefined;
    targetScheduleLineId?: string | undefined;
    allocatedFrom?: string | undefined;
    allocatedTo?: string | undefined;
}
export interface SearchPaymentAllocationsResponse {
    paymentAllocations?: PaymentAllocation[] | undefined;
    total?: number | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}
export interface FinancialAccountQueryServiceClient {
    getFinancialAccount(request: GetFinancialAccountRequest, ...rest: any): Observable<GetFinancialAccountResponse>;
    searchFinancialAccounts(request: SearchFinancialAccountsRequest, ...rest: any): Observable<SearchFinancialAccountsResponse>;
    searchAccountTransactions(request: SearchAccountTransactionsRequest, ...rest: any): Observable<SearchAccountTransactionsResponse>;
    getExchangeRate(request: GetExchangeRateRequest, ...rest: any): Observable<GetExchangeRateResponse>;
}
export interface FinancialAccountQueryServiceController {
    getFinancialAccount(request: GetFinancialAccountRequest, ...rest: any): Promise<GetFinancialAccountResponse> | Observable<GetFinancialAccountResponse> | GetFinancialAccountResponse;
    searchFinancialAccounts(request: SearchFinancialAccountsRequest, ...rest: any): Promise<SearchFinancialAccountsResponse> | Observable<SearchFinancialAccountsResponse> | SearchFinancialAccountsResponse;
    searchAccountTransactions(request: SearchAccountTransactionsRequest, ...rest: any): Promise<SearchAccountTransactionsResponse> | Observable<SearchAccountTransactionsResponse> | SearchAccountTransactionsResponse;
    getExchangeRate(request: GetExchangeRateRequest, ...rest: any): Promise<GetExchangeRateResponse> | Observable<GetExchangeRateResponse> | GetExchangeRateResponse;
}
export declare function FinancialAccountQueryServiceControllerMethods(): (constructor: Function) => void;
export declare const FINANCIAL_ACCOUNT_QUERY_SERVICE_NAME = "FinancialAccountQueryService";
export interface FinancialAccountManagementServiceClient {
    createFinancialAccount(request: CreateFinancialAccountRequest, ...rest: any): Observable<CreateFinancialAccountResponse>;
    updateFinancialAccountBasics(request: UpdateFinancialAccountBasicsRequest, ...rest: any): Observable<UpdateFinancialAccountBasicsResponse>;
    importAccountTransactions(request: ImportAccountTransactionsRequest, ...rest: any): Observable<ImportAccountTransactionsResponse>;
    recordAccountTransaction(request: RecordAccountTransactionRequest, ...rest: any): Observable<RecordAccountTransactionResponse>;
    registerCustomerFinancialAccount(request: RegisterCustomerFinancialAccountRequest, ...rest: any): Observable<RegisterCustomerFinancialAccountResponse>;
    setExchangeRate(request: SetExchangeRateRequest, ...rest: any): Observable<SetExchangeRateResponse>;
}
export interface FinancialAccountManagementServiceController {
    createFinancialAccount(request: CreateFinancialAccountRequest, ...rest: any): Promise<CreateFinancialAccountResponse> | Observable<CreateFinancialAccountResponse> | CreateFinancialAccountResponse;
    updateFinancialAccountBasics(request: UpdateFinancialAccountBasicsRequest, ...rest: any): Promise<UpdateFinancialAccountBasicsResponse> | Observable<UpdateFinancialAccountBasicsResponse> | UpdateFinancialAccountBasicsResponse;
    importAccountTransactions(request: ImportAccountTransactionsRequest, ...rest: any): Promise<ImportAccountTransactionsResponse> | Observable<ImportAccountTransactionsResponse> | ImportAccountTransactionsResponse;
    recordAccountTransaction(request: RecordAccountTransactionRequest, ...rest: any): Promise<RecordAccountTransactionResponse> | Observable<RecordAccountTransactionResponse> | RecordAccountTransactionResponse;
    registerCustomerFinancialAccount(request: RegisterCustomerFinancialAccountRequest, ...rest: any): Promise<RegisterCustomerFinancialAccountResponse> | Observable<RegisterCustomerFinancialAccountResponse> | RegisterCustomerFinancialAccountResponse;
    setExchangeRate(request: SetExchangeRateRequest, ...rest: any): Promise<SetExchangeRateResponse> | Observable<SetExchangeRateResponse> | SetExchangeRateResponse;
}
export declare function FinancialAccountManagementServiceControllerMethods(): (constructor: Function) => void;
export declare const FINANCIAL_ACCOUNT_MANAGEMENT_SERVICE_NAME = "FinancialAccountManagementService";
export interface ReceivableQueryServiceClient {
    getReceivableSchedule(request: GetReceivableScheduleRequest, ...rest: any): Observable<GetReceivableScheduleResponse>;
    searchReceivableSchedules(request: SearchReceivableSchedulesRequest, ...rest: any): Observable<SearchReceivableSchedulesResponse>;
    getFinanceReleaseSignal(request: GetFinanceReleaseSignalRequest, ...rest: any): Observable<GetFinanceReleaseSignalResponse>;
}
export interface ReceivableQueryServiceController {
    getReceivableSchedule(request: GetReceivableScheduleRequest, ...rest: any): Promise<GetReceivableScheduleResponse> | Observable<GetReceivableScheduleResponse> | GetReceivableScheduleResponse;
    searchReceivableSchedules(request: SearchReceivableSchedulesRequest, ...rest: any): Promise<SearchReceivableSchedulesResponse> | Observable<SearchReceivableSchedulesResponse> | SearchReceivableSchedulesResponse;
    getFinanceReleaseSignal(request: GetFinanceReleaseSignalRequest, ...rest: any): Promise<GetFinanceReleaseSignalResponse> | Observable<GetFinanceReleaseSignalResponse> | GetFinanceReleaseSignalResponse;
}
export declare function ReceivableQueryServiceControllerMethods(): (constructor: Function) => void;
export declare const RECEIVABLE_QUERY_SERVICE_NAME = "ReceivableQueryService";
export interface ReceivableManagementServiceClient {
    createReceivableScheduleFromSalesOrder(request: CreateReceivableScheduleFromSalesOrderRequest, ...rest: any): Observable<CreateReceivableScheduleFromSalesOrderResponse>;
    setFinanceReleaseSignal(request: SetFinanceReleaseSignalRequest, ...rest: any): Observable<SetFinanceReleaseSignalResponse>;
}
export interface ReceivableManagementServiceController {
    createReceivableScheduleFromSalesOrder(request: CreateReceivableScheduleFromSalesOrderRequest, ...rest: any): Promise<CreateReceivableScheduleFromSalesOrderResponse> | Observable<CreateReceivableScheduleFromSalesOrderResponse> | CreateReceivableScheduleFromSalesOrderResponse;
    setFinanceReleaseSignal(request: SetFinanceReleaseSignalRequest, ...rest: any): Promise<SetFinanceReleaseSignalResponse> | Observable<SetFinanceReleaseSignalResponse> | SetFinanceReleaseSignalResponse;
}
export declare function ReceivableManagementServiceControllerMethods(): (constructor: Function) => void;
export declare const RECEIVABLE_MANAGEMENT_SERVICE_NAME = "ReceivableManagementService";
export interface PaymentQueryServiceClient {
    getPayableSchedule(request: GetPayableScheduleRequest, ...rest: any): Observable<GetPayableScheduleResponse>;
    searchPayableSchedules(request: SearchPayableSchedulesRequest, ...rest: any): Observable<SearchPayableSchedulesResponse>;
    searchPaymentRequests(request: SearchPaymentRequestsRequest, ...rest: any): Observable<SearchPaymentRequestsResponse>;
    searchPaymentExecutions(request: SearchPaymentExecutionsRequest, ...rest: any): Observable<SearchPaymentExecutionsResponse>;
    searchPaymentAllocations(request: SearchPaymentAllocationsRequest, ...rest: any): Observable<SearchPaymentAllocationsResponse>;
}
export interface PaymentQueryServiceController {
    getPayableSchedule(request: GetPayableScheduleRequest, ...rest: any): Promise<GetPayableScheduleResponse> | Observable<GetPayableScheduleResponse> | GetPayableScheduleResponse;
    searchPayableSchedules(request: SearchPayableSchedulesRequest, ...rest: any): Promise<SearchPayableSchedulesResponse> | Observable<SearchPayableSchedulesResponse> | SearchPayableSchedulesResponse;
    searchPaymentRequests(request: SearchPaymentRequestsRequest, ...rest: any): Promise<SearchPaymentRequestsResponse> | Observable<SearchPaymentRequestsResponse> | SearchPaymentRequestsResponse;
    searchPaymentExecutions(request: SearchPaymentExecutionsRequest, ...rest: any): Promise<SearchPaymentExecutionsResponse> | Observable<SearchPaymentExecutionsResponse> | SearchPaymentExecutionsResponse;
    searchPaymentAllocations(request: SearchPaymentAllocationsRequest, ...rest: any): Promise<SearchPaymentAllocationsResponse> | Observable<SearchPaymentAllocationsResponse> | SearchPaymentAllocationsResponse;
}
export declare function PaymentQueryServiceControllerMethods(): (constructor: Function) => void;
export declare const PAYMENT_QUERY_SERVICE_NAME = "PaymentQueryService";
export interface PaymentManagementServiceClient {
    createPayableScheduleFromPurchaseOrder(request: CreatePayableScheduleFromPurchaseOrderRequest, ...rest: any): Observable<CreatePayableScheduleFromPurchaseOrderResponse>;
    applyPayableScheduleAdjustmentFromPurchaseOrderChange(request: ApplyPayableScheduleAdjustmentFromPurchaseOrderChangeRequest, ...rest: any): Observable<ApplyPayableScheduleAdjustmentFromPurchaseOrderChangeResponse>;
    createPaymentRequest(request: CreatePaymentRequestRequest, ...rest: any): Observable<CreatePaymentRequestResponse>;
    decidePaymentRequest(request: DecidePaymentRequestRequest, ...rest: any): Observable<DecidePaymentRequestResponse>;
    executePaymentRequest(request: ExecutePaymentRequestRequest, ...rest: any): Observable<ExecutePaymentRequestResponse>;
    allocatePaymentToPayable(request: AllocatePaymentToPayableRequest, ...rest: any): Observable<AllocatePaymentToPayableResponse>;
    allocatePaymentToReceivable(request: AllocatePaymentToReceivableRequest, ...rest: any): Observable<AllocatePaymentToReceivableResponse>;
}
export interface PaymentManagementServiceController {
    createPayableScheduleFromPurchaseOrder(request: CreatePayableScheduleFromPurchaseOrderRequest, ...rest: any): Promise<CreatePayableScheduleFromPurchaseOrderResponse> | Observable<CreatePayableScheduleFromPurchaseOrderResponse> | CreatePayableScheduleFromPurchaseOrderResponse;
    applyPayableScheduleAdjustmentFromPurchaseOrderChange(request: ApplyPayableScheduleAdjustmentFromPurchaseOrderChangeRequest, ...rest: any): Promise<ApplyPayableScheduleAdjustmentFromPurchaseOrderChangeResponse> | Observable<ApplyPayableScheduleAdjustmentFromPurchaseOrderChangeResponse> | ApplyPayableScheduleAdjustmentFromPurchaseOrderChangeResponse;
    createPaymentRequest(request: CreatePaymentRequestRequest, ...rest: any): Promise<CreatePaymentRequestResponse> | Observable<CreatePaymentRequestResponse> | CreatePaymentRequestResponse;
    decidePaymentRequest(request: DecidePaymentRequestRequest, ...rest: any): Promise<DecidePaymentRequestResponse> | Observable<DecidePaymentRequestResponse> | DecidePaymentRequestResponse;
    executePaymentRequest(request: ExecutePaymentRequestRequest, ...rest: any): Promise<ExecutePaymentRequestResponse> | Observable<ExecutePaymentRequestResponse> | ExecutePaymentRequestResponse;
    allocatePaymentToPayable(request: AllocatePaymentToPayableRequest, ...rest: any): Promise<AllocatePaymentToPayableResponse> | Observable<AllocatePaymentToPayableResponse> | AllocatePaymentToPayableResponse;
    allocatePaymentToReceivable(request: AllocatePaymentToReceivableRequest, ...rest: any): Promise<AllocatePaymentToReceivableResponse> | Observable<AllocatePaymentToReceivableResponse> | AllocatePaymentToReceivableResponse;
}
export declare function PaymentManagementServiceControllerMethods(): (constructor: Function) => void;
export declare const PAYMENT_MANAGEMENT_SERVICE_NAME = "PaymentManagementService";
