import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'

/** parseEnvValue removes optional dotenv quotes from one scalar DATABASE_URL value. */
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

/** ensureIntegrationDatabaseUrl loads site-service DATABASE_URL for Prisma-backed L2 tests. */
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

/** createPrismaForIntegration creates a connected PrismaService or fails with the local DB target. */
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
      `site-service L2 tests require a reachable PostgreSQL database. Current DATABASE_URL target: ${safeTarget}. Cause: ${
        error instanceof Error ? error.message : String(error)
      }`
    )
  }
}

/** createTestPrefix returns one unique prefix so cleanup only touches rows created by one L2 run. */
export function createTestPrefix(): string {
  return `site_l2_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

/** cleanupByPrefix removes Prisma-backed site-service rows keyed by a generated tenant prefix. */
export async function cleanupByPrefix(prisma: PrismaService, prefix: string): Promise<void> {
  if (!prisma) {
    return
  }

  const tenantWhere = { tenantId: { startsWith: prefix } }
  await prisma.siteExposurePublication.deleteMany({ where: { site: tenantWhere } })
  await prisma.siteCapabilityRegistration.deleteMany({ where: { site: tenantWhere } })
  await prisma.siteCapabilityRegistrationStream.deleteMany({ where: { site: tenantWhere } })
  await prisma.siteExposureDraft.deleteMany({ where: { site: tenantWhere } })
  await prisma.sitePageGovernance.deleteMany({ where: { site: tenantWhere } })
  await prisma.sitePageCapability.deleteMany({ where: { site: tenantWhere } })
  await prisma.siteAuditEnvelope.deleteMany({ where: tenantWhere })
  await prisma.siteSyncResource.deleteMany({ where: { syncBatch: tenantWhere } })
  await prisma.siteSyncBatch.deleteMany({ where: tenantWhere })
  await prisma.sitePublicView.deleteMany({ where: tenantWhere })
  await prisma.sitePublicViewRevision.deleteMany({ where: tenantWhere })
  await prisma.siteSlugLedger.deleteMany({ where: { site: tenantWhere } })
  await prisma.siteContentLocaleVersion.deleteMany({ where: { contentEntry: tenantWhere } })
  await prisma.siteContentEntry.deleteMany({ where: tenantWhere })
  await prisma.siteProductPublication.deleteMany({ where: tenantWhere })
  await prisma.siteCredentialNonce.deleteMany({ where: { credential: { site: tenantWhere } } })
  await prisma.siteCredential.deleteMany({ where: { site: tenantWhere } })
  await prisma.siteRuntimeStatus.deleteMany({ where: { site: tenantWhere } })
  await prisma.siteLocale.deleteMany({ where: { site: tenantWhere } })
  await prisma.site.deleteMany({ where: tenantWhere })
}
