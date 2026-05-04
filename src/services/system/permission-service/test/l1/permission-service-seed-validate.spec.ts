import { buildPermissionServiceSeed } from '../../src/scripts/permission-service-seed'
import {
  PermissionServiceSeedValidationSnapshot,
  validatePermissionServiceSeedSnapshot
} from '../../src/scripts/permission-service-seed-validate'

// Verifies permission seed validation catches database drift without mutating permission data.
describe('permission service seed validation', () => {
  it('accepts a snapshot that exactly matches the consolidated seed', () => {
    const seed = buildPermissionServiceSeed()
    const result = validatePermissionServiceSeedSnapshot(seed, buildMatchingSnapshot(seed))

    expect(result.mode).toBe('validate')
    expect(result.writesDatabase).toBe(false)
    expect(result.validationErrors).toEqual([])
  })

  it('reports missing seed rows and field drift', () => {
    const seed = buildPermissionServiceSeed()
    const snapshot = buildMatchingSnapshot(seed)
    snapshot.permissions = snapshot.permissions.slice(1)
    snapshot.roles[0] = {
      ...snapshot.roles[0],
      name: 'Drifted System Admin'
    }

    const result = validatePermissionServiceSeedSnapshot(seed, snapshot)

    expect(result.validationErrors).toEqual(
      expect.arrayContaining([
        expect.stringContaining(`Missing permission ${seed.permissionCodes[0].code}`),
        expect.stringContaining('Role system.admin field name drift')
      ])
    )
  })

  it('reports role permission drift for system-managed seed roles', () => {
    const seed = buildPermissionServiceSeed()
    const snapshot = buildMatchingSnapshot(seed)
    snapshot.rolePermissions = snapshot.rolePermissions.slice(1)
    snapshot.rolePermissions.push({
      permissionCode: 'permission.extra.unapproved',
      roleId: seed.roles[0].id
    })

    const result = validatePermissionServiceSeedSnapshot(seed, snapshot)

    expect(result.validationErrors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Role system.admin is missing permission'),
        expect.stringContaining('Role system.admin has unapproved permission permission.extra.unapproved')
      ])
    )
  })
})

function buildMatchingSnapshot(
  seed: ReturnType<typeof buildPermissionServiceSeed>
): PermissionServiceSeedValidationSnapshot {
  return {
    navigationEntries: seed.navigationEntries.map((entry) => ({ ...entry })),
    permissions: seed.permissionCodes.map((permission) => ({ ...permission })),
    roleLandingPolicies: seed.roleLandingPolicies.map((policy) => ({ ...policy })),
    roleNavigationVisibility: seed.roleNavigationVisibility.map((visibility) => ({
      ...visibility
    })),
    rolePermissions: seed.rolePermissions.map((rolePermission) => ({
      permissionCode: rolePermission.permissionCode,
      roleId: rolePermission.roleId
    })),
    roles: seed.roles.map((role) => ({ ...role }))
  }
}
