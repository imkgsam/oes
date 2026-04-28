/** CrmTransactionRunner executes one CRM management command inside a shared local transaction boundary. */
export interface CrmTransactionRunner {
  runInTransaction<T>(callback: () => Promise<T>): Promise<T>
}
