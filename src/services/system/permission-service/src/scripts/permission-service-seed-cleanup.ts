import { PrismaClient } from '../../prisma/generated/prisma'
import {
  PermissionServiceSeed,
  PermissionServiceSeedDryRunSummary,
  buildPermissionServiceSeed,
  renderPermissionServiceSeedDryRunSummary,
  validatePermissionServiceSeed
} from './permission-service-seed'

export type PermissionServiceSeedCleanupSnapshot = {
  accountRoleBindingCount: number
  deprecatedPermissionCount: number
  deprecatedPolicyReferenceCount: number
  deprecatedRolePermissionReferenceCount: number
  externalNavigationLandingPolicyCount: number
  externalNavigationVisibilityCount: number
  externalRolePermissionReferenceCount: number
  navigationEntryCount: number
  permissionCount: number
  policyReferenceCount: number
  roleCount: number
  roleLandingPolicyCount: number
  roleNavigationVisibilityCount: number
  rolePermissionCount: number
  roleTemplateInstanceCount: number
}

export type PermissionServiceSeedCleanupStep = {
  object: string
  order: number
  scope: string
}

export type PermissionServiceSeedCleanupBlocker = {
  object: string
  count: number
  reason: string
}

export type PermissionServiceSeedCleanupDryRunPlan = {
  blockers: PermissionServiceSeedCleanupBlocker[]
  cleanupOrder: PermissionServiceSeedCleanupStep[]
  hasBlockingReferences: boolean
  mode: 'dry-run'
  protectedObjects: string[]
  seedSummary: PermissionServiceSeedDryRunSummary
  target: {
    databaseName: string | null
    databaseUrl: string | null
    service: 'permission-service'
  }
  validationErrors: string[]
  wouldDelete: PermissionServiceSeedCleanupSnapshot
  writesDatabase: false
}

export const PERMISSION_SERVICE_SEED_CLEANUP_ORDER: PermissionServiceSeedCleanupStep[] = [
  {
    order: 1,
    object: 'RoleLandingPolicy',
    scope: 'rows owned by built-in seed role ids'
  },
  {
    order: 2,
    object: 'RoleNavigationVisibility',
    scope: 'rows owned by built-in seed role ids'
  },
  {
    order: 3,
    object: 'RolePermission',
    scope: 'rows owned by built-in seed role ids'
  },
  {
    order: 4,
    object: 'Role',
    scope: 'built-in seed roles matched by scopeKey/kind/code'
  },
  {
    order: 5,
    object: 'NavigationEntry',
    scope: 'built-in seed navigation entry keys and deprecated seed keys'
  },
  {
    order: 6,
    object: 'RolePermission',
    scope: 'rows referencing deprecated seed permission codes'
  },
  {
    order: 7,
    object: 'Permission',
    scope: 'built-in seed permission codes and deprecated seed permission codes'
  }
]

export const PERMISSION_SERVICE_SEED_CLEANUP_PROTECTED_OBJECTS = [
  'AccountRole',
  'Policy',
  'OnboardingGrantRequest',
  'AuditEvent',
  'DecisionEvent'
]

/** buildPermissionServiceSeedCleanupDryRunPlan renders the cleanup impact without mutating the database. */
export function buildPermissionServiceSeedCleanupDryRunPlan(
  seed: PermissionServiceSeed,
  snapshot: PermissionServiceSeedCleanupSnapshot,
  target = summarizePermissionServiceDatabaseTarget(process.env.DATABASE_URL)
): PermissionServiceSeedCleanupDryRunPlan {
  const blockers = buildPermissionServiceSeedCleanupBlockers(snapshot)

  return {
    mode: 'dry-run',
    writesDatabase: false,
    target,
    seedSummary: renderPermissionServiceSeedDryRunSummary(seed),
    validationErrors: validatePermissionServiceSeed(seed),
    cleanupOrder: PERMISSION_SERVICE_SEED_CLEANUP_ORDER,
    protectedObjects: PERMISSION_SERVICE_SEED_CLEANUP_PROTECTED_OBJECTS,
    wouldDelete: snapshot,
    blockers,
    hasBlockingReferences: blockers.length > 0
  }
}

/** collectPermissionServiceSeedCleanupSnapshot counts seed-owned rows plus references that would block safe cleanup. */
export async function collectPermissionServiceSeedCleanupSnapshot(
  prisma: PrismaClient,
  seed: PermissionServiceSeed
): Promise<PermissionServiceSeedCleanupSnapshot> {
  const seedPermissionCodes = seed.permissionCodes.map((permission) => permission.code)
  const deprecatedPermissionCodes = [...seed.deprecatedPermissionCodes]
  const seedRoleWhere = seed.roles.map((role) => ({
    scopeKey: role.scopeKey,
    kind: role.kind,
    code: role.code
  }))
  const seedNavigationEntryKeys = [
    ...seed.navigationEntries.map((entry) => entry.entryKey),
    ...seed.deprecatedNavigationEntryKeys
  ]

  const [permissions, deprecatedPermissions, roles, navigationEntryCount] = await Promise.all([
    prisma.permission.findMany({
      where: { code: { in: seedPermissionCodes } },
      select: { id: true }
    }),
    prisma.permission.findMany({
      where: { code: { in: deprecatedPermissionCodes } },
      select: { id: true }
    }),
    prisma.role.findMany({
      where: { OR: seedRoleWhere },
      select: { id: true }
    }),
    prisma.navigationEntry.count({
      where: { entryKey: { in: seedNavigationEntryKeys } }
    })
  ])

  const permissionIds = permissions.map((permission) => permission.id)
  const deprecatedPermissionIds = deprecatedPermissions.map((permission) => permission.id)
  const roleIds = roles.map((role) => role.id)

  const [
    roleLandingPolicyCount,
    roleNavigationVisibilityCount,
    rolePermissionCount,
    accountRoleBindingCount,
    roleTemplateInstanceCount,
    policyReferenceCount,
    deprecatedPolicyReferenceCount,
    deprecatedRolePermissionReferenceCount,
    externalRolePermissionReferenceCount,
    externalNavigationVisibilityCount,
    externalNavigationLandingPolicyCount
  ] = await Promise.all([
    countWhen(roleIds, () =>
      prisma.roleLandingPolicy.count({
        where: { roleId: { in: roleIds } }
      })
    ),
    countWhen(roleIds, () =>
      prisma.roleNavigationVisibility.count({
        where: { roleId: { in: roleIds } }
      })
    ),
    countWhen(roleIds, () =>
      prisma.rolePermission.count({
        where: { roleId: { in: roleIds } }
      })
    ),
    countWhen(roleIds, () =>
      prisma.principalRoleBinding.count({
        where: { roleId: { in: roleIds } }
      })
    ),
    countWhen(roleIds, () =>
      prisma.role.count({
        where: { templateRoleId: { in: roleIds } }
      })
    ),
    prisma.policy.count({
      where: { permissionCode: { in: seedPermissionCodes } }
    }),
    prisma.policy.count({
      where: { permissionCode: { in: deprecatedPermissionCodes } }
    }),
    countWhen(deprecatedPermissionIds, () =>
      prisma.rolePermission.count({
        where: { permissionId: { in: deprecatedPermissionIds } }
      })
    ),
    countWhen(permissionIds, () =>
      prisma.rolePermission.count({
        where: buildExternalRolePermissionWhere(permissionIds, roleIds)
      })
    ),
    countWhen(seedNavigationEntryKeys, () =>
      prisma.roleNavigationVisibility.count({
        where: buildExternalNavigationVisibilityWhere(seedNavigationEntryKeys, roleIds)
      })
    ),
    countWhen(seedNavigationEntryKeys, () =>
      prisma.roleLandingPolicy.count({
        where: buildExternalNavigationLandingWhere(seedNavigationEntryKeys, roleIds)
      })
    )
  ])

  return {
    accountRoleBindingCount,
    deprecatedPermissionCount: deprecatedPermissions.length,
    deprecatedPolicyReferenceCount,
    deprecatedRolePermissionReferenceCount,
    externalNavigationLandingPolicyCount,
    externalNavigationVisibilityCount,
    externalRolePermissionReferenceCount,
    navigationEntryCount,
    permissionCount: permissions.length,
    policyReferenceCount,
    roleCount: roles.length,
    roleLandingPolicyCount,
    roleNavigationVisibilityCount,
    rolePermissionCount,
    roleTemplateInstanceCount
  }
}

/** main prints a permission-service cleanup dry-run and never writes database state. */
async function main(): Promise<void> {
  const seed = buildPermissionServiceSeed()
  const prisma = new PrismaClient()

  try {
    const snapshot = await collectPermissionServiceSeedCleanupSnapshot(prisma, seed)
    const plan = buildPermissionServiceSeedCleanupDryRunPlan(seed, snapshot)
    process.stdout.write(`${JSON.stringify(plan, null, 2)}\n`)

    if (plan.validationErrors.length > 0) {
      process.exitCode = 1
    }
  } finally {
    await prisma.$disconnect()
  }
}

function buildPermissionServiceSeedCleanupBlockers(
  snapshot: PermissionServiceSeedCleanupSnapshot
): PermissionServiceSeedCleanupBlocker[] {
  return [
    blocker(
      'AccountRole',
      snapshot.accountRoleBindingCount,
      'Seed role instances still have account bindings; cleanup must not remove account-role truth.'
    ),
    blocker(
      'Policy',
      snapshot.policyReferenceCount,
      'Policies still reference seed permission codes; cleanup must not delete policy truth.'
    ),
    blocker(
      'Policy',
      snapshot.deprecatedPolicyReferenceCount,
      'Policies still reference deprecated permission codes; cleanup must not delete policy truth.'
    ),
    blocker(
      'RolePermission',
      snapshot.externalRolePermissionReferenceCount,
      'Non-seed roles still reference seed permission codes; permission deletion would affect custom role truth.'
    ),
    blocker(
      'RoleNavigationVisibility',
      snapshot.externalNavigationVisibilityCount,
      'Non-seed roles still reference seed navigation entries; navigation cleanup would affect custom visibility truth.'
    ),
    blocker(
      'RoleLandingPolicy',
      snapshot.externalNavigationLandingPolicyCount,
      'Non-seed roles still reference seed landing entries; navigation cleanup would affect custom landing truth.'
    ),
    blocker(
      'Role',
      snapshot.roleTemplateInstanceCount,
      'Tenant role instances still derive from seed templates; template cleanup would orphan managed instances.'
    )
  ].filter((item): item is PermissionServiceSeedCleanupBlocker => Boolean(item))
}

function blocker(
  object: string,
  count: number,
  reason: string
): PermissionServiceSeedCleanupBlocker | null {
  return count > 0 ? { object, count, reason } : null
}

function buildExternalRolePermissionWhere(permissionIds: string[], roleIds: string[]) {
  return {
    permissionId: { in: permissionIds },
    ...(roleIds.length > 0 ? { roleId: { notIn: roleIds } } : {})
  }
}

function buildExternalNavigationVisibilityWhere(entryKeys: string[], roleIds: string[]) {
  return {
    entryKey: { in: entryKeys },
    ...(roleIds.length > 0 ? { roleId: { notIn: roleIds } } : {})
  }
}

function buildExternalNavigationLandingWhere(entryKeys: string[], roleIds: string[]) {
  return {
    defaultEntryKey: { in: entryKeys },
    ...(roleIds.length > 0 ? { roleId: { notIn: roleIds } } : {})
  }
}

async function countWhen<T>(values: readonly T[], count: () => Promise<number>): Promise<number> {
  return values.length > 0 ? count() : 0
}

function summarizePermissionServiceDatabaseTarget(
  databaseUrl?: string
): PermissionServiceSeedCleanupDryRunPlan['target'] {
  if (!databaseUrl) {
    return {
      service: 'permission-service',
      databaseUrl: null,
      databaseName: null
    }
  }

  try {
    const url = new URL(databaseUrl)
    const databaseName = url.pathname.replace(/^\//, '') || null
    if (url.password) {
      url.password = '***'
    }

    return {
      service: 'permission-service',
      databaseUrl: url.toString(),
      databaseName
    }
  } catch {
    return {
      service: 'permission-service',
      databaseUrl,
      databaseName: null
    }
  }
}

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`${String(error)}\n`)
    process.exitCode = 1
  })
}
