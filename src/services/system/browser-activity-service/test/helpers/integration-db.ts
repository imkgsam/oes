import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'

// parseEnvValue strips simple shell quotes from .env values used by integration tests.
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

// ensureIntegrationDatabaseUrl loads browser-activity-service DATABASE_URL for Integration persistence tests.
export function ensureIntegrationDatabaseUrl(): string {
  if (process.env.DATABASE_URL?.trim()) {
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

// createPrismaForIntegration creates a connected browser-activity-service Prisma client.
export async function createPrismaForIntegration(): Promise<PrismaService> {
  const databaseUrl = ensureIntegrationDatabaseUrl()
  const prisma = new PrismaService(new ConfigService({ DATABASE_URL: databaseUrl }))

  try {
    await prisma.$connect()
    return prisma
  } catch {
    await prisma.$disconnect().catch(() => undefined)
    throw new Error('Integration integration tests require a reachable browser-activity-service PostgreSQL database')
  }
}

// createTestPrefix returns a unique string for isolating integration test records.
export function createTestPrefix(): string {
  return `ba_integration_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

// cleanupByPrefix deletes integration test records without touching unrelated service data.
export async function cleanupByPrefix(prisma: PrismaService, prefix: string): Promise<void> {
  await prisma.browserActivityReadAudit.deleteMany({
    where: {
      OR: [{ tenantId: { startsWith: prefix } }, { operatorAccountId: { startsWith: prefix } }]
    }
  })
  await prisma.browserActivityHeartbeat.deleteMany({
    where: {
      OR: [
        { tenantId: { startsWith: prefix } },
        { extensionSessionId: { startsWith: prefix } },
        { accountId: { startsWith: prefix } }
      ]
    }
  })
  await prisma.browserActivityOnlinePresence.deleteMany({
    where: {
      OR: [
        { tenantId: { startsWith: prefix } },
        { extensionSessionId: { startsWith: prefix } },
        { accountId: { startsWith: prefix } }
      ]
    }
  })
  await prisma.browserActivityEmployeeAuditGrant.deleteMany({
    where: {
      OR: [
        { tenantId: { startsWith: prefix } },
        { accountId: { startsWith: prefix } },
        { updatedBy: { startsWith: prefix } }
      ]
    }
  })
  await prisma.browserActivityVisitSession.deleteMany({
    where: {
      OR: [
        { tenantId: { startsWith: prefix } },
        { clientVisitId: { startsWith: prefix } },
        { extensionSessionId: { startsWith: prefix } },
        { employeeAccountId: { startsWith: prefix } }
      ]
    }
  })
  await prisma.browserActivityPolicy.deleteMany({
    where: {
      OR: [{ tenantId: { startsWith: prefix } }, { updatedBy: { startsWith: prefix } }]
    }
  })
}
