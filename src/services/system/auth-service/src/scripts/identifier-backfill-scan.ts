import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'
import { LoginMethodType as CommonLoginMethodType } from '../common/constants'
import { LoginMethodType, PrismaClient } from '../../prisma/generated/prisma'
import { AuthIdentifierNormalizer } from '../domain/services/auth-identifier-normalizer'

type LoginMethodRow = {
  id: string
  userId: string
  type: LoginMethodType
  identifier: string
}

type CollisionItem = {
  normalizedIdentifier: string
  rows: LoginMethodRow[]
}

type ScanOptions = {
  limit: number
  failOnCollision: boolean
}

function loadDotEnvIfNeeded(): void {
  if (process.env.DATABASE_URL) {
    return
  }

  const envPath = resolve(process.cwd(), '.env')
  if (!existsSync(envPath)) {
    return
  }

  const content = readFileSync(envPath, 'utf8')
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) {
      continue
    }

    const separatorIndex = line.indexOf('=')
    if (separatorIndex <= 0) {
      continue
    }

    const key = line.slice(0, separatorIndex).trim()
    let value = line.slice(separatorIndex + 1).trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    if (!(key in process.env)) {
      process.env[key] = value
    }
  }
}

function parseArgs(argv: string[]): ScanOptions {
  const limitArg = argv.find((arg) => arg.startsWith('--limit='))
  const limit = limitArg ? Number(limitArg.split('=')[1]) : 20

  return {
    limit: Number.isFinite(limit) && limit > 0 ? limit : 20,
    failOnCollision: argv.includes('--fail-on-collision')
  }
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2))
  loadDotEnvIfNeeded()
  const prisma = new PrismaClient()

  try {
    const loginMethods = await prisma.loginMethod.findMany({
      select: {
        id: true,
        userId: true,
        type: true,
        identifier: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    const driftRows: Array<LoginMethodRow & { normalizedIdentifier: string }> = []
    const grouped = new Map<string, LoginMethodRow[]>()

    for (const row of loginMethods) {
      const normalizedIdentifier = AuthIdentifierNormalizer.normalize(
        row.type as unknown as CommonLoginMethodType,
        row.identifier
      )

      if (row.identifier !== normalizedIdentifier) {
        driftRows.push({
          ...row,
          normalizedIdentifier
        })
      }

      const groupKey = `${row.type}:${normalizedIdentifier}`
      const items = grouped.get(groupKey) ?? []
      items.push(row)
      grouped.set(groupKey, items)
    }

    const collisions: CollisionItem[] = [...grouped.entries()]
      .filter(([, rows]) => rows.length > 1)
      .map(([groupKey, rows]) => ({
        normalizedIdentifier: groupKey,
        rows
      }))

    const byType = loginMethods.reduce<Record<string, number>>((acc, row) => {
      acc[row.type] = (acc[row.type] ?? 0) + 1
      return acc
    }, {})

    console.log('=== Identifier Backfill Scan ===')
    console.log(`total_login_methods=${loginMethods.length}`)
    console.log(`drift_count=${driftRows.length}`)
    console.log(`collision_group_count=${collisions.length}`)
    console.log(`rules=email:trim+lowercase, phone:digits-with-optional-leading-plus`)
    console.log('')

    console.log('by_type:')
    for (const [type, count] of Object.entries(byType)) {
      console.log(`- ${type}: ${count}`)
    }

    if (driftRows.length > 0) {
      console.log('')
      console.log(`drift_samples(limit=${options.limit}):`)
      for (const row of driftRows.slice(0, options.limit)) {
        console.log(
          `- id=${row.id} userId=${row.userId} type=${row.type} identifier="${row.identifier}" normalized="${row.normalizedIdentifier}"`
        )
      }
    }

    if (collisions.length > 0) {
      console.log('')
      console.log(`collision_samples(limit=${options.limit}):`)
      for (const collision of collisions.slice(0, options.limit)) {
        console.log(`- target=${collision.normalizedIdentifier}`)
        for (const row of collision.rows) {
          console.log(
            `  id=${row.id} userId=${row.userId} type=${row.type} identifier="${row.identifier}"`
          )
        }
      }
    }

    if (options.failOnCollision && collisions.length > 0) {
      process.exitCode = 2
    }
  } finally {
    await prisma.$disconnect()
  }
}

void main().catch((error) => {
  console.error('identifier-backfill-scan failed')
  console.error(error)
  process.exitCode = 1
})
