import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'

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

/** ensureIntegrationDatabaseUrl loads srm-service DATABASE_URL for Prisma-backed L2 tests. */
export function ensureIntegrationDatabaseUrl(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL
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

  const databaseUrl = parseEnvValue(match[1])
  process.env.DATABASE_URL = databaseUrl
  return databaseUrl
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
      `srm-service L2 tests require a reachable PostgreSQL database. Current DATABASE_URL target: ${safeTarget}. Cause: ${
        error instanceof Error ? error.message : String(error)
      }`
    )
  }
}

/** createTestPrefix returns one unique prefix so cleanup only touches rows created by one L2 run. */
export function createTestPrefix(): string {
  return `srm_l2_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

/** cleanupByPrefix removes Prisma-backed SRM rows keyed by the generated tenant prefix. */
export async function cleanupByPrefix(prisma: PrismaService, prefix: string): Promise<void> {
  if (!prisma) {
    return
  }

  await prisma.srmAuditEnvelope.deleteMany({
    where: {
      tenantId: {
        startsWith: prefix
      }
    }
  })

  await prisma.supplierAddress.deleteMany({
    where: {
      tenantId: {
        startsWith: prefix
      }
    }
  })

  await prisma.supplierContact.deleteMany({
    where: {
      tenantId: {
        startsWith: prefix
      }
    }
  })

  await prisma.supplierPartyBinding.deleteMany({
    where: {
      tenantId: {
        startsWith: prefix
      }
    }
  })

  await prisma.supplierProfile.deleteMany({
    where: {
      tenantId: {
        startsWith: prefix
      }
    }
  })

  await prisma.srmSequenceCounter.deleteMany({
    where: {
      tenantId: {
        startsWith: prefix
      }
    }
  })
}
