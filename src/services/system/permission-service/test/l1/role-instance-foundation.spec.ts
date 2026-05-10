import { RoleKind } from '../../prisma/generated/prisma'
import { syncBuiltInRoleInstanceBaselines } from '../../src/scripts/role-instance-foundation'

describe('role instance foundation sync', () => {
  it('backfills missing baseline permissions onto built-in tenant admin instances', async () => {
    const prisma = {
      role: {
        findMany: jest.fn().mockImplementation((args) =>
          args.where.OR?.some((item: { code?: string }) => item.code === 'tenant.admin')
            ? Promise.resolve([
                { id: 'tenant-admin-role-1', kind: RoleKind.TENANT_INSTANCE },
                { id: 'tenant-admin-role-2', kind: RoleKind.TENANT_INSTANCE }
              ])
            : Promise.resolve([])
        ),
        updateMany: jest.fn().mockResolvedValue({ count: 2 })
      },
      rolePermission: {
        findMany: jest.fn().mockResolvedValue([
          { roleId: 'tenant-admin-role-1', permissionId: 'perm-view-role-instance' }
        ]),
        createMany: jest.fn().mockResolvedValue({ count: 3 })
      },
      roleNavigationVisibility: {
        findMany: jest.fn().mockResolvedValue([]),
        createMany: jest.fn().mockResolvedValue({ count: 0 })
      },
      roleLandingPolicy: {
        findMany: jest.fn().mockResolvedValue([]),
        createMany: jest.fn().mockResolvedValue({ count: 0 })
      }
    } as any

    const createdCount = await syncBuiltInRoleInstanceBaselines(
      prisma,
      new Map([
        ['permission.role_instance.list', 'perm-view-role-instance'],
        ['permission.account.get_roles', 'perm-view-account-role'],
        ['identity.account.list', 'perm-identity-list-account'],
        ['tenant_org.org_unit.list_tree', 'perm-list-org-tree']
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
        id: true,
        kind: true
      }
    })
    expect(prisma.role.updateMany).toHaveBeenCalledWith({
      where: {
        id: {
          in: ['tenant-admin-role-1', 'tenant-admin-role-2']
        }
      },
      data: {
        allowTenantPermissionOverride: false,
        isProtected: true
      }
    })
    expect(prisma.rolePermission.createMany).toHaveBeenCalledWith({
      data: [
        {
          permissionId: 'perm-view-account-role',
          roleId: 'tenant-admin-role-1'
        },
        {
          permissionId: 'perm-identity-list-account',
          roleId: 'tenant-admin-role-1'
        },
        {
          permissionId: 'perm-list-org-tree',
          roleId: 'tenant-admin-role-1'
        },
        {
          permissionId: 'perm-view-role-instance',
          roleId: 'tenant-admin-role-2'
        },
        {
          permissionId: 'perm-view-account-role',
          roleId: 'tenant-admin-role-2'
        },
        {
          permissionId: 'perm-identity-list-account',
          roleId: 'tenant-admin-role-2'
        },
        {
          permissionId: 'perm-list-org-tree',
          roleId: 'tenant-admin-role-2'
        }
      ],
      skipDuplicates: true
    })
    expect(createdCount).toBe(7)
  })

  it('backfills missing baseline navigation onto built-in tenant role instances without removing custom entries', async () => {
    const prisma = {
      role: {
        findMany: jest.fn().mockImplementation((args) =>
          args.where.OR?.some((item: { code?: string }) => item.code === 'item_master.product_data_manager')
            ? Promise.resolve([
                {
                  id: 'item-role-1',
                  kind: RoleKind.TENANT_INSTANCE
                }
              ])
            : Promise.resolve([])
        ),
        updateMany: jest.fn().mockResolvedValue({ count: 1 })
      },
      rolePermission: {
        findMany: jest.fn().mockResolvedValue([]),
        createMany: jest.fn().mockResolvedValue({ count: 0 })
      },
      roleNavigationVisibility: {
        findMany: jest.fn().mockResolvedValue([
          {
            entryKey: 'master-data.item-management',
            roleId: 'item-role-1',
            terminal: 'DEFAULT'
          },
          {
            entryKey: 'custom.local-dashboard',
            roleId: 'item-role-1',
            terminal: 'DEFAULT'
          }
        ]),
        createMany: jest.fn().mockResolvedValue({ count: 1 })
      },
      roleLandingPolicy: {
        findMany: jest.fn().mockResolvedValue([
          {
            defaultEntryKey: 'workbench.home',
            roleId: 'item-role-1',
            terminal: 'DEFAULT'
          }
        ]),
        createMany: jest.fn().mockResolvedValue({ count: 0 })
      }
    } as any

    await syncBuiltInRoleInstanceBaselines(
      prisma,
      new Map([
        ['item_master.item.list', 'perm-list-item'],
        ['item_master.item_category.list', 'perm-list-item-category']
      ])
    )

    expect(prisma.roleNavigationVisibility.createMany).toHaveBeenCalledWith({
      data: [
        {
          enabled: true,
          entryKey: 'workbench.home',
          roleId: 'item-role-1',
          terminal: 'DEFAULT'
        },
        {
          enabled: true,
          entryKey: 'master-data.item-category-management',
          roleId: 'item-role-1',
          terminal: 'DEFAULT'
        }
      ],
      skipDuplicates: true
    })
    expect(prisma.roleLandingPolicy.createMany).not.toHaveBeenCalled()
  })
})
