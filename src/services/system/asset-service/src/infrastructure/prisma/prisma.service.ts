import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { GLOBAL_SYSTEM_ERRORS } from '@oes/common/constants'
import { ExceptionFactory } from '@oes/common/exceptions'
import { PrismaClient } from '../../../prisma/generated/prisma/index'

// PrismaService owns the asset-service Prisma client lifecycle and local database wiring.
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy, OnModuleInit {
  private readonly logger = new Logger('PrismaService')

  constructor(configService: ConfigService) {
    const databaseUrl = configService.get<string>('DATABASE_URL')
    super(databaseUrl ? { datasources: { db: { url: databaseUrl } } } : undefined)
  }

  async onModuleInit() {
    try {
      await this.$connect()
      this.logger.log('PrismaService connected to the database successfully.')
    } catch {
      const error = ExceptionFactory.infrastructure(GLOBAL_SYSTEM_ERRORS.DATABASE_CONNECTION_FAILED)
      this.logger.error('[ASSET_SERVICE] PrismaService connection failed', error)
      process.exit(1)
    }
  }

  async onModuleDestroy() {
    await this.$disconnect()
  }
}
