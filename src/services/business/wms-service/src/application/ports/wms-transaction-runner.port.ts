/** WmsTransactionRunner executes one WMS management command inside a shared transaction boundary. */
export interface WmsTransactionRunner {
  runInTransaction<T>(callback: () => Promise<T>): Promise<T>
}
