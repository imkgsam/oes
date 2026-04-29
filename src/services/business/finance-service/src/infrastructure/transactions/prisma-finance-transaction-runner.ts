import { Injectable } from '@nestjs/common'
import { FinanceTransactionRunner } from '../../application/ports/finance-transaction-runner.port'
import { PrismaService } from '../prisma/prisma.service'

/** PrismaFinanceTransactionRunner executes management commands inside a shared Prisma transaction boundary. */
@Injectable()
export class PrismaFinanceTransactionRunner implements FinanceTransactionRunner {
  constructor(private readonly prisma: PrismaService) {}

  async runInTransaction<T>(callback: () => Promise<T>): Promise<T> {
    return this.prisma.runInTransaction(callback)
  }
}
