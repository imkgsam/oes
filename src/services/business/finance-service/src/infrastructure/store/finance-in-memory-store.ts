import {
  AccountTransactionImportBatchRecord,
  AccountTransactionRecord,
  CustomerFinancialAccountRecord,
  ExchangeRateRecord,
  FinanceReleaseSignalRecord,
  FinancialAccountBalanceSnapshotRecord,
  FinancialAccountRecord,
  PayableScheduleRecord,
  PaymentAllocationRecord,
  PaymentExecutionRecord,
  PaymentRequestRecord,
  ReceivableScheduleRecord
  ,
  SupplierFinancialAccountRecord
} from '../../domain/models/finance-records'

/** FinanceInMemoryStore keeps phase 1A records in plain maps for deterministic L1 behavior tests. */
export class FinanceInMemoryStore {
  financialAccounts = new Map<string, FinancialAccountRecord>()
  balanceSnapshots = new Map<string, FinancialAccountBalanceSnapshotRecord>()
  accountTransactions = new Map<string, AccountTransactionRecord>()
  importBatches = new Map<string, AccountTransactionImportBatchRecord>()
  customerFinancialAccounts = new Map<string, CustomerFinancialAccountRecord>()
  supplierFinancialAccounts = new Map<string, SupplierFinancialAccountRecord>()
  receivableSchedules = new Map<string, ReceivableScheduleRecord>()
  payableSchedules = new Map<string, PayableScheduleRecord>()
  paymentRequests = new Map<string, PaymentRequestRecord>()
  paymentExecutions = new Map<string, PaymentExecutionRecord>()
  paymentAllocations = new Map<string, PaymentAllocationRecord>()
  financeReleaseSignals = new Map<string, FinanceReleaseSignalRecord>()
  exchangeRates = new Map<string, ExchangeRateRecord>()
  nextFinancialAccountNoByTenant = new Map<string, number>()
  nextReceivableScheduleNoByTenant = new Map<string, number>()
  nextPayableScheduleNoByTenant = new Map<string, number>()
  nextPaymentRequestNoByTenant = new Map<string, number>()
}
