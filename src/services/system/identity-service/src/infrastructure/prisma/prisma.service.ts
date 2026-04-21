import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaClient } from '../../../prisma/generated/prisma/index'
import { GLOBAL_SYSTEM_ERRORS } from '@oes/common/constants'
import { ExceptionFactory } from '@oes/common/exceptions'

// Owns the identity-service Prisma client lifecycle and wires the service-local database URL.
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('PrismaService')

  constructor(configService: ConfigService) {
    const databaseUrl = configService.get<string>('DATABASE_URL')
    super(databaseUrl ? { datasources: { db: { url: databaseUrl } } } : undefined)
  }

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
