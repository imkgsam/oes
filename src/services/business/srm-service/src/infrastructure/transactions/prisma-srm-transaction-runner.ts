import { Injectable } from '@nestjs/common'
import { SrmTransactionRunner } from '../../application/ports/srm-transaction-runner.port'
import { PrismaService } from '../prisma/prisma.service'

/** PrismaSrmTransactionRunner executes SRM management commands inside a shared Prisma transaction boundary. */
@Injectable()
export class PrismaSrmTransactionRunner implements SrmTransactionRunner {
  constructor(private readonly prisma: PrismaService) {}

  async runInTransaction<T>(callback: () => Promise<T>): Promise<T> {
    return this.prisma.runInTransaction(callback)
  }
}
