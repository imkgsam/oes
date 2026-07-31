import { GrantInitialAccessForTenantAccountCommand } from '../../src/application/commands/role/grant-initial-access-for-tenant-account.command'
import { GrantInitialAccessForTenantAccountHandler } from '../../src/application/commands/role/grant-initial-access-for-tenant-account.handler'
import { buildTenantBoundQueryScope } from '../../src/application/authorization/operator-scope'
import { Role } from '../../src/domain/aggregates/role.aggregate'
import { AccountType } from '../../src/domain/enums/account-type.enum'
import { RoleKind } from '../../src/domain/enums/role-kind.enum'
import { ScopeLevel } from '../../src/domain/enums/scope-level.enum'
import { AccountRole } from '../../src/domain/vo/account-role.value-object'

function createRoleRepository() {
  return {
    findById: jest.fn(),
    assignAccountRole: jest.fn()
  }
}

function createGrantRequestRepository() {
  return {
    createPending: jest.fn(),
    findByIdempotencyKey: jest.fn(),
    markSucceeded: jest.fn()
  }
}

function createIdentityAccountReferencePort() {
  return {
    getAccountById: jest.fn()
  }
}

describe('GrantInitialAccessForTenantAccountHandler', () => {
  it('grants tenant.admin to the first tenant account through tenant onboarding semantics', async () => {
    const roleRepository = createRoleRepository()
    const requestRepository = createGrantRequestRepository()
    const identityAccountReferencePort = createIdentityAccountReferencePort()
    identityAccountReferencePort.getAccountById.mockResolvedValue({
      accountId: 'account-1',
      tenantId: 'tenant-1',
      scopeLevel: 'TENANT'
    })
    requestRepository.findByIdempotencyKey.mockResolvedValue(null)
    requestRepository.createPending.mockResolvedValue({
      id: 'grant-request-1',
      idempotencyKey: 'tenant-onboarding-1:grant-admin-role',
      tenantId: 'tenant-1',
      accountId: 'account-1',
      roleIds: ['role-tenant-admin'],
      bindingIds: ['binding-admin-1'],
      fingerprint: JSON.stringify({
        tenantId: 'tenant-1',
        accountId: 'account-1',
        roleIds: ['role-tenant-admin']
      }),
      status: 'PENDING'
    })
    roleRepository.findById.mockResolvedValue(
      new Role(
        'role-tenant-admin',
        'Tenant Admin',
        'tenant.admin',
        'tenant-1',
        RoleKind.TENANT_INSTANCE,
        true
      )
    )
    roleRepository.assignAccountRole.mockResolvedValue(
      new AccountRole(
        AccountType.USER,
        'account-1',
        'role-tenant-admin',
        'tenant-1',
        ScopeLevel.TENANT,
        null,
        null,
        'binding-admin-1'
      )
    )
    requestRepository.markSucceeded.mockResolvedValue({
      id: 'grant-request-1',
      idempotencyKey: 'tenant-onboarding-1:grant-admin-role',
      tenantId: 'tenant-1',
      accountId: 'account-1',
      roleIds: ['role-tenant-admin'],
      bindingIds: ['binding-admin-1'],
      fingerprint: JSON.stringify({
        tenantId: 'tenant-1',
        accountId: 'account-1',
        roleIds: ['role-tenant-admin']
      }),
      status: 'SUCCEEDED'
    })

    const handler = new GrantInitialAccessForTenantAccountHandler(
      roleRepository as any,
      requestRepository as any,
      identityAccountReferencePort as any
    )

    await expect(
      handler.execute(
        new GrantInitialAccessForTenantAccountCommand({
          tenantId: 'tenant-1',
          accountId: 'account-1',
          roleIds: ['role-tenant-admin'],
          idempotencyKey: 'tenant-onboarding-1:grant-admin-role',
          operatorScope: buildTenantBoundQueryScope(
            { operatorId: 'operator-1', tenantId: 'tenant-1', isSystemScope: false },
            'tenant-1'
          )
        })
      )
    ).resolves.toMatchObject({
      grantId: 'grant-request-1',
      accountId: 'account-1',
      roleIds: ['role-tenant-admin'],
      bindingIds: ['binding-admin-1']
    })

    expect(roleRepository.assignAccountRole).toHaveBeenCalledWith(
      'account-1',
      'role-tenant-admin',
      'tenant-1',
      ScopeLevel.TENANT,
      AccountType.USER,
      null,
      null,
      expect.objectContaining({ bindingId: 'binding-admin-1' })
    )
    expect(requestRepository.markSucceeded).toHaveBeenCalledWith(
      expect.objectContaining({ bindingIds: ['binding-admin-1'] })
    )
  })
})
