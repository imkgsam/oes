import {
  buildPermissionServiceSeed,
  renderPermissionServiceSeedDryRunSummary
} from '../../src/scripts/permission-service-seed'
import {
  applyPermissionServiceSeed,
  buildPermissionServiceSeedExecutionPlan,
  parsePermissionServiceSeedArgs
} from '../../src/scripts/permission-service-seed-writer'

// Verifies the permission-service seed writer is safe-by-default and requires explicit apply.
describe('permission service seed writer', () => {
  it('defaults to dry-run mode unless --apply is provided', () => {
    expect(parsePermissionServiceSeedArgs([])).toEqual({ apply: false })
    expect(parsePermissionServiceSeedArgs(['--dry-run'])).toEqual({ apply: false })
    expect(parsePermissionServiceSeedArgs(['--apply'])).toEqual({ apply: true })
  })

  it('builds an auditable execution plan from the consolidated seed', () => {
    const seed = buildPermissionServiceSeed()

    expect(buildPermissionServiceSeedExecutionPlan(seed, { apply: false })).toEqual({
      mode: 'dry-run',
      writesDatabase: false,
      summary: renderPermissionServiceSeedDryRunSummary(seed),
      validationErrors: []
    })
    expect(buildPermissionServiceSeedExecutionPlan(seed, { apply: true })).toMatchObject({
      mode: 'apply',
      writesDatabase: true,
      validationErrors: []
    })
  })

  it('replaces seed-owned role navigation rows instead of leaving stale visibility behind', async () => {
    const seed = buildPermissionServiceSeed()
    const calls: string[] = []
    const permissionIdByCode = new Map(seed.permissionCodes.map((permission) => [permission.code, `perm:${permission.code}`]))
    const prisma = {
      permission: {
        upsert: jest.fn(async ({ create }: any) => ({
          id: permissionIdByCode.get(create.code),
          code: create.code
        }))
      },
      role: {
        upsert: jest.fn(async () => ({}))
      },
      rolePermission: {
        deleteMany: jest.fn(async () => ({})),
        createMany: jest.fn(async () => ({}))
      },
      navigationEntry: {
        upsert: jest.fn(async () => ({})),
        updateMany: jest.fn(async () => ({}))
      },
      roleNavigationVisibility: {
        deleteMany: jest.fn(async () => {
          calls.push('roleNavigationVisibility.deleteMany')
          return {}
        }),
        createMany: jest.fn(async () => {
          calls.push('roleNavigationVisibility.createMany')
          return {}
        }),
        updateMany: jest.fn(async () => ({}))
      },
      roleLandingPolicy: {
        deleteMany: jest.fn(async () => {
          calls.push('roleLandingPolicy.deleteMany')
          return {}
        }),
        findMany: jest.fn(async () => []),
        createMany: jest.fn(async () => {
          calls.push('roleLandingPolicy.createMany')
          return {}
        }),
        updateMany: jest.fn(async () => ({}))
      }
    }

    await applyPermissionServiceSeed(prisma as any, seed)

    expect(prisma.roleNavigationVisibility.deleteMany).toHaveBeenCalledWith({
      where: { roleId: { in: seed.roles.map((role) => role.id) } }
    })
    expect(prisma.roleLandingPolicy.deleteMany).toHaveBeenCalledWith({
      where: { roleId: { in: seed.roles.map((role) => role.id) } }
    })
    expect(calls.indexOf('roleNavigationVisibility.deleteMany')).toBeLessThan(
      calls.indexOf('roleNavigationVisibility.createMany')
    )
    expect(calls.indexOf('roleLandingPolicy.deleteMany')).toBeLessThan(
      calls.indexOf('roleLandingPolicy.createMany')
    )
  })
})
