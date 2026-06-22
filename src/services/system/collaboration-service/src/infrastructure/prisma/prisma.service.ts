import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { GLOBAL_SYSTEM_ERRORS } from '@oes/common/constants'
import { ExceptionFactory } from '@oes/common/exceptions'
import { PrismaClient } from '../../../prisma/generated/prisma/index'

const DEFAULT_LOCAL_DATABASE_URL = 'postgres://imkgsam:imkgsam@localhost:5432/collaborationdb'

/** PrismaService manages the collaboration-service database connection lifecycle. */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('PrismaService')

  /** constructor scopes collaboration-service storage to its own Postgres schema namespace. */
  constructor() {
    super(resolvePrismaClientOptions())
  }

  async onModuleInit() {
    try {
      await this.$connect()
      this.logger.log('PrismaService connected to the database successfully.')
    } catch (_error) {
      const exception = ExceptionFactory.infrastructure(
        GLOBAL_SYSTEM_ERRORS.DATABASE_CONNECTION_FAILED
      )
      this.logger.error('[COLLABORATION_SERVICE] PrismaService connection failed', exception)
      process.exit(1)
    }
  }

  async onModuleDestroy() {
    await this.$disconnect()
  }
}

/** resolvePrismaClientOptions applies the collaboration_service schema unless an explicit schema is provided. */
export function resolvePrismaClientOptions(): ConstructorParameters<typeof PrismaClient>[0] {
  const rawUrl =
    process.env.COLLABORATION_DATABASE_URL ||
    process.env.DATABASE_URL ||
    ((process.env.NODE_ENV ?? 'development') !== 'production' ? DEFAULT_LOCAL_DATABASE_URL : '')

  if (!rawUrl) {
    throw new Error('COLLABORATION_DATABASE_URL or DATABASE_URL is required in production.')
  }

  return {
    datasources: {
      db: {
        url: withCollaborationSchema(rawUrl)
      }
    }
  }
}

/** withCollaborationSchema keeps local shared Postgres databases from mixing service-owned tables. */
function withCollaborationSchema(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl)
    if (!parsed.searchParams.get('schema')) {
      parsed.searchParams.set('schema', 'collaboration_service')
    }
    return parsed.toString()
  } catch {
    return rawUrl
  }
}
