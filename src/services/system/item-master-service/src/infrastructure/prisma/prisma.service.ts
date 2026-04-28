import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { AsyncLocalStorage } from 'async_hooks'
import { GLOBAL_SYSTEM_ERRORS } from '@oes/common/constants'
import { ExceptionFactory } from '@oes/common/exceptions'
import { Prisma, PrismaClient } from '../../../prisma/generated/prisma'

export type PrismaExecutionClient = Prisma.TransactionClient | PrismaService

/** PrismaService manages the item-master-service database connection lifecycle. */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('PrismaService')
  private readonly transactionStorage = new AsyncLocalStorage<Prisma.TransactionClient>()

  /** getExecutionClient exposes the ambient transaction client when one is active for command-side atomicity. */
  getExecutionClient(): PrismaExecutionClient {
    return this.transactionStorage.getStore() ?? this
  }

  /** hasActiveTransaction tells repositories whether they should avoid starting a nested Prisma transaction. */
  hasActiveTransaction(): boolean {
    return this.transactionStorage.getStore() !== undefined
  }

  /** runInTransaction executes one callback inside a shared Prisma transaction and reuses any existing transaction. */
  async runInTransaction<T>(callback: () => Promise<T>): Promise<T> {
    if (this.hasActiveTransaction()) {
      return callback()
    }

    return this.$transaction((transaction) => this.transactionStorage.run(transaction, callback))
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect()
      this.logger.log('PrismaService connected to the database successfully.')
    } catch (_error) {
      const exception = ExceptionFactory.infrastructure(GLOBAL_SYSTEM_ERRORS.DATABASE_CONNECTION_FAILED)
      this.logger.error('[ITEM_MASTER_SERVICE] PrismaService connection failed', exception)
      process.exit(1)
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect()
  }
}
