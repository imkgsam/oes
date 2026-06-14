import {
  buildPermissionServiceSeed,
  renderPermissionServiceSeedDryRunSummary,
  validatePermissionServiceSeed
} from '../../src/scripts/permission-service-seed'
import {
  CRM_MANAGEMENT_PERMISSION_CODES,
  IDENTITY_ACCOUNT_PERMISSION_CODES,
  TERMINAL_DEVICE_MANAGEMENT_PERMISSION_CODES
} from '../../src/scripts/permission-catalog'
import { Modules } from '../../prisma/generated/prisma'

const EXPECTED_TERMINAL_DEVICE_PERMISSION_CODES = [
  'terminal-device.enrollment.create',
  'terminal-device.enrollment.revoke',
  'terminal-device.read',
  'terminal-device.sensitive.read',
  'terminal-device.status.disable',
  'terminal-device.status.mark-lost',
  'terminal-device.status.mark-maintenance',
  'terminal-device.status.restore-active',
  'terminal-device.version-policy.manage',
  'terminal-device.audit.read'
] as const

// Verifies the consolidated permission-service seed source is complete and DB-write free.
describe('permission service seed source', () => {
  it('publishes the consolidated foundation seed without validation errors', () => {
    const seed = buildPermissionServiceSeed()

    expect(validatePermissionServiceSeed(seed)).toEqual([])
    expect(seed.permissionCodes).toHaveLength(235)
    expect(Object.values(TERMINAL_DEVICE_MANAGEMENT_PERMISSION_CODES)).toEqual([
      ...EXPECTED_TERMINAL_DEVICE_PERMISSION_CODES
    ])
    expect(seed.permissionCodes.map((permission) => permission.code)).toEqual(
      expect.arrayContaining([...EXPECTED_TERMINAL_DEVICE_PERMISSION_CODES])
    )
    expect(seed.permissionCodes.map((permission) => permission.code)).toEqual(
      expect.arrayContaining([
        CRM_MANAGEMENT_PERMISSION_CODES.READ_CRM_ACCOUNT,
        CRM_MANAGEMENT_PERMISSION_CODES.CREATE_CRM_ACCOUNT,
        CRM_MANAGEMENT_PERMISSION_CODES.CONVERT_CRM_ACCOUNT,
        CRM_MANAGEMENT_PERMISSION_CODES.VIEW_RESTRICTED_DUPLICATE,
        IDENTITY_ACCOUNT_PERMISSION_CODES.ASSIGN_CONTACT_ASSET,
        IDENTITY_ACCOUNT_PERMISSION_CODES.UPDATE_CONTACT_ASSET,
        IDENTITY_ACCOUNT_PERMISSION_CODES.SET_CONTACT_ASSET_STATUS,
        IDENTITY_ACCOUNT_PERMISSION_CODES.SET_PRIMARY_CONTACT_ASSET,
        IDENTITY_ACCOUNT_PERMISSION_CODES.RELEASE_CONTACT_ASSET
      ])
    )
    expect(
      seed.permissionCodes
        .filter((permission) =>
          (EXPECTED_TERMINAL_DEVICE_PERMISSION_CODES as readonly string[]).includes(permission.code)
        )
        .map((permission) => permission.module)
    ).toEqual(EXPECTED_TERMINAL_DEVICE_PERMISSION_CODES.map(() => Modules.TERMINAL_DEVICE_SERVICE))
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
      'mes.forming_workshop.supervisor',
      'item_master.product_data_manager',
      'extension.designer'
    ])
    expect(seed.rolePermissions).toHaveLength(193)
    expect(seed.navigationEntries).toHaveLength(31)
    expect(seed.roleNavigationVisibility).toHaveLength(33)
    expect(seed.roleLandingPolicies).toHaveLength(7)
    expect(seed.roleTerminalAccess).toHaveLength(7)
    expect(seed.policyInstances).toHaveLength(0)
  })

  it('renders a stable dry-run summary for audit output', () => {
    expect(renderPermissionServiceSeedDryRunSummary(buildPermissionServiceSeed())).toEqual({
      permissionCodeCount: 235,
      deprecatedPermissionCodeCount: 14,
      roleCount: 7,
      rolePermissionCount: 193,
      navigationEntryCount: 31,
      deprecatedNavigationEntryCount: 1,
      roleNavigationVisibilityCount: 33,
      roleLandingPolicyCount: 7,
      roleTerminalAccessCount: 7,
      policyInstanceCount: 0
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
