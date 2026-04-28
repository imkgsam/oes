/** SalesTransactionRunner wraps one command callback in the service-local transaction boundary abstraction. */
export interface SalesTransactionRunner {
    runInTransaction<T>(callback: () => Promise<T>): Promise<T>;
}
