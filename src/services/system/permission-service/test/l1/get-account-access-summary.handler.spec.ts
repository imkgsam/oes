import { GetAccountAccessSummaryHandler } from '../../src/application/queries/access-summary'
import { GetAccountAccessSummaryQuery } from '../../src/application/queries/access-summary/get-account-access-summary.query'
import { Role } from '../../src/domain/aggregates/role.aggregate'
import { RoleKind } from '../../src/domain/enums/role-kind.enum'
import { ScopeLevel } from '../../src/domain/enums/scope-level.enum'
import { RoleRepository } from '../../src/domain/repositories/role.repository'
import { RolePermission } from '../../src/domain/vo/role-permission.value-object'

describe('GetAccountAccessSummaryHandler', () => {
  it('returns stable role summaries and deduplicated action codes', async () => {
    const roleRepo = {
      findAccountRoles: jest.fn().mockResolvedValue([
        new Role(
          'role-2',
          'Viewer',
          'viewer',
          'tenant-1',
          RoleKind.TENANT_INSTANCE,
          true,
          undefined,
          null,
          [
            new RolePermission('role-2', 'perm-2', 'permission.list'),
            new RolePermission('role-2', 'perm-3', 'role.create')
          ]
        ),
        new Role(
          'role-1',
          'Admin',
          'admin',
          'tenant-1',
          RoleKind.TENANT_INSTANCE,
          true,
          undefined,
          null,
          [
            new RolePermission('role-1', 'perm-1', 'role.create'),
            new RolePermission('role-1', 'perm-4', 'account.read')
          ]
        )
      ])
    } as unknown as jest.Mocked<RoleRepository>

    const handler = new GetAccountAccessSummaryHandler(roleRepo)

    await expect(
      handler.execute(new GetAccountAccessSummaryQuery('account-1', 'tenant-1'))
    ).resolves.toEqual({
      roles: [
        {
          roleId: 'role-1',
          code: 'admin',
          name: 'Admin',
          tenantId: 'tenant-1',
          scope: 'TENANT'
        },
        {
          roleId: 'role-2',
          code: 'viewer',
          name: 'Viewer',
          tenantId: 'tenant-1',
          scope: 'TENANT'
        }
      ],
      actionCodes: ['account.read', 'permission.list', 'role.create']
    })
    expect(roleRepo.findAccountRoles).toHaveBeenCalledWith(
      'account-1',
      'tenant-1',
      ScopeLevel.TENANT
    )
  })

  it('resolves system account summaries without tenant id', async () => {
    const roleRepo = {
      findAccountRoles: jest.fn().mockResolvedValue([
        new Role(
          'role-system-1',
          'System Admin',
          'system.admin',
          null,
          RoleKind.SYSTEM_INSTANCE,
          true,
          undefined,
          null,
          [new RolePermission('role-system-1', 'perm-1', 'permission.create')]
        )
      ])
    } as unknown as jest.Mocked<RoleRepository>

    const handler = new GetAccountAccessSummaryHandler(roleRepo)

    await expect(
      handler.execute(
        new GetAccountAccessSummaryQuery('account-system', undefined, ScopeLevel.SYSTEM)
      )
    ).resolves.toEqual({
      roles: [
        {
          roleId: 'role-system-1',
          code: 'system.admin',
          name: 'System Admin',
          tenantId: '',
          scope: 'SYSTEM'
        }
      ],
      actionCodes: ['permission.create']
    })
    expect(roleRepo.findAccountRoles).toHaveBeenCalledWith(
      'account-system',
      null,
      ScopeLevel.SYSTEM
    )
  })
})
