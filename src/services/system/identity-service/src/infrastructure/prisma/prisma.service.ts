import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '../../../prisma/generated/prisma/index'
import { GLOBAL_SYSTEM_ERRORS } from '@oes/common/constants'
import { ExceptionFactory } from '@oes/common/exceptions'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('PrismaService')

  async onModuleInit() {
    try {
      await this.$connect()
      this.logger.log('PrismaService connected to the database successfully.')
    } catch (error) {
      const e = ExceptionFactory.infrastructure(GLOBAL_SYSTEM_ERRORS.DATABASE_CONNECTION_FAILED)
      this.logger.error('[IDENTITY_SERVICE] PrismaService connection failed', e)
      process.exit(1)
    }
  }

  async onModuleDestroy() {
    await this.$disconnect()
  }
}
