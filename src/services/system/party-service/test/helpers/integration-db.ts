import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'

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

/** ensureIntegrationDatabaseUrl loads the local service DATABASE_URL so Integration tests use the same service database. */
export function ensureIntegrationDatabaseUrl(): string {
  const taskOwnedUrl = process.env.OES_INTEGRATION_DATABASE_URL?.trim()
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
  } catch {
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
      `party-service Integration tests require a reachable PostgreSQL database. Current DATABASE_URL target: ${safeTarget}`
    )
  }
}

/** createTestPrefix returns one unique prefix so each Integration run can clean up only its own records. */
export function createTestPrefix(): string {
  return `party_integration_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

/** cleanupByPrefix removes party-service integration records keyed by the generated test prefix. */
export async function cleanupByPrefix(prisma: PrismaService, prefix: string): Promise<void> {
  if (!prisma) return

  const prefixedTenantParties = await prisma.tenantParty.findMany({
    where: {
      OR: [
        { tenantId: { startsWith: prefix } },
        { legalName: { startsWith: prefix } },
        { displayName: { startsWith: prefix } },
        { localCode: { startsWith: prefix } },
        { registeredCountry: { startsWith: prefix } }
      ]
    },
    select: {
      id: true
    }
  })

  const prefixedTenantPartyIds = prefixedTenantParties.map((tenantParty) => tenantParty.id)

  await prisma.partyRegistrationIdempotency.deleteMany({
    where: {
      OR: [
        { idempotencyKey: { startsWith: prefix } },
        prefixedTenantPartyIds.length > 0
          ? { tenantPartyId: { in: prefixedTenantPartyIds } }
          : undefined
      ].filter(Boolean) as any
    }
  })

  await prisma.tenantPartyIdentifier.deleteMany({
    where: {
      OR: [
        { tenantId: { startsWith: prefix } },
        prefixedTenantPartyIds.length > 0
          ? { tenantPartyId: { in: prefixedTenantPartyIds } }
          : undefined,
        { normalizedValue: { startsWith: prefix } },
        { rawValue: { startsWith: prefix } }
      ].filter(Boolean) as any
    }
  })

  await prisma.tenantParty.deleteMany({
    where: {
      OR: [
        { tenantId: { startsWith: prefix } },
        { legalName: { startsWith: prefix } },
        { displayName: { startsWith: prefix } },
        { localCode: { startsWith: prefix } },
        { registeredCountry: { startsWith: prefix } }
      ]
    }
  })
}
