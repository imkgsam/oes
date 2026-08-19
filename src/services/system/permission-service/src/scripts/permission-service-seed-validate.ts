import { PrismaClient } from '../../prisma/generated/prisma'
import {
  PermissionServiceSeed,
  PermissionServiceSeedDryRunSummary,
  buildPermissionServiceSeed,
  renderPermissionServiceSeedDryRunSummary,
  validatePermissionServiceSeed
} from './permission-service-seed'
import { BuiltInRoleSeed } from './role-foundation'
import { PermissionSeedItem } from './permission-catalog'

type NavigationEntrySeed = PermissionServiceSeed['navigationEntries'][number]
type RoleLandingPolicySeed = PermissionServiceSeed['roleLandingPolicies'][number]
type RoleNavigationVisibilitySeed = PermissionServiceSeed['roleNavigationVisibility'][number]

export type PermissionServiceSeedValidationSnapshot = {
  navigationEntries: NavigationEntrySeed[]
  permissions: Array<Omit<PermissionSeedItem, 'assignableTo'>>
  roleLandingPolicies: RoleLandingPolicySeed[]
  roleNavigationVisibility: RoleNavigationVisibilitySeed[]
  rolePermissions: Array<{
    permissionCode: string
    roleId: string
  }>
  roles: BuiltInRoleSeed[]
}

export type PermissionServiceSeedValidationResult = {
  mode: 'validate'
  seedSummary: PermissionServiceSeedDryRunSummary
  validationErrors: string[]
  writesDatabase: false
}

/** collectPermissionServiceSeedValidationSnapshot reads only permission foundation rows needed for validation. */
export async function collectPermissionServiceSeedValidationSnapshot(
  prisma: PrismaClient,
  seed: PermissionServiceSeed
): Promise<PermissionServiceSeedValidationSnapshot> {
  const seedPermissionCodes = seed.permissionCodes.map((permission) => permission.code)
  const seedRoleWhere = seed.roles.map((role) => ({
    scopeKey: role.scopeKey,
    kind: role.kind,
    code: role.code
  }))
  const seedNavigationEntryKeys = [
    ...seed.navigationEntries.map((entry) => entry.entryKey),
    ...seed.deprecatedNavigationEntryKeys
  ]

  const [permissions, roles, navigationEntries] = await Promise.all([
    prisma.permission.findMany({
      where: { code: { in: seedPermissionCodes } },
      select: {
        code: true,
        description: true,
        externalApiEligible: true,
        allowedScopeLevels: true,
        definitionFingerprint: true,
        kind: true,
        module: true
      }
    }),
    prisma.role.findMany({
      where: { OR: seedRoleWhere },
      select: {
        allowTenantPermissionOverride: true,
        code: true,
        description: true,
        id: true,
        isEnabled: true,
        isProtected: true,
        kind: true,
        name: true,
        scopeKey: true,
        templateRoleId: true,
        tenantId: true
      }
    }),
    prisma.navigationEntry.findMany({
      where: { entryKey: { in: seedNavigationEntryKeys } },
      select: {
        description: true,
        enabled: true,
        entryKey: true,
        entryType: true,
        featureKey: true,
        name: true,
        registryPriority: true,
        supportedTerminals: true
      }
    })
  ])

  const roleIds = roles.map((role) => role.id)
  const [rolePermissions, roleNavigationVisibility, roleLandingPolicies] = await Promise.all([
    countableFindMany(roleIds, () =>
      prisma.rolePermission.findMany({
        where: { roleId: { in: roleIds } },
        select: {
          roleId: true,
          permission: {
            select: {
              code: true
            }
          }
        }
      })
    ),
    countableFindMany(roleIds, () =>
      prisma.roleNavigationVisibility.findMany({
        where: { roleId: { in: roleIds } },
        select: {
          enabled: true,
          entryKey: true,
          roleId: true,
          terminal: true
        }
      })
    ),
    countableFindMany(roleIds, () =>
      prisma.roleLandingPolicy.findMany({
        where: { roleId: { in: roleIds } },
        select: {
          defaultEntryKey: true,
          enabled: true,
          priority: true,
          roleId: true,
          terminal: true
        }
      })
    )
  ])

  return {
    permissions: permissions.map((permission) => ({
      code: permission.code,
      description: permission.description ?? undefined,
      externalApiEligible: permission.externalApiEligible,
      allowedScopeLevels: permission.allowedScopeLevels,
      definitionFingerprint: permission.definitionFingerprint,
      kind: permission.kind,
      module: permission.module
    })),
    roles: roles.map((role) => ({
      allowTenantPermissionOverride: role.allowTenantPermissionOverride,
      code: role.code,
      description: role.description ?? '',
      id: role.id,
      isEnabled: role.isEnabled,
      isProtected: role.isProtected,
      kind: role.kind,
      name: role.name,
      permissionCodes: [],
      scopeKey: role.scopeKey,
      templateRoleCode: null,
      tenantId: role.tenantId
    })),
    navigationEntries: navigationEntries.map((entry) => ({
      description: entry.description ?? undefined,
      enabled: entry.enabled,
      entryKey: entry.entryKey,
      entryType: entry.entryType,
      featureKey: entry.featureKey ?? undefined,
      name: entry.name,
      registryPriority: entry.registryPriority,
      supportedTerminals: normalizeJsonArray(entry.supportedTerminals)
    })),
    rolePermissions: rolePermissions.map((rolePermission) => ({
      permissionCode: rolePermission.permission.code,
      roleId: rolePermission.roleId
    })),
    roleNavigationVisibility,
    roleLandingPolicies
  }
}

/** validatePermissionServiceSeedSnapshot compares database rows with the confirmed seed truth. */
export function validatePermissionServiceSeedSnapshot(
  seed: PermissionServiceSeed,
  snapshot: PermissionServiceSeedValidationSnapshot
): PermissionServiceSeedValidationResult {
  const validationErrors = [
    ...validatePermissionServiceSeed(seed),
    ...validatePermissions(seed, snapshot),
    ...validateRoles(seed, snapshot),
    ...validateRolePermissions(seed, snapshot),
    ...validateNavigationEntries(seed, snapshot),
    ...validateRoleNavigationVisibility(seed, snapshot),
    ...validateRoleLandingPolicies(seed, snapshot)
  ]

  return {
    mode: 'validate',
    writesDatabase: false,
    seedSummary: renderPermissionServiceSeedDryRunSummary(seed),
    validationErrors
  }
}

/** main validates the current permission-service database against the consolidated seed truth. */
async function main(): Promise<void> {
  const seed = buildPermissionServiceSeed()
  const prisma = new PrismaClient()

  try {
    const snapshot = await collectPermissionServiceSeedValidationSnapshot(prisma, seed)
    const result = validatePermissionServiceSeedSnapshot(seed, snapshot)
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)

    if (result.validationErrors.length > 0) {
      process.exitCode = 1
    }
  } finally {
    await prisma.$disconnect()
  }
}

function validatePermissions(
  seed: PermissionServiceSeed,
  snapshot: PermissionServiceSeedValidationSnapshot
): string[] {
  const errors: string[] = []
  const actualByCode = new Map(
    snapshot.permissions.map((permission) => [permission.code, permission])
  )

  for (const expected of seed.permissionCodes) {
    const actual = actualByCode.get(expected.code)
    if (!actual) {
      errors.push(`Missing permission ${expected.code}`)
      continue
    }

    pushFieldDrift(errors, `Permission ${expected.code}`, 'module', expected.module, actual.module)
    pushFieldDrift(
      errors,
      `Permission ${expected.code}`,
      'description',
      expected.description ?? null,
      actual.description ?? null
    )
    pushFieldDrift(errors, `Permission ${expected.code}`, 'kind', expected.kind, actual.kind)
    pushFieldDrift(
      errors,
      `Permission ${expected.code}`,
      'externalApiEligible',
      expected.externalApiEligible,
      actual.externalApiEligible
    )
    pushFieldDrift(
      errors,
      `Permission ${expected.code}`,
      'allowedScopeLevels',
      expected.allowedScopeLevels,
      actual.allowedScopeLevels
    )
    pushFieldDrift(
      errors,
      `Permission ${expected.code}`,
      'definitionFingerprint',
      expected.definitionFingerprint,
      actual.definitionFingerprint
    )
  }

  return errors
}

function validateRoles(
  seed: PermissionServiceSeed,
  snapshot: PermissionServiceSeedValidationSnapshot
): string[] {
  const errors: string[] = []
  const actualByRoleKey = new Map(snapshot.roles.map((role) => [roleKey(role), role]))

  for (const expected of seed.roles) {
    const actual = actualByRoleKey.get(roleKey(expected))
    if (!actual) {
      errors.push(`Missing role ${expected.code} (${expected.kind}/${expected.scopeKey})`)
      continue
    }

    pushFieldDrift(errors, `Role ${expected.code}`, 'id', expected.id, actual.id)
    pushFieldDrift(errors, `Role ${expected.code}`, 'name', expected.name, actual.name)
    pushFieldDrift(
      errors,
      `Role ${expected.code}`,
      'description',
      expected.description,
      actual.description
    )
    pushFieldDrift(errors, `Role ${expected.code}`, 'tenantId', expected.tenantId, actual.tenantId)
    pushFieldDrift(
      errors,
      `Role ${expected.code}`,
      'allowTenantPermissionOverride',
      expected.allowTenantPermissionOverride,
      actual.allowTenantPermissionOverride
    )
    pushFieldDrift(
      errors,
      `Role ${expected.code}`,
      'isProtected',
      expected.isProtected,
      actual.isProtected
    )
    pushFieldDrift(
      errors,
      `Role ${expected.code}`,
      'isEnabled',
      expected.isEnabled,
      actual.isEnabled
    )
  }

  return errors
}

function validateRolePermissions(
  seed: PermissionServiceSeed,
  snapshot: PermissionServiceSeedValidationSnapshot
): string[] {
  const errors: string[] = []
  const actualCodesByRoleId = groupValues(snapshot.rolePermissions, 'roleId', 'permissionCode')

  for (const role of seed.roles) {
    const expectedCodes = new Set(role.permissionCodes)
    const actualCodes = actualCodesByRoleId.get(role.id) ?? new Set<string>()

    for (const expectedCode of expectedCodes) {
      if (!actualCodes.has(expectedCode)) {
        errors.push(`Role ${role.code} is missing permission ${expectedCode}`)
      }
    }

    for (const actualCode of actualCodes) {
      if (!expectedCodes.has(actualCode)) {
        errors.push(`Role ${role.code} has unapproved permission ${actualCode}`)
      }
    }
  }

  return errors
}

function validateNavigationEntries(
  seed: PermissionServiceSeed,
  snapshot: PermissionServiceSeedValidationSnapshot
): string[] {
  const errors: string[] = []
  const actualByKey = new Map(snapshot.navigationEntries.map((entry) => [entry.entryKey, entry]))

  for (const expected of seed.navigationEntries) {
    const actual = actualByKey.get(expected.entryKey)
    if (!actual) {
      errors.push(`Missing navigation entry ${expected.entryKey}`)
      continue
    }

    pushFieldDrift(
      errors,
      `NavigationEntry ${expected.entryKey}`,
      'name',
      expected.name,
      actual.name
    )
    pushFieldDrift(
      errors,
      `NavigationEntry ${expected.entryKey}`,
      'description',
      expected.description ?? null,
      actual.description ?? null
    )
    pushFieldDrift(
      errors,
      `NavigationEntry ${expected.entryKey}`,
      'featureKey',
      expected.featureKey ?? null,
      actual.featureKey ?? null
    )
    pushFieldDrift(
      errors,
      `NavigationEntry ${expected.entryKey}`,
      'supportedTerminals',
      stableStringify(expected.supportedTerminals),
      stableStringify(actual.supportedTerminals)
    )
    pushFieldDrift(
      errors,
      `NavigationEntry ${expected.entryKey}`,
      'registryPriority',
      expected.registryPriority,
      actual.registryPriority
    )
    pushFieldDrift(
      errors,
      `NavigationEntry ${expected.entryKey}`,
      'enabled',
      expected.enabled,
      actual.enabled
    )
    pushFieldDrift(
      errors,
      `NavigationEntry ${expected.entryKey}`,
      'entryType',
      expected.entryType,
      actual.entryType
    )
  }

  return errors
}

function validateRoleNavigationVisibility(
  seed: PermissionServiceSeed,
  snapshot: PermissionServiceSeedValidationSnapshot
): string[] {
  return validateSet(
    'RoleNavigationVisibility',
    seed.roleNavigationVisibility.map(
      (item) => `${item.roleId}:${item.entryKey}:${item.terminal}:${item.enabled}`
    ),
    snapshot.roleNavigationVisibility.map(
      (item) => `${item.roleId}:${item.entryKey}:${item.terminal}:${item.enabled}`
    )
  )
}

function validateRoleLandingPolicies(
  seed: PermissionServiceSeed,
  snapshot: PermissionServiceSeedValidationSnapshot
): string[] {
  return validateSet(
    'RoleLandingPolicy',
    seed.roleLandingPolicies.map(
      (item) =>
        `${item.roleId}:${item.terminal}:${item.defaultEntryKey}:${item.priority}:${item.enabled}`
    ),
    snapshot.roleLandingPolicies.map(
      (item) =>
        `${item.roleId}:${item.terminal}:${item.defaultEntryKey}:${item.priority}:${item.enabled}`
    )
  )
}

function validateSet(label: string, expectedValues: string[], actualValues: string[]): string[] {
  const errors: string[] = []
  const expected = new Set(expectedValues)
  const actual = new Set(actualValues)

  for (const value of expected) {
    if (!actual.has(value)) {
      errors.push(`${label} is missing ${value}`)
    }
  }

  for (const value of actual) {
    if (!expected.has(value)) {
      errors.push(`${label} has unapproved ${value}`)
    }
  }

  return errors
}

function pushFieldDrift(
  errors: string[],
  subject: string,
  field: string,
  expected: unknown,
  actual: unknown
): void {
  if (expected !== actual) {
    errors.push(
      `${subject} field ${field} drift: expected ${String(expected)}, got ${String(actual)}`
    )
  }
}

function roleKey(role: Pick<BuiltInRoleSeed, 'code' | 'kind' | 'scopeKey'>): string {
  return `${role.scopeKey}:${role.kind}:${role.code}`
}

function groupValues<
  T extends Record<TKey | TValue, string>,
  TKey extends keyof T,
  TValue extends keyof T
>(rows: T[], keyField: TKey, valueField: TValue): Map<string, Set<string>> {
  const grouped = new Map<string, Set<string>>()
  for (const row of rows) {
    const key = row[keyField]
    const value = row[valueField]
    if (!grouped.has(key)) {
      grouped.set(key, new Set<string>())
    }
    grouped.get(key)?.add(value)
  }
  return grouped
}

function normalizeJsonArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item)) : []
}

function stableStringify(value: unknown): string {
  return JSON.stringify(value)
}

async function countableFindMany<T>(
  values: readonly unknown[],
  findMany: () => Promise<T[]>
): Promise<T[]> {
  return values.length > 0 ? findMany() : []
}

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`${String(error)}\n`)
    process.exitCode = 1
  })
}
