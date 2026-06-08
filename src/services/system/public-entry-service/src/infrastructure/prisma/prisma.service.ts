import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { GLOBAL_SYSTEM_ERRORS } from '@oes/common/constants'
import { ExceptionFactory } from '@oes/common/exceptions'
import { PrismaClient } from '../../../prisma/generated/prisma/index'

// PrismaService manages the public-entry-service database connection lifecycle.
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('PrismaService')

  async onModuleInit() {
    try {
      await this.$connect()
      this.logger.log('PrismaService connected to the database successfully.')
    } catch (_error) {
      const exception = ExceptionFactory.infrastructure(
        GLOBAL_SYSTEM_ERRORS.DATABASE_CONNECTION_FAILED
      )
      this.logger.error('[PUBLIC_ENTRY_SERVICE] PrismaService connection failed', exception)
      process.exit(1)
    }
  }

  async onModuleDestroy() {
    await this.$disconnect()
  }
}
