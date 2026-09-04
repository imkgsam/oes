import { PermissionManagementGrpcController } from '../../src/interfaces/grpc/permission-management.grpc.controller'
import { AccountRole } from '../../src/domain/vo/account-role.value-object'
import { AccountType } from '../../src/domain/enums/account-type.enum'
import { ScopeLevel } from '../../src/domain/enums/scope-level.enum'

describe('PermissionManagementGrpcController PrincipalRoleBinding contract', () => {
  const binding = new AccountRole(
    AccountType.USER,
    'account-1',
    'role-1',
    'tenant-1',
    ScopeLevel.TENANT,
    null,
    null,
    'binding-1'
  )

  const createController = () => {
    const commandBus = { execute: jest.fn() }
    const queryBus = { execute: jest.fn() }
    const auditService = { emitManagementMutation: jest.fn() }
    return {
      commandBus,
      queryBus,
      auditService,
      controller: new PermissionManagementGrpcController(
        commandBus as any,
        queryBus as any,
        auditService as any
      )
    }
  }

  it('returns the immutable bindingId persisted by AssignAccountRoleCommand', async () => {
    const { controller, commandBus } = createController()
    commandBus.execute.mockResolvedValue(binding)

    await expect(
      controller.assignAccountRole({
        accountId: binding.accountId,
        accountType: binding.accountType,
        roleId: binding.roleId,
        tenantId: binding.tenantId,
        scopeLevel: binding.scopeLevel
      } as any)
    ).resolves.toEqual({ bindingId: 'binding-1' })
  })

  it('returns the first persisted revoke facts for canonical bindingId revoke', async () => {
    const { controller, commandBus } = createController()
    commandBus.execute.mockResolvedValue({
      bindingId: 'binding-1',
      revokedAt: new Date('2026-07-29T10:00:00.000Z'),
      revokedByOperatorId: 'operator-1',
      reason: 'rotation',
      auditEventId: 'audit-1',
      revokedNow: false
    })

    await expect(
      controller.revokePrincipalRoleBinding({
        bindingId: 'binding-1',
        reason: 'ignored-on-retry'
      } as any)
    ).resolves.toEqual({
      result: {
        bindingId: 'binding-1',
        revokedAt: '2026-07-29T10:00:00.000Z',
        revokedByOperatorId: 'operator-1',
        reason: 'rotation',
        auditEventId: 'audit-1'
      }
    })
  })

  it('returns binding records alongside roles on the binding-read surface', async () => {
    const { controller, queryBus } = createController()
    queryBus.execute.mockResolvedValue({ roles: [], bindings: [binding] })

    await expect(
      controller.listAccountRoles({
        accountId: binding.accountId,
        tenantId: binding.tenantId,
        scopeLevel: binding.scopeLevel
      } as any)
    ).resolves.toEqual({
      roles: [],
      bindings: [
        {
          accountId: binding.accountId,
          accountType: binding.accountType,
          roleId: binding.roleId,
          tenantId: binding.tenantId,
          scopeLevel: binding.scopeLevel,
          bindingId: binding.bindingId
        }
      ]
    })
  })
})
