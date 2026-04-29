import {
  AccountTransactionImportBatchRecord,
  AccountTransactionRecord,
  AccountTransactionSearchInput,
  ExchangeRateRecord,
  FinanceReleaseSignalRecord,
  FinancialAccountBalanceSnapshotRecord,
  FinancialAccountRecord,
  FinancialAccountSearchInput,
  PageResult,
  PayableScheduleRecord,
  PayableScheduleSearchInput,
  PaymentAllocationRecord,
  PaymentAllocationSearchInput,
  PaymentExecutionRecord,
  PaymentExecutionSearchInput,
  PaymentRequestRecord,
  PaymentRequestSearchInput,
  ReceivableScheduleRecord,
  ReceivableScheduleSearchInput,
  CustomerFinancialAccountRecord,
  SupplierFinancialAccountRecord
} from '../models/finance-records'

/** FinanceRepository defines the service-local persistence boundary for finance phase 1A aggregates and projections. */
export interface FinanceRepository {
  nextFinancialAccountNo(tenantId: string): Promise<string>
  nextReceivableScheduleNo(tenantId: string): Promise<string>
  nextPayableScheduleNo(tenantId: string): Promise<string>
  nextPaymentRequestNo(tenantId: string): Promise<string>
  saveFinancialAccount(record: FinancialAccountRecord): Promise<void>
  findFinancialAccountById(tenantId: string, financialAccountId: string): Promise<FinancialAccountRecord | null>
  searchFinancialAccounts(input: FinancialAccountSearchInput): Promise<PageResult<FinancialAccountRecord>>
  saveBalanceSnapshot(record: FinancialAccountBalanceSnapshotRecord): Promise<void>
  getLatestBalanceSnapshot(
    tenantId: string,
    financialAccountId: string
  ): Promise<FinancialAccountBalanceSnapshotRecord | null>
  getCalculatedAccountBalance(tenantId: string, financialAccountId: string): Promise<string>
  saveAccountTransaction(record: AccountTransactionRecord): Promise<void>
  findAccountTransactionById(tenantId: string, accountTransactionId: string): Promise<AccountTransactionRecord | null>
  findDuplicateAccountTransaction(
    tenantId: string,
    financialAccountId: string,
    fingerprint: string
  ): Promise<AccountTransactionRecord | null>
  searchAccountTransactions(input: AccountTransactionSearchInput): Promise<PageResult<AccountTransactionRecord>>
  saveImportBatch(record: AccountTransactionImportBatchRecord): Promise<void>
  saveCustomerFinancialAccount(record: CustomerFinancialAccountRecord): Promise<void>
  saveSupplierFinancialAccount(record: SupplierFinancialAccountRecord): Promise<void>
  findSupplierFinancialAccountById(
    tenantId: string,
    supplierFinancialAccountId: string
  ): Promise<SupplierFinancialAccountRecord | null>
  saveExchangeRate(record: ExchangeRateRecord): Promise<void>
  getExchangeRate(input: {
    tenantId: string
    baseCurrencyCode: string
    quoteCurrencyCode: string
    effectiveAt?: string
  }): Promise<ExchangeRateRecord | null>
  saveReceivableSchedule(record: ReceivableScheduleRecord): Promise<void>
  findReceivableScheduleById(
    tenantId: string,
    receivableScheduleId: string
  ): Promise<ReceivableScheduleRecord | null>
  findOpenReceivableScheduleBySalesOrderId(
    tenantId: string,
    salesOrderId: string
  ): Promise<ReceivableScheduleRecord | null>
  searchReceivableSchedules(
    input: ReceivableScheduleSearchInput
  ): Promise<PageResult<ReceivableScheduleRecord>>
  savePayableSchedule(record: PayableScheduleRecord): Promise<void>
  findPayableScheduleById(tenantId: string, payableScheduleId: string): Promise<PayableScheduleRecord | null>
  findActivePayableScheduleByPurchaseOrderId(
    tenantId: string,
    purchaseOrderId: string
  ): Promise<PayableScheduleRecord | null>
  searchPayableSchedules(input: PayableScheduleSearchInput): Promise<PageResult<PayableScheduleRecord>>
  savePaymentRequest(record: PaymentRequestRecord): Promise<void>
  findPaymentRequestById(tenantId: string, paymentRequestId: string): Promise<PaymentRequestRecord | null>
  searchPaymentRequests(input: PaymentRequestSearchInput): Promise<PageResult<PaymentRequestRecord>>
  savePaymentExecution(record: PaymentExecutionRecord): Promise<void>
  findPaymentExecutionById(
    tenantId: string,
    paymentExecutionId: string
  ): Promise<PaymentExecutionRecord | null>
  searchPaymentExecutions(input: PaymentExecutionSearchInput): Promise<PageResult<PaymentExecutionRecord>>
  allocateTransactionToReceivable(record: PaymentAllocationRecord): Promise<void>
  allocateTransactionToPayable(record: PaymentAllocationRecord): Promise<void>
  searchPaymentAllocations(
    input: PaymentAllocationSearchInput
  ): Promise<PageResult<PaymentAllocationRecord>>
  saveFinanceReleaseSignal(record: FinanceReleaseSignalRecord): Promise<void>
  getFinanceReleaseSignalBySalesOrderId(
    tenantId: string,
    salesOrderId: string
  ): Promise<FinanceReleaseSignalRecord | null>
}
