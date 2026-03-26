import { PrismaClient, Modules } from '../../prisma/generated/prisma'
import {
  AUTH_SESSION_PERMISSION_CODES,
  PERMISSION_MANAGEMENT_PERMISSION_CODES
} from '@oes/common/security'

type PermissionSeedItem = {
  code: string
  module: Modules
  description?: string
}

function valuesOf(record: Record<string, string>): string[] {
  return Object.values(record)
}

function buildPermissionSeedItems(): PermissionSeedItem[] {
  const items: PermissionSeedItem[] = [
    ...valuesOf(PERMISSION_MANAGEMENT_PERMISSION_CODES).map((code) => ({
      code,
      module: Modules.PERMISSION_SERVICE
    })),
    ...valuesOf(AUTH_SESSION_PERMISSION_CODES).map((code) => ({
      code,
      module: Modules.AUTH_SERVICE
    }))
  ]

  const unique = new Map<string, PermissionSeedItem>()
  for (const item of items) {
    unique.set(item.code, item)
  }

  return Array.from(unique.values())
}

async function main() {
  const prisma = new PrismaClient()

  try {
    const items = buildPermissionSeedItems()

    let upserted = 0
    for (const item of items) {
      await prisma.permission.upsert({
        where: { code: item.code },
        create: {
          code: item.code,
          module: item.module,
          description: item.description
        },
        update: {
          module: item.module,
          description: item.description
        }
      })
      upserted += 1
    }

    process.stdout.write(
      [
        '=== Permission Code Sync ===',
        `seed_count=${items.length}`,
        `upserted_count=${upserted}`
      ].join('\n') + '\n'
    )
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  process.stderr.write(`${String(error)}\n`)
  process.exitCode = 1
})
