import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'

const DEFAULT_LOCAL_DATABASE_URL = 'postgres://imkgsam:imkgsam@localhost:5432/collaborationdb'

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
  const directUrl = process.env.COLLABORATION_DATABASE_URL || process.env.DATABASE_URL
  if (directUrl) {
    process.env.DATABASE_URL = withCollaborationSchema(directUrl)
    return process.env.DATABASE_URL
  }

  const envPath = resolve(__dirname, '../../.env')
  if (existsSync(envPath)) {
    const envContent = readFileSync(envPath, 'utf8')
    const match = envContent.match(/^\s*DATABASE_URL\s*=\s*(.+)\s*$/m)

    if (!match) {
      throw new Error(`DATABASE_URL was not found in ${envPath}`)
    }

    process.env.DATABASE_URL = withCollaborationSchema(parseEnvValue(match[1]))
    return process.env.DATABASE_URL
  }

  if ((process.env.NODE_ENV ?? 'development') !== 'production') {
    process.env.DATABASE_URL = withCollaborationSchema(DEFAULT_LOCAL_DATABASE_URL)
    return process.env.DATABASE_URL
  }

  throw new Error(`DATABASE_URL is not set and .env was not found at ${envPath}`)
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

  const annotations = await prisma.collaborationAnnotation.findMany({
    where: {
      OR: [
        { tenantId: { startsWith: prefix } },
        { objectId: { startsWith: prefix } },
        { authorAccountId: { startsWith: prefix } },
        { bodyText: { startsWith: prefix } }
      ]
    },
    select: { id: true }
  })
  const annotationIds = annotations.map((annotation) => annotation.id)

  await prisma.collaborationAnnotationAuditEnvelope.deleteMany({
    where: {
      OR: [
        { tenantId: { startsWith: prefix } },
        annotationIds.length > 0 ? { annotationId: { in: annotationIds } } : undefined
      ].filter(Boolean) as any
    }
  })

  await prisma.collaborationAnnotation.deleteMany({
    where: {
      OR: [
        { tenantId: { startsWith: prefix } },
        { objectId: { startsWith: prefix } },
        { authorAccountId: { startsWith: prefix } },
        { bodyText: { startsWith: prefix } }
      ]
    }
  })

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
