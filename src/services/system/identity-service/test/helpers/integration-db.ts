import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'
import { ConfigService } from '@nestjs/config'
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

export async function createPrismaForIntegration(): Promise<PrismaService> {
  const databaseUrl = ensureIntegrationDatabaseUrl()
  const configService = new ConfigService({
    DATABASE_URL: databaseUrl
  })
  const prisma = new PrismaService(configService)

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
      `L2 integration tests require a reachable PostgreSQL database. Current DATABASE_URL target: ${safeTarget}`
    )
  }
}

export function createTestPrefix(): string {
  return `idn_l2_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export async function cleanupByPrefix(prisma: PrismaService, prefix: string): Promise<void> {
  if (!prisma) return

  await prisma.auditEvent.deleteMany({
    where: {
      OR: [
        { eventId: { startsWith: prefix } },
        { operatorId: { startsWith: prefix } },
        { tenantId: { startsWith: prefix } },
        { orgId: { startsWith: prefix } },
        { resourceId: { startsWith: prefix } }
      ]
    }
  })

  await prisma.aPIKey.deleteMany({
    where: {
      OR: [
        { id: { startsWith: prefix } },
        { serviceAccountId: { startsWith: prefix } },
        { keyCode: { startsWith: prefix } },
        { createdBy: { startsWith: prefix } },
        { revokedBy: { startsWith: prefix } }
      ]
    }
  })

  await prisma.serviceAccount.deleteMany({
    where: {
      OR: [
        { id: { startsWith: prefix } },
        { tenantId: { startsWith: prefix } },
        { name: { startsWith: prefix } },
        { description: { startsWith: prefix } },
        { createdBy: { startsWith: prefix } },
        { disabledBy: { startsWith: prefix } }
      ]
    }
  })

  await prisma.accountContactAsset.deleteMany({
    where: {
      OR: [
        { value: { startsWith: prefix } },
        { accountId: { startsWith: prefix } },
        { tenantId: { startsWith: prefix } }
      ]
    }
  })

  await prisma.userAccountEmployeeBinding.deleteMany({
    where: {
      OR: [
        { accountId: { startsWith: prefix } },
        { employeeId: { startsWith: prefix } },
        { tenantId: { startsWith: prefix } }
      ]
    }
  })

  await prisma.userAccount.deleteMany({
    where: {
      OR: [{ id: { startsWith: prefix } }, { tenantId: { startsWith: prefix } }]
    }
  })

  await prisma.user.deleteMany({
    where: {
      OR: [
        { id: { startsWith: prefix } },
        { username: { startsWith: prefix } },
        { email: { startsWith: prefix } },
        { phone: { startsWith: prefix } }
      ]
    }
  })

}
