import { AssignAccountRoleCommand } from '../application/commands/role/assign-account-role.command'
import { AssignAccountRoleHandler } from '../application/commands/role/assign-account-role.handler'
import { AccountType } from '../domain/enums/account-type.enum'
import { RoleKind } from '../domain/enums/role-kind.enum'
import { ScopeLevel } from '../domain/enums/scope-level.enum'
import { Role } from '../domain/aggregates/role.aggregate'
import { AccountRole } from '../domain/vo/account-role.value-object'

describe('PrincipalRoleBinding command behavior', () => {
  const tenantRole = new Role(
    '8b9c1a93-b6e0-4d25-b843-2618fef1128a',
    'Tenant operator',
    'tenant.operator',
    'tenant-1',
    RoleKind.TENANT_INSTANCE,
    true
  )

  it('returns the immutable identity of the binding persisted for a HUMAN grant', async () => {
    const persisted = new AccountRole(
      AccountType.USER,
      '86cad2d7-27c3-442d-aef3-a63913dc4267',
      tenantRole.id,
      'tenant-1',
      ScopeLevel.TENANT,
      null,
      null,
      'binding-1'
    )
    const roleRepo = {
      findById: jest.fn().mockResolvedValue(tenantRole),
      assignAccountRole: jest.fn().mockResolvedValue(persisted)
    }
    const identityPort = {
      getAccountById: jest.fn().mockResolvedValue({
        accountId: persisted.accountId,
        tenantId: 'tenant-1',
        scopeLevel: 'TENANT',
        isActive: true
      }),
      getServiceAccountById: jest.fn()
    }
    const handler = new AssignAccountRoleHandler(roleRepo as any, identityPort as any)

    await expect(
      handler.execute(
        new AssignAccountRoleCommand({
          accountId: persisted.accountId,
          accountType: AccountType.USER,
          roleId: tenantRole.id,
          tenantId: 'tenant-1',
          scopeLevel: ScopeLevel.TENANT,
          operatorScope: {
            operatorId: 'operator-1',
            tenantId: 'tenant-1',
            isSystemScope: false,
            requestId: 'request-1',
            traceId: 'trace-1'
          }
        })
      )
    ).resolves.toBe(persisted)
    expect(identityPort.getAccountById).toHaveBeenCalledWith(persisted.accountId)
    expect(roleRepo.assignAccountRole).toHaveBeenCalledWith(
      persisted.accountId,
      tenantRole.id,
      'tenant-1',
      ScopeLevel.TENANT,
      AccountType.USER,
      null,
      null,
      {
        operatorId: 'operator-1',
        requestId: 'request-1',
        traceId: 'trace-1'
      }
    )
  })

  it('validates MACHINE grants against active Identity service-account facts', async () => {
    const systemRole = new Role(
      '3024a2fd-02af-411c-8b31-e0222320096c',
      'Automation',
      'system.automation',
      null,
      RoleKind.SYSTEM_INSTANCE,
      true
    )
    const persisted = new AccountRole(
      AccountType.SERVICE,
      '896692fe-371c-4e56-b0a9-8d9345227a8a',
      systemRole.id,
      null,
      ScopeLevel.SYSTEM,
      null,
      null,
      'binding-machine-1'
    )
    const roleRepo = {
      findById: jest.fn().mockResolvedValue(systemRole),
      assignAccountRole: jest.fn().mockResolvedValue(persisted)
    }
    const identityPort = {
      getAccountById: jest.fn(),
      getServiceAccountById: jest.fn().mockResolvedValue({
        principalId: persisted.accountId,
        tenantId: null,
        scopeLevel: 'SYSTEM',
        isActive: true
      })
    }
    const handler = new AssignAccountRoleHandler(roleRepo as any, identityPort as any)

    await expect(
      handler.execute(
        new AssignAccountRoleCommand({
          accountId: persisted.accountId,
          accountType: AccountType.SERVICE,
          roleId: systemRole.id,
          scopeLevel: ScopeLevel.SYSTEM,
          operatorScope: { operatorId: 'operator-1', isSystemScope: true }
        })
      )
    ).resolves.toBe(persisted)
    expect(identityPort.getServiceAccountById).toHaveBeenCalledWith(persisted.accountId)
    expect(identityPort.getAccountById).not.toHaveBeenCalled()
  })

  it('rejects an inactive or scope-mismatched principal before persistence', async () => {
    const roleRepo = {
      findById: jest.fn().mockResolvedValue(tenantRole),
      assignAccountRole: jest.fn()
    }
    const identityPort = {
      getAccountById: jest.fn().mockResolvedValue({
        accountId: '86cad2d7-27c3-442d-aef3-a63913dc4267',
        tenantId: 'tenant-2',
        scopeLevel: 'TENANT',
        isActive: true
      }),
      getServiceAccountById: jest.fn()
    }
    const handler = new AssignAccountRoleHandler(roleRepo as any, identityPort as any)

    await expect(
      handler.execute(
        new AssignAccountRoleCommand({
          accountId: '86cad2d7-27c3-442d-aef3-a63913dc4267',
          accountType: AccountType.USER,
          roleId: tenantRole.id,
          tenantId: 'tenant-1',
          scopeLevel: ScopeLevel.TENANT,
          operatorScope: {
            operatorId: 'operator-1',
            tenantId: 'tenant-1',
            isSystemScope: false
          }
        })
      )
    ).rejects.toBeDefined()
    expect(roleRepo.assignAccountRole).not.toHaveBeenCalled()
  })
})
