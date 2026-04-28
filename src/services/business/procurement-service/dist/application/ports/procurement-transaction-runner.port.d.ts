/** ProcurementTransactionRunner executes one procurement management command inside a shared local transaction boundary. */
export interface ProcurementTransactionRunner {
    runInTransaction<T>(callback: () => Promise<T>): Promise<T>;
}
