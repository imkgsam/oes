import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaClient } from '../../../prisma/generated/prisma'

// PrismaService owns terminal-device-service database access and lifecycle.
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  // Constructs the service-scoped Prisma client with the terminal-device-service database URL.
  constructor(configService?: ConfigService) {
    const databaseUrl = configService?.get<string>('DATABASE_URL') ?? process.env.DATABASE_URL
    super(databaseUrl ? { datasources: { db: { url: databaseUrl } } } : undefined)
  }

  // Opens the database connection when Nest initializes this service.
  async onModuleInit(): Promise<void> {
    await this.$connect()
  }

  // Closes the database connection when Nest shuts this service down.
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect()
  }
}
