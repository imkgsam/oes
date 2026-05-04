import { Injectable } from '@nestjs/common'
import { WmsTransactionRunner } from '../../application/ports/wms-transaction-runner.port'
import { PrismaService } from '../prisma/prisma.service'

/** PrismaWmsTransactionRunner executes management commands inside a shared Prisma transaction boundary. */
@Injectable()
export class PrismaWmsTransactionRunner implements WmsTransactionRunner {
  constructor(private readonly prisma: PrismaService) {}

  async runInTransaction<T>(callback: () => Promise<T>): Promise<T> {
    return this.prisma.runInTransaction(callback)
  }
}
