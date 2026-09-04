import {
  PermissionSchemaDriftRepairSnapshot,
  buildPermissionSchemaDriftRepairPlan
} from '../scripts/permission-schema-drift-repair'
import { buildPrismaDbPushArgs } from '../scripts/permission-prisma-push'

const baseSnapshot: PermissionSchemaDriftRepairSnapshot = {
  deprecatedPermissionCount: 1,
  deprecatedPermissionCodes: ['collaboration.task.assign'],
  deprecatedPolicyReferenceCount: 0,
  deprecatedPolicyInstanceReferenceCount: 0,
  deprecatedRolePermissionReferenceCount: 4
}

// Verifies the pre-Prisma repair only removes deprecated permissions when policy truth is not at risk.
describe('permission schema drift repair', () => {
  it('allows deleting deprecated permissions and role-permission references before enum shrink', () => {
    const plan = buildPermissionSchemaDriftRepairPlan(baseSnapshot)

    expect(plan.canRepair).toBe(true)
    expect(plan.cleanupOrder).toEqual(['RolePermission', 'Permission'])
    expect(plan.blockers).toEqual([])
  })

  it('blocks repair when deprecated permission codes are still referenced by policies', () => {
    const plan = buildPermissionSchemaDriftRepairPlan({
      ...baseSnapshot,
      deprecatedPolicyReferenceCount: 1
    })

    expect(plan.canRepair).toBe(false)
    expect(plan.blockers).toEqual([
      expect.objectContaining({
        object: 'Policy',
        count: 1
      })
    ])
  })

  it('only accepts Prisma data loss for known deprecated enum drift', () => {
    expect(buildPrismaDbPushArgs([])).toEqual(['prisma', 'db', 'push'])
    expect(buildPrismaDbPushArgs(['COLLABORATION_SERVICE'])).toEqual([
      'prisma',
      'db',
      'push',
      '--accept-data-loss'
    ])
  })
})
