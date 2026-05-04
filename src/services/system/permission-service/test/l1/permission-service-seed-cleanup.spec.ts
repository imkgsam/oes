import { buildPermissionServiceSeed } from '../../src/scripts/permission-service-seed'
import {
  PERMISSION_SERVICE_SEED_CLEANUP_ORDER,
  buildPermissionServiceSeedCleanupDryRunPlan
} from '../../src/scripts/permission-service-seed-cleanup'

// Verifies permission seed cleanup remains an auditable dry-run plan before any destructive implementation exists.
describe('permission service seed cleanup dry-run', () => {
  it('renders the safe cleanup order without enabling database writes', () => {
    const seed = buildPermissionServiceSeed()
    const plan = buildPermissionServiceSeedCleanupDryRunPlan(seed, {
      accountRoleBindingCount: 0,
      deprecatedPermissionCount: seed.deprecatedPermissionCodes.length,
      deprecatedPolicyReferenceCount: 0,
      deprecatedRolePermissionReferenceCount: 0,
      externalNavigationLandingPolicyCount: 0,
      externalNavigationVisibilityCount: 0,
      externalRolePermissionReferenceCount: 0,
      navigationEntryCount: seed.navigationEntries.length,
      permissionCount: seed.permissionCodes.length,
      policyReferenceCount: 0,
      roleCount: seed.roles.length,
      roleLandingPolicyCount: seed.roleLandingPolicies.length,
      roleNavigationVisibilityCount: seed.roleNavigationVisibility.length,
      rolePermissionCount: seed.rolePermissions.length,
      roleTemplateInstanceCount: 0
    })

    expect(plan.mode).toBe('dry-run')
    expect(plan.writesDatabase).toBe(false)
    expect(plan.cleanupOrder).toEqual(PERMISSION_SERVICE_SEED_CLEANUP_ORDER)
    expect(plan.hasBlockingReferences).toBe(false)
    expect(plan.protectedObjects).toEqual([
      'AccountRole',
      'Policy',
      'OnboardingGrantRequest',
      'AuditEvent',
      'DecisionEvent'
    ])
  })

  it('marks non-seed references as blockers instead of hiding destructive risk', () => {
    const seed = buildPermissionServiceSeed()
    const plan = buildPermissionServiceSeedCleanupDryRunPlan(seed, {
      accountRoleBindingCount: 2,
      deprecatedPermissionCount: seed.deprecatedPermissionCodes.length,
      deprecatedPolicyReferenceCount: 5,
      deprecatedRolePermissionReferenceCount: 7,
      externalNavigationLandingPolicyCount: 1,
      externalNavigationVisibilityCount: 1,
      externalRolePermissionReferenceCount: 3,
      navigationEntryCount: seed.navigationEntries.length,
      permissionCount: seed.permissionCodes.length,
      policyReferenceCount: 4,
      roleCount: seed.roles.length,
      roleLandingPolicyCount: seed.roleLandingPolicies.length,
      roleNavigationVisibilityCount: seed.roleNavigationVisibility.length,
      rolePermissionCount: seed.rolePermissions.length,
      roleTemplateInstanceCount: 1
    })

    expect(plan.hasBlockingReferences).toBe(true)
    expect(plan.blockers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ object: 'AccountRole', count: 2 }),
        expect.objectContaining({ object: 'Policy', count: 4 }),
        expect.objectContaining({ object: 'Policy', count: 5 }),
        expect.objectContaining({ object: 'RolePermission', count: 3 }),
        expect.objectContaining({ object: 'RoleNavigationVisibility', count: 1 }),
        expect.objectContaining({ object: 'RoleLandingPolicy', count: 1 }),
        expect.objectContaining({ object: 'Role', count: 1 })
      ])
    )
  })
})
