import { Injectable } from '@nestjs/common'
import { CrmTransactionRunner } from '../../application/ports/crm-transaction-runner.port'
import { PrismaService } from '../prisma/prisma.service'

/** PrismaCrmTransactionRunner executes CRM management commands inside a shared Prisma transaction boundary. */
@Injectable()
export class PrismaCrmTransactionRunner implements CrmTransactionRunner {
  constructor(private readonly prisma: PrismaService) {}

  async runInTransaction<T>(callback: () => Promise<T>): Promise<T> {
    return this.prisma.runInTransaction(callback)
  }
}
