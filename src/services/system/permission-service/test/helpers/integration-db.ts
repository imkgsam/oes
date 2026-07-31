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
      `L2 integration tests require a reachable PostgreSQL database. Current DATABASE_URL target: ${safeTarget}`
    )
  }
}

export function createTestPrefix(): string {
  return `perm_l2_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export async function cleanupByPrefix(prisma: PrismaService, prefix: string): Promise<void> {
  if (!prisma) return

  const permissions = await prisma.permission.findMany({
    where: {
      code: {
        startsWith: prefix
      }
    },
    select: {
      id: true,
      code: true
    }
  })

  const permissionIds = permissions.map((permission) => permission.id)
  const permissionCodes = permissions.map((permission) => permission.code)

  await prisma.rolePermission.deleteMany({
    where: {
      OR: [
        permissionIds.length > 0 ? { permissionId: { in: permissionIds } } : undefined,
        {
          role: {
            code: {
              startsWith: prefix
            }
          }
        }
      ].filter(Boolean) as any
    }
  })

  await prisma.principalRoleBinding.deleteMany({
    where: {
      OR: [
        {
          role: {
            code: {
              startsWith: prefix
            }
          }
        },
        {
          principalId: {
            startsWith: prefix
          }
        }
      ]
    }
  })

  await prisma.onboardingGrantRequest.deleteMany({
    where: {
      OR: [
        {
          idempotencyKey: {
            startsWith: prefix
          }
        },
        {
          accountId: {
            startsWith: prefix
          }
        },
        {
          tenantId: {
            startsWith: prefix
          }
        }
      ]
    }
  })

  if (permissionCodes.length > 0) {
    await prisma.policyInstance.deleteMany({
      where: {
        permissionCode: {
          in: permissionCodes
        }
      }
    })

    await prisma.policy.deleteMany({
      where: {
        permissionCode: {
          in: permissionCodes
        }
      }
    })
  }

  await prisma.policy.deleteMany({
    where: {
      name: {
        startsWith: prefix
      }
    }
  })

  await prisma.role.deleteMany({
    where: {
      code: {
        startsWith: prefix
      }
    }
  })

  if (permissionIds.length > 0 || permissionCodes.length > 0) {
    await prisma.permission.deleteMany({
      where: {
        OR: [
          permissionIds.length > 0 ? { id: { in: permissionIds } } : undefined,
          {
            code: {
              startsWith: prefix
            }
          }
        ].filter(Boolean) as any
      }
    })
  }
}
