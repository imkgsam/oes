import { Injectable } from '@nestjs/common'
import { SalesTransactionRunner } from '../../application/ports/sales-transaction-runner.port'
import { PrismaService } from '../prisma/prisma.service'

/** PrismaSalesTransactionRunner executes management commands inside a shared Prisma transaction boundary. */
@Injectable()
export class PrismaSalesTransactionRunner implements SalesTransactionRunner {
  constructor(private readonly prisma: PrismaService) {}

  async runInTransaction<T>(callback: () => Promise<T>): Promise<T> {
    return this.prisma.runInTransaction(callback)
  }
}
