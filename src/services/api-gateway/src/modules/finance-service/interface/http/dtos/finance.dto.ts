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
  page?: number
  pageSize?: number
  receivableScheduleId?: string
  receivableScheduleLineId?: string
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
