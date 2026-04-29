/** FinanceTransactionRunner wraps one command callback in the service-local transaction boundary abstraction. */
export interface FinanceTransactionRunner {
  runInTransaction<T>(callback: () => Promise<T>): Promise<T>
}
