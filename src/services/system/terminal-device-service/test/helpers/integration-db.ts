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

// ensureIntegrationDatabaseUrl loads the service-local DATABASE_URL for L2 persistence tests.
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

// createPrismaForIntegration creates a connected terminal-device-service Prisma client.
export async function createPrismaForIntegration(): Promise<PrismaService> {
  const databaseUrl = ensureIntegrationDatabaseUrl()
  const prisma = new PrismaService(new ConfigService({ DATABASE_URL: databaseUrl }))

  try {
    await prisma.$connect()
    return prisma
  } catch {
    await prisma.$disconnect().catch(() => undefined)
    throw new Error('L2 integration tests require a reachable terminal-device-service PostgreSQL database')
  }
}

// createTestPrefix returns a unique string for isolating integration test records.
export function createTestPrefix(): string {
  return `td_l2_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

// cleanupByPrefix deletes integration test records without touching unrelated service data.
export async function cleanupByPrefix(prisma: PrismaService, prefix: string): Promise<void> {
  await prisma.terminalDeviceHeartbeatRecord.deleteMany({
    where: {
      OR: [
        { heartbeatId: { startsWith: prefix } },
        { terminalDeviceId: { startsWith: prefix } },
        { tenantId: { startsWith: prefix } }
      ]
    }
  })
  await prisma.terminalDeviceRuntimeSnapshot.deleteMany({
    where: {
      OR: [{ terminalDeviceId: { startsWith: prefix } }, { tenantId: { startsWith: prefix } }]
    }
  })
  await prisma.terminalDeviceAuditEvent.deleteMany({
    where: {
      OR: [
        { auditEventId: { startsWith: prefix } },
        { tenantId: { startsWith: prefix } },
        { operatorAccountId: { startsWith: prefix } },
        { targetTerminalDeviceId: { startsWith: prefix } }
      ]
    }
  })
  await prisma.terminalDevice.deleteMany({
    where: {
      OR: [
        { terminalDeviceId: { startsWith: prefix } },
        { tenantId: { startsWith: prefix } },
        { enrollmentId: { startsWith: prefix } }
      ]
    }
  })
  await prisma.terminalDeviceEnrollment.deleteMany({
    where: {
      OR: [
        { enrollmentId: { startsWith: prefix } },
        { tenantId: { startsWith: prefix } },
        { codeHash: { startsWith: prefix } },
        { createdBy: { startsWith: prefix } }
      ]
    }
  })
  await prisma.terminalDeviceVersionPolicy.deleteMany({
    where: {
      OR: [
        { versionPolicyId: { startsWith: prefix } },
        { tenantId: { startsWith: prefix } },
        { updatedBy: { startsWith: prefix } }
      ]
    }
  })
}
