/** SearchFinancialAccountsDto captures the supported finance account directory filters for the tenant finance workspace. */
export class SearchFinancialAccountsDto {
  accountType?: string
  currencyCode?: string
  keyword?: string
  orgId?: string
  page?: number
  pageSize?: number
  status?: string
}

/** CreateFinancialAccountDto captures the minimal finance company-account creation payload. */
export class CreateFinancialAccountDto {
  accountIdentifier!: string
  accountName!: string
  accountType!: string
  currencyCode!: string
  institutionName?: string
  openingBalance?: string
  openingBalanceAsOf?: string
  orgId?: string
}

/** UpdateFinancialAccountBasicsDto captures the minimal finance account-basics replacement payload. */
export class UpdateFinancialAccountBasicsDto {
  accountIdentifier?: string
  accountName!: string
  auditReason?: string
  institutionName?: string
  status!: string
}

/** SearchAccountTransactionsDto captures the supported finance account-transaction directory filters. */
export class SearchAccountTransactionsDto {
  allocationStatus?: string
  direction?: string
  externalReference?: string
  financialAccountId?: string
  occurredFrom?: string
  occurredTo?: string
  orgId?: string
  page?: number
  pageSize?: number
  sourceType?: string
}

/** ImportAccountTransactionInputDto captures one imported finance real-transaction row. */
export class ImportAccountTransactionInputDto {
  amount!: string
  counterpartyAccountSnapshot?: string
  counterpartyName?: string
  currencyCode!: string
  direction!: string
  externalReference?: string
  memo?: string
  transactionTime!: string
  valueDate?: string
}

/** ImportAccountTransactionsDto captures the finance batch-import payload for real account transactions. */
export class ImportAccountTransactionsDto {
  attachmentRef?: string
  auditReason?: string
  fileAssetId?: string
  importedBy?: string
  sourceBatchReference?: string
  sourceType?: string
  transactions!: ImportAccountTransactionInputDto[]
}

/** RecordAccountTransactionDto captures the finance manual account-transaction recording payload. */
export class RecordAccountTransactionDto {
  amount!: string
  attachmentRef?: string
  auditReason?: string
  counterpartyAccountSnapshot?: string
  counterpartyName?: string
  currencyCode!: string
  direction!: string
  externalReference?: string
  fileAssetId?: string
  memo?: string
  sourceType?: string
  status?: string
  transactionTime!: string
  valueDate?: string
}

/** RegisterCustomerFinancialAccountDto captures the finance customer remittance-account registration payload. */
export class RegisterCustomerFinancialAccountDto {
  accountHolderName!: string
  accountIdentifier!: string
  accountProviderType!: string
  auditReason?: string
  currencyCode?: string
  customerTenantPartyId!: string
  isDefault?: boolean
}

/** SearchPayableSchedulesDto captures the supported payable directory filters for the phase 1B finance workspace. */
export class SearchPayableSchedulesDto {
  dueFrom?: string
  dueTo?: string
  keyword?: string
  orgId?: string
  overdueOnly?: boolean
  page?: number
  pageSize?: number
  requestGovernanceStatus?: string
  sourcePurchaseOrderId?: string
  status?: string
  supplierTenantPartyId?: string
}

/** SearchPaymentRequestsDto captures the supported payment-request directory filters for phase 1B payment governance. */
export class SearchPaymentRequestsDto {
  beneficiarySupplierFinancialAccountId?: string
  orgId?: string
  page?: number
  pageSize?: number
  requestedFrom?: string
  requestedTo?: string
  requestSource?: string
  sourcePurchaseOrderId?: string
  status?: string
  supplierTenantPartyId?: string
}

/** SearchPaymentExecutionsDto captures the supported payment-execution directory filters for phase 1B payment records. */
export class SearchPaymentExecutionsDto {
  executedFrom?: string
  executedTo?: string
  linkedAccountTransactionId?: string
  orgId?: string
  page?: number
  pageSize?: number
  paymentRequestId?: string
  sourceFinancialAccountId?: string
  status?: string
  supplierTenantPartyId?: string
}

/** CreatePayableScheduleFromPurchaseOrderLineDto captures one payable schedule line derived from a controlled PO summary. */
export class CreatePayableScheduleFromPurchaseOrderLineDto {
  dueDate!: string
  lineType!: string
  memo?: string
  scheduledAmount!: string
  sourcePurchaseOrderLineId?: string
  sourceRef!: string
}

/** CreatePayableScheduleFromPurchaseOrderDto captures the phase 1B payable schedule creation command payload. */
export class CreatePayableScheduleFromPurchaseOrderDto {
  auditReason?: string
  currencyCode!: string
  lines!: CreatePayableScheduleFromPurchaseOrderLineDto[]
  orgId?: string
  procurementSnapshotReference?: string
  purchaseOrderId!: string
  purchaseOrderNo?: string
  supplierSnapshot!: string
  supplierTenantPartyId!: string
}

/** ApplyPayableScheduleAdjustmentItemDto captures one PO-change-driven payable adjustment instruction. */
export class ApplyPayableScheduleAdjustmentItemDto {
  action!: string
  dueDate?: string
  lineType?: string
  memo?: string
  newSourceRef?: string
  scheduledAmount?: string
  sourcePurchaseOrderLineId?: string
  targetSourceRef?: string
}

/** ApplyPayableScheduleAdjustmentFromPurchaseOrderChangeDto captures a controlled PO change adjustment command payload. */
export class ApplyPayableScheduleAdjustmentFromPurchaseOrderChangeDto {
  adjustments!: ApplyPayableScheduleAdjustmentItemDto[]
  auditReason?: string
  changeReason?: string
  orgId?: string
  procurementSnapshotReference?: string
  purchaseOrderChangeId!: string
  purchaseOrderId!: string
}

/** PaymentRequestLineInputDto captures one requested amount against a payable schedule line. */
export class PaymentRequestLineInputDto {
  payableScheduleId!: string
  payableScheduleLineId!: string
  requestedAmount!: string
}

/** SupplierBillEvidenceSnapshotInputDto captures a supplier document evidence snapshot without creating full AP lifecycle objects. */
export class SupplierBillEvidenceSnapshotInputDto {
  attachmentRef?: string
  currencyCode?: string
  documentAmount?: string
  documentDate?: string
  evidenceType!: string
  externalDocumentNo?: string
  note?: string
}

/** CreatePaymentRequestDto captures the minimal phase 1B payment-request command payload. */
export class CreatePaymentRequestDto {
  auditReason?: string
  beneficiarySupplierFinancialAccountId!: string
  currencyCode!: string
  evidenceSnapshots?: SupplierBillEvidenceSnapshotInputDto[]
  orgId?: string
  reason?: string
  requestedAmount!: string
  requestedLines!: PaymentRequestLineInputDto[]
  requestSource!: string
  sourcePurchaseOrderId?: string
  supplierTenantPartyId!: string
}

/** DecidePaymentRequestDto captures one phase 1B approve/reject decision command payload. */
export class DecidePaymentRequestDto {
  auditReason?: string
  decision!: string
  decisionReason?: string
}

/** ExecutePaymentRequestDto captures one finance payment execution record command payload. */
export class ExecutePaymentRequestDto {
  attachmentRefs?: string[]
  auditReason?: string
  currencyCode!: string
  executedAmount!: string
  executedAt!: string
  executionReference?: string
  linkedAccountTransactionId?: string
  sourceFinancialAccountId!: string
}

/** GetExchangeRateDto captures the point lookup key for one finance standard FX record. */
export class GetExchangeRateDto {
  baseCurrencyCode!: string
  effectiveAt?: string
  quoteCurrencyCode!: string
}

/** SetExchangeRateDto captures the finance standard FX write payload. */
export class SetExchangeRateDto {
  auditReason?: string
  baseCurrencyCode!: string
  effectiveAt!: string
  quoteCurrencyCode!: string
  rateValue!: string
  setBy?: string
}

/** SearchReceivableSchedulesDto captures the supported receivable directory filters for the tenant finance workspace. */
export class SearchReceivableSchedulesDto {
  customerTenantPartyId?: string
  dueFrom?: string
  dueTo?: string
  financeReleaseStatus?: string
  keyword?: string
  orgId?: string
  overdueOnly?: boolean
  page?: number
  pageSize?: number
  sourceSalesOrderId?: string
  status?: string
}

/** CreateReceivableScheduleLineInputDto captures one receivable line entering the finance phase 1A schedule creation command. */
export class CreateReceivableScheduleLineInputDto {
  dueDate!: string
  memo?: string
  scheduledAmount!: string
  sourceSalesOrderLineId?: string
}

/** CreateReceivableScheduleFromSalesOrderDto captures the minimal finance schedule creation payload derived from one established sales order. */
export class CreateReceivableScheduleFromSalesOrderDto {
  auditReason?: string
  currencyCode!: string
  customerSnapshot!: string
  customerTenantPartyId!: string
  lines!: CreateReceivableScheduleLineInputDto[]
  orgId?: string
  salesExchangeRateSnapshot?: string
  salesOrderId!: string
}

/** SetFinanceReleaseSignalDto captures the finance release signal write payload. */
export class SetFinanceReleaseSignalDto {
  auditReason?: string
  basedOnSummary?: string
  customerTenantPartyId!: string
  effectiveAt!: string
  expiresAt?: string
  reasonCode?: string
  reasonSummary?: string
  signalStatus!: string
}

/** SearchPaymentAllocationsDto captures the supported receivable-allocation directory filters for the tenant finance workspace. */
export class SearchPaymentAllocationsDto {
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

/** AllocatePaymentToReceivableItemDto captures one receipt-allocation row against one receivable schedule line. */
export class AllocatePaymentToReceivableItemDto {
  allocatedAmount!: string
  receivableScheduleId!: string
  receivableScheduleLineId!: string
}

/** AllocatePaymentToReceivableDto captures the finance receipt-allocation payload. */
export class AllocatePaymentToReceivableDto {
  accountTransactionId!: string
  allocations!: AllocatePaymentToReceivableItemDto[]
  auditReason?: string
}

/** AllocatePaymentToPayableItemDto captures one real outflow allocation row against one payable schedule line. */
export class AllocatePaymentToPayableItemDto {
  allocatedAmount!: string
  payableScheduleId!: string
  payableScheduleLineId!: string
}

/** AllocatePaymentToPayableDto captures the finance payable allocation payload centered on a real outflow transaction. */
export class AllocatePaymentToPayableDto {
  accountTransactionId!: string
  allocations!: AllocatePaymentToPayableItemDto[]
  auditReason?: string
  paymentExecutionId?: string
}
