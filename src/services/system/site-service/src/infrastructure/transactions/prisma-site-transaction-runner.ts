import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

/** PrismaSiteTransactionRunner executes site-service commands inside one shared Prisma transaction. */
@Injectable()
export class PrismaSiteTransactionRunner {
  constructor(private readonly prisma: PrismaService) {}

  /** runInTransaction executes the provided callback inside the ambient Prisma transaction boundary. */
  async runInTransaction<T>(callback: () => Promise<T>): Promise<T> {
    return this.prisma.runInTransaction(callback)
  }
}
