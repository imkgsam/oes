import { Injectable, Logger, OnModuleDestroy, OnModuleInit, Optional } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AsyncLocalStorage } from 'async_hooks'
import { GLOBAL_SYSTEM_ERRORS } from '@oes/common/constants'
import { ExceptionFactory } from '@oes/common/exceptions'
import { Prisma, PrismaClient } from '../../../prisma/generated/prisma'

export type PrismaExecutionClient = Prisma.TransactionClient | PrismaService

/** PrismaService manages the finance-service database connection and ambient transaction reuse. */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('PrismaService')
  private readonly transactionStorage = new AsyncLocalStorage<Prisma.TransactionClient>()

  constructor(@Optional() configService?: ConfigService) {
    const databaseUrl = configService?.get<string>('DATABASE_URL') ?? process.env.DATABASE_URL
    super(databaseUrl ? { datasources: { db: { url: databaseUrl } } } : undefined)
  }

  /** getExecutionClient returns the ambient Prisma transaction client when one is active. */
  getExecutionClient(): PrismaExecutionClient {
    return this.transactionStorage.getStore() ?? this
  }

  /** hasActiveTransaction tells persistence adapters whether they are already inside a Prisma transaction. */
  hasActiveTransaction(): boolean {
    return this.transactionStorage.getStore() !== undefined
  }

  /** runInTransaction executes one callback inside a shared Prisma transaction boundary. */
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
      this.logger.error('[FINANCE_SERVICE] PrismaService connection failed', exception)
      process.exit(1)
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect()
  }
}
