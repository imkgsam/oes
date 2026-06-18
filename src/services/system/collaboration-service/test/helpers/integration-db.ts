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

/** ensureIntegrationDatabaseUrl loads collaboration-service DATABASE_URL for L2 tests. */
export function ensureIntegrationDatabaseUrl(): string {
  if (process.env.DATABASE_URL) {
    process.env.DATABASE_URL = withCollaborationSchema(process.env.DATABASE_URL)
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
  process.env.DATABASE_URL = withCollaborationSchema(databaseUrl)
  return process.env.DATABASE_URL
}

/** createPrismaForIntegration creates a connected PrismaService with a targeted local-db error. */
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
      `collaboration-service L2 tests require a reachable PostgreSQL database. Current DATABASE_URL target: ${safeTarget}. Cause: ${
        error instanceof Error ? error.message : String(error)
      }`
    )
  }
}

/** withCollaborationSchema keeps L2 tests inside collaboration-service storage. */
function withCollaborationSchema(rawUrl: string): string {
  const parsed = new URL(rawUrl)
  if (!parsed.searchParams.get('schema')) {
    parsed.searchParams.set('schema', 'collaboration_service')
  }
  return parsed.toString()
}

/** createTestPrefix returns a unique prefix so L2 cleanup only removes its own rows. */
export function createTestPrefix(): string {
  return `cos_l2_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

/** cleanupByPrefix removes collaboration task integration records keyed by generated prefixes. */
export async function cleanupByPrefix(prisma: PrismaService, prefix: string): Promise<void> {
  if (!prisma) return

  const tasks = await prisma.collaborationTask.findMany({
    where: {
      OR: [
        { tenantId: { startsWith: prefix } },
        { title: { startsWith: prefix } },
        { createdByAccountId: { startsWith: prefix } },
        { assigneeAccountId: { startsWith: prefix } }
      ]
    },
    select: { id: true }
  })
  const taskIds = tasks.map((task) => task.id)

  await prisma.collaborationTaskAuditEnvelope.deleteMany({
    where: {
      OR: [
        { tenantId: { startsWith: prefix } },
        taskIds.length > 0 ? { taskId: { in: taskIds } } : undefined
      ].filter(Boolean) as any
    }
  })

  await prisma.collaborationTaskEventEnvelope.deleteMany({
    where: {
      OR: [
        { tenantId: { startsWith: prefix } },
        taskIds.length > 0 ? { taskId: { in: taskIds } } : undefined
      ].filter(Boolean) as any
    }
  })

  await prisma.collaborationTask.deleteMany({
    where: {
      OR: [
        { tenantId: { startsWith: prefix } },
        { title: { startsWith: prefix } },
        { createdByAccountId: { startsWith: prefix } },
        { assigneeAccountId: { startsWith: prefix } }
      ]
    }
  })
}
