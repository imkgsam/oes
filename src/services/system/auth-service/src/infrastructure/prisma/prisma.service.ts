import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaClient } from '../../../prisma/generated/prisma'

// Owns the auth-service Prisma client lifecycle and wires the service-local database URL.
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(configService: ConfigService) {
    const databaseUrl = configService.get<string>('DATABASE_URL')
    super(databaseUrl ? { datasources: { db: { url: databaseUrl } } } : undefined)
  }

  // Temporary compatibility alias: schema model is OTP, legacy repository still expects oneTimeToken.
  get oneTimeToken(): any {
    return this.oTP
  }

  async onModuleInit() {
    await this.$connect()
  }

  async onModuleDestroy() {
    await this.$disconnect()
  }
}
