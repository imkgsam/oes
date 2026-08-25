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

/** ensureIntegrationDatabaseUrl loads hr-service DATABASE_URL for L2 tests. */
export function ensureIntegrationDatabaseUrl(): string {
  const taskOwnedUrl = process.env.OES_L2_DATABASE_URL?.trim()
  if (taskOwnedUrl) {
    process.env.DATABASE_URL = taskOwnedUrl
    return taskOwnedUrl
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
      `hr-service L2 tests require a reachable PostgreSQL database. Current DATABASE_URL target: ${safeTarget}. Cause: ${
        error instanceof Error ? error.message : String(error)
      }`
    )
  }
}

/** createTestPrefix returns a unique prefix so each L2 run can clean up only its own rows. */
export function createTestPrefix(): string {
  return `hrs_l2_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

/** cleanupByPrefix removes HR integration records keyed by generated test prefixes. */
export async function cleanupByPrefix(prisma: PrismaService, prefix: string): Promise<void> {
  if (!prisma) return

  const employees = await prisma.employee.findMany({
    where: {
      OR: [
        { tenantId: { startsWith: prefix } },
        { tenantPartyId: { startsWith: prefix } },
        { employeeCode: { startsWith: prefix } }
      ]
    },
    select: { id: true }
  })
  const employeeIds = employees.map((employee) => employee.id)

  await prisma.employeeOnboardingAccess.deleteMany({
    where: {
      OR: [
        employeeIds.length > 0 ? { employeeId: { in: employeeIds } } : undefined,
        { tenantId: { startsWith: prefix } },
        { accountId: { startsWith: prefix } }
      ].filter(Boolean) as any
    }
  })
  await prisma.employment.deleteMany({
    where: {
      OR: [
        employeeIds.length > 0 ? { employeeId: { in: employeeIds } } : undefined,
        { tenantId: { startsWith: prefix } },
        { orgUnitId: { startsWith: prefix } }
      ].filter(Boolean) as any
    }
  })
  await prisma.employee.deleteMany({
    where: {
      OR: [
        employeeIds.length > 0 ? { id: { in: employeeIds } } : undefined,
        { tenantId: { startsWith: prefix } },
        { tenantPartyId: { startsWith: prefix } },
        { employeeCode: { startsWith: prefix } }
      ].filter(Boolean) as any
    }
  })
}
