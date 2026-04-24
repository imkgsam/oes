import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'

/** parseEnvValue removes optional quotes from a dotenv scalar value. */
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

/** ensureIntegrationDatabaseUrl loads tenant-org-service DATABASE_URL for L2 tests. */
export function ensureIntegrationDatabaseUrl(): string {
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
      `tenant-org-service L2 tests require a reachable PostgreSQL database. Current DATABASE_URL target: ${safeTarget}. Cause: ${
        error instanceof Error ? error.message : String(error)
      }`
    )
  }
}

/** createTestPrefix returns a unique prefix so each L2 run can clean up only its own rows. */
export function createTestPrefix(): string {
  return `tos_l2_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

/** cleanupByPrefix removes tenant-org integration records keyed by generated test prefixes. */
export async function cleanupByPrefix(prisma: PrismaService, prefix: string): Promise<void> {
  if (!prisma) return

  const tenants = await prisma.tenant.findMany({
    where: {
      OR: [{ code: { startsWith: prefix } }, { name: { startsWith: prefix } }]
    },
    select: { id: true }
  })
  const tenantIds = tenants.map((tenant) => tenant.id)

  await prisma.orgUnit.deleteMany({
    where: {
      OR: [
        tenantIds.length > 0 ? { tenantId: { in: tenantIds } } : undefined,
        { name: { startsWith: prefix } },
        { path: { contains: prefix } }
      ].filter(Boolean) as any
    }
  })
  await prisma.tenant.deleteMany({
    where: {
      OR: [
        tenantIds.length > 0 ? { id: { in: tenantIds } } : undefined,
        { code: { startsWith: prefix } },
        { name: { startsWith: prefix } }
      ].filter(Boolean) as any
    }
  })
}
