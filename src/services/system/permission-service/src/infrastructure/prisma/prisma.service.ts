import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '../../../prisma/generated/prisma'
import { ExceptionFactory } from '@oes/common/core/exceptions/exception.factory'
import { DATABASE_CONNECTION_FAILED } from '@oes/common/core/exceptions/exception-enums/infrastructure-exception.enum'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('PrismaService')

  async onModuleInit() {
    try {
      await this.$connect()
      this.logger.log('Connected to database')
    } catch (error) {
      this.logger.error('Database connection failed', error)
      throw ExceptionFactory.infrastructure(DATABASE_CONNECTION_FAILED, { error })
    }
  }

  async onModuleDestroy() {
    await this.$disconnect()
  }
}
