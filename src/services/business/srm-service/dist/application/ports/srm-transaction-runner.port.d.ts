/** SrmTransactionRunner executes one SRM management command inside a shared local transaction boundary. */
export interface SrmTransactionRunner {
    runInTransaction<T>(callback: () => Promise<T>): Promise<T>;
}
