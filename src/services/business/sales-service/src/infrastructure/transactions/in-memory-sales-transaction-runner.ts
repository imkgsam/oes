import { Injectable } from '@nestjs/common'
import { SalesTransactionRunner } from '../../application/ports/sales-transaction-runner.port'

/** InMemorySalesTransactionRunner executes callbacks directly for the phase 1 in-memory runtime skeleton. */
@Injectable()
export class InMemorySalesTransactionRunner implements SalesTransactionRunner {
  async runInTransaction<T>(callback: () => Promise<T>): Promise<T> {
    return callback()
  }
}
