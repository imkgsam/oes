import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'

const L2_TEST_SCHEMA = 'mes_service_l2'

/** parseEnvValue removes optional quotes from one dotenv scalar value. */
function parseEnvValue(raw: string): string {
  const trimmed = raw.trim()
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1)
  }

  return trimmed
}

/** ensureIntegrationDatabaseUrl loads mes-service DATABASE_URL for Prisma-backed L2 tests. */
export function ensureIntegrationDatabaseUrl(): string {
  const taskOwnedUrl = process.env.OES_L2_DATABASE_URL?.trim()
  if (taskOwnedUrl) {
    process.env.DATABASE_URL = taskOwnedUrl
    return taskOwnedUrl
  }

  if (process.env.DATABASE_URL) {
    const databaseUrl = rewriteSchemaForL2(process.env.DATABASE_URL)
    process.env.DATABASE_URL = databaseUrl
    return databaseUrl
  }

  const envPath = resolve(__dirname, '../../.env')
  if (!existsSync(envPath)) {
    throw new Error(`DATABASE_URL is not set and .env was not found at ${envPath}`)
  }

  const envContent = readFileSync(envPath, 'utf8')
  const match = envContent.match(/^\s*DATABASE_URL\s*=\s*(.+)\s*$/m)

  if (!match) {
    throw new Error(`DATABASE_URL was not found in ${envPath}`)
  }

  const databaseUrl = rewriteSchemaForL2(parseEnvValue(match[1]))
  process.env.DATABASE_URL = databaseUrl
  return databaseUrl
}

/** rewriteSchemaForL2 keeps integration tests isolated from the default service schema. */
function rewriteSchemaForL2(databaseUrl: string): string {
  const parsed = new URL(databaseUrl)
  parsed.searchParams.set('schema', L2_TEST_SCHEMA)
  return parsed.toString()
}

/** createPrismaForIntegration creates a connected PrismaService or fails with a targeted local-db message. */
export async function createPrismaForIntegration(): Promise<PrismaService> {
  const databaseUrl = ensureIntegrationDatabaseUrl()
  const prisma = new PrismaService()

  try {
    await prisma.$connect()
    return prisma
  } catch (error) {
    const safeTarget = (() => {
      try {
        const parsed = new URL(databaseUrl)
        return `${parsed.hostname}:${parsed.port || '(default-port)'}/${parsed.pathname.replace(/^\//, '')}`
      } catch {
        return databaseUrl
      }
    })()

    await prisma.$disconnect().catch(() => undefined)
    throw new Error(
      `mes-service L2 tests require a reachable PostgreSQL database. Current DATABASE_URL target: ${safeTarget}. Cause: ${
        error instanceof Error ? error.message : String(error)
      }`
    )
  }
}

/** createTestPrefix returns one unique prefix so cleanup only touches rows created by one L2 run. */
export function createTestPrefix(): string {
  return `mes_l2_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

/** cleanupByPrefix removes Prisma-backed MES rows keyed by the generated tenant prefix. */
export async function cleanupByPrefix(prisma: PrismaService, prefix: string): Promise<void> {
  if (!prisma) {
    return
  }

  const where = {
    tenantId: {
      startsWith: prefix
    }
  }

  await prisma.mesCommandIdempotency.deleteMany({ where })
  await prisma.mesOutboxEvent.deleteMany({ where })
  await prisma.mesAuditEnvelope.deleteMany({ where })
  await prisma.moldUsageRecord.deleteMany({ where })
  await prisma.moldInstallationDetail.deleteMany({
    where: {
      toolingInstallation: where
    }
  })
  await prisma.toolingInstallation.deleteMany({ where })
  await prisma.moldMovement.deleteMany({ where })
  await prisma.moldLifeCounter.deleteMany({ where })
  await prisma.productionMold.deleteMany({ where })
  await prisma.masterMold.deleteMany({ where })
  await prisma.moldDesignOutput.deleteMany({ where })
  await prisma.moldDesign.deleteMany({ where })
  await prisma.productionSpec.deleteMany({ where })
  await prisma.workUnit.deleteMany({ where })
  await prisma.workCenter.deleteMany({ where })
  await prisma.carrierResource.deleteMany({ where })
  await prisma.storageResource.deleteMany({ where })
}
