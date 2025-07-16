import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '../../../prisma/generated/prisma'
import { GLOBAL_SYSTEM_ERRORS } from '@oes/common/constants/res-codes/system.errors'
import { createSystemException } from '@oes/common/helpers/exception.factory'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('PrismaService')

  async onModuleInit() {
    try {
      await this.$connect()
      this.logger.log('PrismaService connected to the database successfully.')
    } catch (error) {
      const e = createSystemException(GLOBAL_SYSTEM_ERRORS.DATABASE_CONNECTION_FAILED)
      this.logger.error(`[PERMISSION_SERVICE]`, 'PrismaService connection failed:', e)
      process.exit(1)
    }
  }

  async onModuleDestroy() {
    await this.$disconnect()
  }
}
