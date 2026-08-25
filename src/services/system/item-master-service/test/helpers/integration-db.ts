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

/** ensureIntegrationDatabaseUrl loads the local item-master DATABASE_URL so L2 tests use the service database. */
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

/** createPrismaForIntegration creates a connected PrismaService or fails with a targeted local-db message. */
export async function createPrismaForIntegration(): Promise<PrismaService> {
  const databaseUrl = ensureIntegrationDatabaseUrl()
  const prisma = new PrismaService()

  try {
    await prisma.$connect()
    return prisma
  } catch {
    await prisma.$disconnect().catch(() => undefined)
    throw new Error(
      `item-master-service L2 tests require a reachable PostgreSQL database. Current DATABASE_URL target: ${databaseUrl}`
    )
  }
}

/** createTestPrefix returns one unique prefix so each L2 run can clean up only its own rows. */
export function createTestPrefix(): string {
  return `item_master_l2_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

/** cleanupByPrefix removes item-master integration rows keyed by the generated tenant and item prefixes. */
export async function cleanupByPrefix(prisma: PrismaService, prefix: string): Promise<void> {
  if (!prisma) return

  const items = await prisma.item.findMany({
    where: {
      OR: [
        { tenantId: { startsWith: prefix } },
        { itemCode: { startsWith: prefix } },
        { itemName: { startsWith: prefix } }
      ]
    },
    select: { id: true }
  })

  const itemIds = items.map((item) => item.id)

  await prisma.auditEvent.deleteMany({
    where: {
      OR: [
        { tenantId: { startsWith: prefix } },
        itemIds.length > 0 ? { resourceId: { in: itemIds } } : undefined
      ].filter(Boolean) as never
    }
  })

  await prisma.itemComposition.deleteMany({
    where: {
      OR: [
        { tenantId: { startsWith: prefix } },
        itemIds.length > 0 ? { parentItemId: { in: itemIds } } : undefined,
        itemIds.length > 0 ? { componentItemId: { in: itemIds } } : undefined
      ].filter(Boolean) as never
    }
  })

  await prisma.supplierItemMapping.deleteMany({
    where: {
      OR: [
        { tenantId: { startsWith: prefix } },
        { supplierId: { startsWith: prefix } },
        { supplierItemCode: { startsWith: prefix } },
        { supplierItemName: { startsWith: prefix } },
        itemIds.length > 0 ? { itemId: { in: itemIds } } : undefined
      ].filter(Boolean) as never
    }
  })

  await prisma.item.updateMany({
    where: {
      primaryCategory: {
        is: {
          tenantId: {
            startsWith: prefix
          }
        }
      }
    },
    data: {
      primaryCategoryId: null
    }
  })

  await prisma.itemCategory.deleteMany({
    where: {
      OR: [
        { tenantId: { startsWith: prefix } },
        { categoryCode: { startsWith: prefix } },
        { categoryName: { startsWith: prefix } }
      ]
    }
  })

  await prisma.item.deleteMany({
    where: {
      OR: [
        { tenantId: { startsWith: prefix } },
        { itemCode: { startsWith: prefix } },
        { itemName: { startsWith: prefix } }
      ]
    }
  })
}
