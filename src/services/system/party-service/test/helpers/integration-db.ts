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

/** ensureIntegrationDatabaseUrl loads the local service DATABASE_URL so L2 tests use the same service database. */
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
      `party-service L2 tests require a reachable PostgreSQL database. Current DATABASE_URL target: ${safeTarget}`
    )
  }
}

/** createTestPrefix returns one unique prefix so each L2 run can clean up only its own records. */
export function createTestPrefix(): string {
  return `party_l2_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

/** cleanupByPrefix removes party-service integration records keyed by the generated test prefix. */
export async function cleanupByPrefix(prisma: PrismaService, prefix: string): Promise<void> {
  if (!prisma) return

  const prefixedParties = await prisma.party.findMany({
    where: {
      OR: [{ canonicalName: { startsWith: prefix } }, { displayName: { startsWith: prefix } }]
    },
    select: {
      id: true
    }
  })

  const prefixedIdentifiers = await prisma.partyIdentifier.findMany({
    where: {
      OR: [{ normalizedValue: { startsWith: prefix } }, { rawValue: { startsWith: prefix } }]
    },
    select: {
      partyId: true
    }
  })

  const prefixedTenantParties = await prisma.tenantParty.findMany({
    where: {
      OR: [
        { tenantId: { startsWith: prefix } },
        { localDisplayName: { startsWith: prefix } },
        { localCode: { startsWith: prefix } }
      ]
    },
    select: {
      partyId: true
    }
  })

  const prefixedPartyIds = Array.from(
    new Set([
      ...prefixedParties.map((party) => party.id),
      ...prefixedIdentifiers.map((identifier) => identifier.partyId),
      ...prefixedTenantParties.map((tenantParty) => tenantParty.partyId)
    ])
  )

  await prisma.partyRegistrationIdempotency.deleteMany({
    where: {
      OR: [
        { idempotencyKey: { startsWith: prefix } },
        prefixedPartyIds.length > 0 ? { partyId: { in: prefixedPartyIds } } : undefined
      ].filter(Boolean) as any
    }
  })

  if (prefixedPartyIds.length > 0) {
    await prisma.partyRelationship.deleteMany({
      where: {
        OR: [{ fromPartyId: { in: prefixedPartyIds } }, { toPartyId: { in: prefixedPartyIds } }]
      }
    })
  }

  await prisma.partyIdentifier.deleteMany({
    where: {
      OR: [
        prefixedPartyIds.length > 0 ? { partyId: { in: prefixedPartyIds } } : undefined,
        { normalizedValue: { startsWith: prefix } },
        { rawValue: { startsWith: prefix } }
      ].filter(Boolean) as any
    }
  })

  await prisma.tenantParty.deleteMany({
    where: {
      OR: [
        { tenantId: { startsWith: prefix } },
        prefixedPartyIds.length > 0 ? { partyId: { in: prefixedPartyIds } } : undefined,
        { localDisplayName: { startsWith: prefix } },
        { localCode: { startsWith: prefix } }
      ].filter(Boolean) as any
    }
  })

  await prisma.personParty.deleteMany({
    where: {
      OR: [
        prefixedPartyIds.length > 0 ? { partyId: { in: prefixedPartyIds } } : undefined,
        { legalName: { startsWith: prefix } },
        { preferredName: { startsWith: prefix } }
      ].filter(Boolean) as any
    }
  })

  await prisma.organizationParty.deleteMany({
    where: {
      OR: [
        prefixedPartyIds.length > 0 ? { partyId: { in: prefixedPartyIds } } : undefined,
        { legalName: { startsWith: prefix } },
        { registeredCountry: { startsWith: prefix } },
        { registrationStatus: { startsWith: prefix } }
      ].filter(Boolean) as any
    }
  })

  await prisma.party.deleteMany({
    where: {
      OR: [
        prefixedPartyIds.length > 0 ? { id: { in: prefixedPartyIds } } : undefined,
        { canonicalName: { startsWith: prefix } },
        { displayName: { startsWith: prefix } }
      ].filter(Boolean) as any
    }
  })
}
