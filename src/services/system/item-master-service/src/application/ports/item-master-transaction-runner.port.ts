/** ItemMasterTransactionRunner lets application services execute one callback inside the service persistence transaction boundary. */
export interface ItemMasterTransactionRunner {
  runInTransaction<T>(callback: () => Promise<T>): Promise<T>
}
