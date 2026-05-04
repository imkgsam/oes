import {
  DEFAULT_NAVIGATION_ENTRIES,
  DEPRECATED_NAVIGATION_ENTRY_KEYS,
  buildNavigationFoundationLandingSeeds,
  buildNavigationFoundationVisibilitySeeds
} from './navigation-foundation'
import {
  DEPRECATED_PERMISSION_CODES,
  PERMISSION_CODE_SEED_ITEMS,
  PermissionSeedItem
} from './permission-catalog'
import { BuiltInRoleSeed, buildBuiltInRoleSeeds, validateBuiltInRoleSeedDefinitions } from './role-foundation'

export type PermissionServiceRolePermissionSeed = {
  permissionCode: string
  roleCode: string
  roleId: string
}

export type PermissionServiceSeed = {
  deprecatedNavigationEntryKeys: readonly string[]
  deprecatedPermissionCodes: readonly string[]
  navigationEntries: typeof DEFAULT_NAVIGATION_ENTRIES
  permissionCodes: PermissionSeedItem[]
  roleLandingPolicies: ReturnType<typeof buildNavigationFoundationLandingSeeds>
  roleNavigationVisibility: ReturnType<typeof buildNavigationFoundationVisibilitySeeds>
  rolePermissions: PermissionServiceRolePermissionSeed[]
  roles: BuiltInRoleSeed[]
}

export type PermissionServiceSeedDryRunSummary = {
  deprecatedNavigationEntryCount: number
  deprecatedPermissionCodeCount: number
  navigationEntryCount: number
  permissionCodeCount: number
  roleCount: number
  roleLandingPolicyCount: number
  roleNavigationVisibilityCount: number
  rolePermissionCount: number
}

/** buildPermissionServiceSeed returns the full permission-service seed source without touching the database. */
export function buildPermissionServiceSeed(): PermissionServiceSeed {
  const roles = buildBuiltInRoleSeeds()

  return {
    deprecatedNavigationEntryKeys: DEPRECATED_NAVIGATION_ENTRY_KEYS,
    deprecatedPermissionCodes: DEPRECATED_PERMISSION_CODES,
    navigationEntries: DEFAULT_NAVIGATION_ENTRIES,
    permissionCodes: PERMISSION_CODE_SEED_ITEMS,
    roleLandingPolicies: buildNavigationFoundationLandingSeeds(roles),
    roleNavigationVisibility: buildNavigationFoundationVisibilitySeeds(roles),
    rolePermissions: roles.flatMap((role) =>
      role.permissionCodes.map((permissionCode) => ({
        permissionCode,
        roleCode: role.code,
        roleId: role.id
      }))
    ),
    roles
  }
}

/** validatePermissionServiceSeed checks cross-object references before a DB writer consumes seed data. */
export function validatePermissionServiceSeed(seed: PermissionServiceSeed): string[] {
  const errors = [...validateBuiltInRoleSeedDefinitions()]
  const permissionCodes = new Set<string>()
  const roleIds = new Set(seed.roles.map((role) => role.id))
  const navigationEntryKeys = new Set(seed.navigationEntries.map((entry) => entry.entryKey))
  const visibleEntryKeys = new Set(
    seed.roleNavigationVisibility
      .filter((item) => item.enabled)
      .map((item) => `${item.roleId}:${item.terminal}:${item.entryKey}`)
  )

  for (const permission of seed.permissionCodes) {
    if (permissionCodes.has(permission.code)) {
      errors.push(`Duplicate permission code: ${permission.code}`)
    }
    permissionCodes.add(permission.code)
  }

  for (const deprecatedCode of seed.deprecatedPermissionCodes) {
    if (permissionCodes.has(deprecatedCode)) {
      errors.push(`Deprecated permission code is still present in seed catalog: ${deprecatedCode}`)
    }
  }

  const roleKeys = new Set<string>()
  for (const role of seed.roles) {
    const roleKey = `${role.scopeKey}:${role.kind}:${role.code}`
    if (roleKeys.has(roleKey)) {
      errors.push(`Duplicate role key: ${roleKey}`)
    }
    roleKeys.add(roleKey)
  }

  for (const rolePermission of seed.rolePermissions) {
    if (!roleIds.has(rolePermission.roleId)) {
      errors.push(`${rolePermission.roleCode}: role permission references unknown roleId ${rolePermission.roleId}`)
    }
    if (!permissionCodes.has(rolePermission.permissionCode)) {
      errors.push(`${rolePermission.roleCode}: role permission references unknown code ${rolePermission.permissionCode}`)
    }
  }

  for (const visibility of seed.roleNavigationVisibility) {
    if (!roleIds.has(visibility.roleId)) {
      errors.push(`Navigation visibility references unknown roleId ${visibility.roleId}`)
    }
    if (!navigationEntryKeys.has(visibility.entryKey)) {
      errors.push(`Navigation visibility references unknown entryKey ${visibility.entryKey}`)
    }
  }

  for (const landingPolicy of seed.roleLandingPolicies) {
    if (!roleIds.has(landingPolicy.roleId)) {
      errors.push(`Landing policy references unknown roleId ${landingPolicy.roleId}`)
    }
    if (!navigationEntryKeys.has(landingPolicy.defaultEntryKey)) {
      errors.push(`Landing policy references unknown entryKey ${landingPolicy.defaultEntryKey}`)
    }
    if (
      landingPolicy.enabled &&
      !visibleEntryKeys.has(
        `${landingPolicy.roleId}:${landingPolicy.terminal}:${landingPolicy.defaultEntryKey}`
      )
    ) {
      errors.push(
        `Landing policy references non-visible entry ${landingPolicy.defaultEntryKey} for roleId ${landingPolicy.roleId} on ${landingPolicy.terminal}`
      )
    }
  }

  return errors
}

/** renderPermissionServiceSeedDryRunSummary emits auditable object counts for dry-run reset plans. */
export function renderPermissionServiceSeedDryRunSummary(
  seed: PermissionServiceSeed
): PermissionServiceSeedDryRunSummary {
  return {
    permissionCodeCount: seed.permissionCodes.length,
    deprecatedPermissionCodeCount: seed.deprecatedPermissionCodes.length,
    roleCount: seed.roles.length,
    rolePermissionCount: seed.rolePermissions.length,
    navigationEntryCount: seed.navigationEntries.length,
    deprecatedNavigationEntryCount: seed.deprecatedNavigationEntryKeys.length,
    roleNavigationVisibilityCount: seed.roleNavigationVisibility.length,
    roleLandingPolicyCount: seed.roleLandingPolicies.length
  }
}

/** main prints a DB-write-free seed dry-run summary for local audit workflows. */
function main(): void {
  const seed = buildPermissionServiceSeed()
  const validationErrors = validatePermissionServiceSeed(seed)
  const payload = {
    mode: 'dry-run',
    writesDatabase: false,
    summary: renderPermissionServiceSeedDryRunSummary(seed),
    validationErrors
  }

  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`)

  if (validationErrors.length > 0) {
    process.exitCode = 1
  }
}

if (require.main === module) {
  main()
}
