import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'
import { PrismaClient } from '../../prisma/generated/prisma'
import { DEPRECATED_PERMISSION_CODES } from './permission-catalog'

export type PermissionSchemaDriftRepairSnapshot = {
  deprecatedPermissionCodes: string[]
  deprecatedPermissionCount: number
  deprecatedPolicyReferenceCount: number
  deprecatedPolicyInstanceReferenceCount: number
  deprecatedRolePermissionReferenceCount: number
}

export type PermissionSchemaDriftRepairBlocker = {
  count: number
  object: string
  reason: string
}

export type PermissionSchemaDriftRepairPlan = {
  blockers: PermissionSchemaDriftRepairBlocker[]
  canRepair: boolean
  cleanupOrder: string[]
  snapshot: PermissionSchemaDriftRepairSnapshot
}

type PermissionRow = {
  code: string
  id: string
}

const CLEANUP_ORDER = ['RolePermission', 'Permission']
const DEPRECATED_PERMISSION_MODULES = ['COLLABORATION_SERVICE'] as const

// buildPermissionSchemaDriftRepairPlan decides whether pre-push cleanup can safely remove deprecated permissions.
export function buildPermissionSchemaDriftRepairPlan(
  snapshot: PermissionSchemaDriftRepairSnapshot
): PermissionSchemaDriftRepairPlan {
  const blockers = [
    blocker(
      'Policy',
      snapshot.deprecatedPolicyReferenceCount,
      'Policies still reference deprecated permission codes; repair must not delete policy truth.'
    ),
    blocker(
      'PolicyInstance',
      snapshot.deprecatedPolicyInstanceReferenceCount,
      'Policy instances still reference deprecated permission codes; repair must not delete policy truth.'
    )
  ].filter((item): item is PermissionSchemaDriftRepairBlocker => Boolean(item))

  return {
    blockers,
    canRepair: blockers.length === 0,
    cleanupOrder: snapshot.deprecatedPermissionCount > 0 ? CLEANUP_ORDER : [],
    snapshot
  }
}

// loadPermissionServiceDatabaseUrl mirrors Prisma CLI .env loading for this package-level pre-push script.
export function loadPermissionServiceDatabaseUrl(cwd = process.cwd()): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL
  }

  const envPath = resolve(cwd, '.env')
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

// collectPermissionSchemaDriftRepairSnapshot reads deprecated permission rows through SQL that survives enum drift.
export async function collectPermissionSchemaDriftRepairSnapshot(
  prisma: PrismaClient,
  deprecatedPermissionCodes: readonly string[] = DEPRECATED_PERMISSION_CODES
): Promise<PermissionSchemaDriftRepairSnapshot> {
  if (!(await hasTable(prisma, 'Permission'))) {
    return emptySnapshot()
  }

  const deprecatedPermissions = await findDeprecatedPermissions(prisma, deprecatedPermissionCodes)
  const deprecatedPermissionIds = deprecatedPermissions.map((permission) => permission.id)
  const presentDeprecatedPermissionCodes = deprecatedPermissions.map((permission) => permission.code)
  const [hasRolePermission, hasPolicy, hasPolicyInstance] = await Promise.all([
    hasTable(prisma, 'RolePermission'),
    hasTable(prisma, 'Policy'),
    hasTable(prisma, 'PolicyInstance')
  ])

  const [
    deprecatedRolePermissionReferenceCount,
    deprecatedPolicyReferenceCount,
    deprecatedPolicyInstanceReferenceCount
  ] = await Promise.all([
    hasRolePermission
      ? countByColumnValues(prisma, 'RolePermission', 'permissionId', deprecatedPermissionIds)
      : Promise.resolve(0),
    hasPolicy
      ? countByColumnValues(prisma, 'Policy', 'permissionCode', presentDeprecatedPermissionCodes)
      : Promise.resolve(0),
    hasPolicyInstance
      ? countByColumnValues(prisma, 'PolicyInstance', 'permissionCode', presentDeprecatedPermissionCodes)
      : Promise.resolve(0)
  ])

  return {
    deprecatedPermissionCodes: presentDeprecatedPermissionCodes,
    deprecatedPermissionCount: deprecatedPermissions.length,
    deprecatedPolicyReferenceCount,
    deprecatedPolicyInstanceReferenceCount,
    deprecatedRolePermissionReferenceCount
  }
}

// applyPermissionSchemaDriftRepair removes deprecated permissions after the plan proves policy truth is safe.
export async function applyPermissionSchemaDriftRepair(
  prisma: PrismaClient,
  plan: PermissionSchemaDriftRepairPlan
): Promise<void> {
  if (!plan.canRepair) {
    const blockers = plan.blockers.map((item) => `${item.object}:${item.count}`).join(', ')
    throw new Error(`Permission schema drift repair is blocked: ${blockers}`)
  }

  if (plan.snapshot.deprecatedPermissionCodes.length === 0) {
    return
  }

  const deprecatedPermissions = await findDeprecatedPermissions(
    prisma,
    plan.snapshot.deprecatedPermissionCodes
  )
  const deprecatedPermissionIds = deprecatedPermissions.map((permission) => permission.id)

  if (deprecatedPermissionIds.length > 0 && (await hasTable(prisma, 'RolePermission'))) {
    await deleteByColumnValues(prisma, 'RolePermission', 'permissionId', deprecatedPermissionIds)
  }

  if (deprecatedPermissions.length > 0) {
    await deleteByColumnValues(
      prisma,
      'Permission',
      'code',
      deprecatedPermissions.map((permission) => permission.code)
    )
  }
}

// collectDeprecatedPermissionModuleEnumValues detects enum variants Prisma must contract after data repair.
export async function collectDeprecatedPermissionModuleEnumValues(
  prisma: PrismaClient
): Promise<string[]> {
  return prisma
    .$queryRawUnsafe<Array<{ enumlabel: string }>>(
      `select e.enumlabel
       from pg_enum e
       join pg_type t on t.oid = e.enumtypid
       where t.typname = $1
         and e.enumlabel in (${placeholders(DEPRECATED_PERMISSION_MODULES, 2)})
       order by e.enumlabel`,
      'Modules',
      ...DEPRECATED_PERMISSION_MODULES
    )
    .then((rows) => rows.map((row) => row.enumlabel))
}

// main repairs local/dev schema drift before Prisma attempts enum contraction.
async function main(): Promise<void> {
  loadPermissionServiceDatabaseUrl()
  const prisma = new PrismaClient()

  try {
    const snapshot = await collectPermissionSchemaDriftRepairSnapshot(prisma)
    const plan = buildPermissionSchemaDriftRepairPlan(snapshot)

    if (!plan.canRepair) {
      process.stderr.write(`${JSON.stringify(plan, null, 2)}\n`)
      process.exitCode = 1
      return
    }

    await applyPermissionSchemaDriftRepair(prisma, plan)

    if (snapshot.deprecatedPermissionCount > 0) {
      process.stdout.write(
        [
          '=== Permission Schema Drift Repair ===',
          `deprecated_permission_count=${snapshot.deprecatedPermissionCount}`,
          `deprecated_role_permission_reference_count=${snapshot.deprecatedRolePermissionReferenceCount}`,
          `deprecated_permission_codes=${snapshot.deprecatedPermissionCodes.join(',')}`
        ].join('\n') + '\n'
      )
    }
  } finally {
    await prisma.$disconnect()
  }
}

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

function blocker(
  object: string,
  count: number,
  reason: string
): PermissionSchemaDriftRepairBlocker | null {
  return count > 0 ? { object, count, reason } : null
}

function emptySnapshot(): PermissionSchemaDriftRepairSnapshot {
  return {
    deprecatedPermissionCodes: [],
    deprecatedPermissionCount: 0,
    deprecatedPolicyReferenceCount: 0,
    deprecatedPolicyInstanceReferenceCount: 0,
    deprecatedRolePermissionReferenceCount: 0
  }
}

async function hasTable(prisma: PrismaClient, tableName: string): Promise<boolean> {
  const rows = await prisma.$queryRawUnsafe<Array<{ exists: boolean }>>(
    'select to_regclass($1) is not null as "exists"',
    `public."${tableName}"`
  )
  return Boolean(rows[0]?.exists)
}

async function findDeprecatedPermissions(
  prisma: PrismaClient,
  deprecatedPermissionCodes: readonly string[]
): Promise<PermissionRow[]> {
  if (deprecatedPermissionCodes.length === 0) {
    return []
  }

  return prisma.$queryRawUnsafe<PermissionRow[]>(
    `select id, code from "Permission" where code in (${placeholders(deprecatedPermissionCodes)}) order by code`,
    ...deprecatedPermissionCodes
  )
}

async function countByColumnValues(
  prisma: PrismaClient,
  tableName: string,
  columnName: string,
  values: readonly string[]
): Promise<number> {
  if (values.length === 0) {
    return 0
  }

  const rows = await prisma.$queryRawUnsafe<Array<{ count: number }>>(
    `select count(*)::int as count from "${tableName}" where "${columnName}" in (${placeholders(values)})`,
    ...values
  )
  return rows[0]?.count ?? 0
}

async function deleteByColumnValues(
  prisma: PrismaClient,
  tableName: string,
  columnName: string,
  values: readonly string[]
): Promise<void> {
  if (values.length === 0) {
    return
  }

  await prisma.$executeRawUnsafe(
    `delete from "${tableName}" where "${columnName}" in (${placeholders(values)})`,
    ...values
  )
}

function placeholders(values: readonly unknown[], startAt = 1): string {
  return values.map((_, index) => `$${index + startAt}`).join(', ')
}

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`${String(error)}\n`)
    process.exitCode = 1
  })
}
