import { SalesTransactionRunner } from '../../application/ports/sales-transaction-runner.port';
/** InMemorySalesTransactionRunner executes callbacks directly for the phase 1 in-memory runtime skeleton. */
export declare class InMemorySalesTransactionRunner implements SalesTransactionRunner {
    runInTransaction<T>(callback: () => Promise<T>): Promise<T>;
}
