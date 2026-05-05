import {
  buildPermissionServiceSeed,
  renderPermissionServiceSeedDryRunSummary,
  validatePermissionServiceSeed
} from '../../src/scripts/permission-service-seed'

// Verifies the consolidated permission-service seed source is complete and DB-write free.
describe('permission service seed source', () => {
  it('publishes the consolidated foundation seed without validation errors', () => {
    const seed = buildPermissionServiceSeed()

    expect(validatePermissionServiceSeed(seed)).toEqual([])
    expect(seed.permissionCodes).toHaveLength(188)
    expect(seed.deprecatedPermissionCodes).toEqual([
      'permission.role.create',
      'permission.role.update',
      'permission.role.delete_by_id',
      'permission.role.list',
      'permission.role.get_by_id',
      'permission.role_template.delete_by_id',
      'permission.role_template.permission.assign',
      'permission.role_template.permission.revoke',
      'permission.role_instance.delete_by_id',
      'permission.role_instance.permission.assign',
      'permission.role_instance.permission.revoke',
      'identity.org.membership.add',
      'identity.org.membership.remove',
      'identity.org.membership.set_primary'
    ])
    expect(seed.roles.map((role) => role.code)).toEqual([
      'system.admin',
      'tenant.admin',
      'hr.admin',
      'account.basic',
      'mes.forming_workshop.supervisor'
    ])
    expect(seed.rolePermissions).toHaveLength(123)
    expect(seed.navigationEntries).toHaveLength(22)
    expect(seed.roleNavigationVisibility).toHaveLength(22)
    expect(seed.roleLandingPolicies).toHaveLength(5)
  })

  it('renders a stable dry-run summary for audit output', () => {
    expect(renderPermissionServiceSeedDryRunSummary(buildPermissionServiceSeed())).toEqual({
      permissionCodeCount: 188,
      deprecatedPermissionCodeCount: 14,
      roleCount: 5,
      rolePermissionCount: 123,
      navigationEntryCount: 22,
      deprecatedNavigationEntryCount: 1,
      roleNavigationVisibilityCount: 22,
      roleLandingPolicyCount: 5
    })
  })

  it('keeps every landing policy inside the matching role visibility set', () => {
    const seed = buildPermissionServiceSeed()
    const visibleEntryKeys = new Set(
      seed.roleNavigationVisibility
        .filter((item) => item.enabled)
        .map((item) => `${item.roleId}:${item.terminal}:${item.entryKey}`)
    )

    for (const landingPolicy of seed.roleLandingPolicies) {
      expect(
        visibleEntryKeys.has(
          `${landingPolicy.roleId}:${landingPolicy.terminal}:${landingPolicy.defaultEntryKey}`
        )
      ).toBe(true)
    }
  })
})
