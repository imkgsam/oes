import { Injectable } from '@nestjs/common'
import { ProcurementTransactionRunner } from '../../application/ports/procurement-transaction-runner.port'
import { PrismaService } from '../prisma/prisma.service'

/** PrismaProcurementTransactionRunner executes management commands inside a shared Prisma transaction boundary. */
@Injectable()
export class PrismaProcurementTransactionRunner implements ProcurementTransactionRunner {
  constructor(private readonly prisma: PrismaService) {}

  async runInTransaction<T>(callback: () => Promise<T>): Promise<T> {
    return this.prisma.runInTransaction(callback)
  }
}
