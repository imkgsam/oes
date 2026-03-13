import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '../../../prisma/generated/prisma'
import { ExceptionFactory } from '@oes/common/exceptions'
import { DATABASE_CONNECTION_FAILED } from '@oes/common/exceptions'

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
