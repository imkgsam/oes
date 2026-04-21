import { RoleKind } from '../../prisma/generated/prisma'
import { syncBuiltInRoleInstanceBaselines } from '../../src/scripts/role-instance-foundation'

describe('role instance foundation sync', () => {
  it('backfills missing baseline permissions onto built-in tenant admin instances', async () => {
    const prisma = {
      role: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'tenant-admin-role-1' },
          { id: 'tenant-admin-role-2' }
        ])
      },
      rolePermission: {
        findMany: jest.fn().mockResolvedValue([
          { roleId: 'tenant-admin-role-1', permissionId: 'perm-view-role' }
        ]),
        createMany: jest.fn().mockResolvedValue({ count: 3 })
      }
    } as any

    const createdCount = await syncBuiltInRoleInstanceBaselines(
      prisma,
      new Map([
        ['permission.role.list', 'perm-view-role'],
        ['permission.account.get_roles', 'perm-view-account-role']
      ])
    )

    expect(prisma.role.findMany).toHaveBeenCalledWith({
      where: {
        kind: {
          in: [RoleKind.SYSTEM_INSTANCE, RoleKind.TENANT_INSTANCE]
        },
        OR: [
          { code: 'tenant.admin' },
          { templateRoleId: '2cf72f72-e04a-4946-b8c0-22f120f82001' }
        ]
      },
      select: {
        id: true
      }
    })
    expect(prisma.rolePermission.createMany).toHaveBeenCalledWith({
      data: [
        {
          permissionId: 'perm-view-account-role',
          roleId: 'tenant-admin-role-1'
        },
        {
          permissionId: 'perm-view-role',
          roleId: 'tenant-admin-role-2'
        },
        {
          permissionId: 'perm-view-account-role',
          roleId: 'tenant-admin-role-2'
        }
      ],
      skipDuplicates: true
    })
    expect(createdCount).toBe(3)
  })
})
