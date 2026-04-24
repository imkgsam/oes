import { GrantInitialAccessForEmployeeAccountCommand } from '../../src/application/commands/role/grant-initial-access-for-employee-account.command'
import { GrantInitialAccessForEmployeeAccountHandler } from '../../src/application/commands/role/grant-initial-access-for-employee-account.handler'
import { Role } from '../../src/domain/aggregates/role.aggregate'
import { AccountType } from '../../src/domain/enums/account-type.enum'
import { RoleKind } from '../../src/domain/enums/role-kind.enum'
import { ScopeLevel } from '../../src/domain/enums/scope-level.enum'
import { RoleRepository } from '../../src/domain/repositories/role.repository'
import { OnboardingGrantRequestRepository } from '../../src/domain/repositories/onboarding-grant-request.repository'
import { IdentityAccountReferencePort } from '../../src/application/ports/identity-account-reference.port'
import { buildTenantBoundQueryScope } from '../../src/application/authorization/operator-scope'
import { OESExceptionBase } from '@oes/common/exceptions'

function createRoleRepository(): jest.Mocked<RoleRepository> {
  return {
    findById: jest.fn(),
    findByCode: jest.fn(),
    findByScopeAndCode: jest.fn(),
    findByScopeKindAndCode: jest.fn(),
    findAll: jest.fn(),
    findRoleInstances: jest.fn(),
    findRoleTemplates: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    hasAssignedAccounts: jest.fn(),
    hasAssignedPermissions: jest.fn(),
    hasTemplateInstances: jest.fn(),
    findOwnPermissions: jest.fn(),
    findRolesByPermissionId: jest.fn(),
    findRolesForAccountId: jest.fn(),
    assignAccountRole: jest.fn(),
    revokeAccountRole: jest.fn(),
    findAccountRoles: jest.fn(),
    findRoleAccounts: jest.fn(),
    findTenantRoles: jest.fn(),
    findSystemRoles: jest.fn(),
    findRoleTemplateById: jest.fn(),
    replaceAccountRoles: jest.fn()
  } as unknown as jest.Mocked<RoleRepository>
}

function createOnboardingGrantRequestRepository(): jest.Mocked<OnboardingGrantRequestRepository> {
  return {
    createPending: jest.fn(),
    findByIdempotencyKey: jest.fn(),
    markSucceeded: jest.fn()
  } as unknown as jest.Mocked<OnboardingGrantRequestRepository>
}

function createIdentityAccountReferencePort(): jest.Mocked<IdentityAccountReferencePort> {
  return {
    getAccountById: jest.fn()
  } as unknown as jest.Mocked<IdentityAccountReferencePort>
}

function tenantRole(id: string, tenantId = 'tenant-1') {
  return new Role(id, `Role ${id}`, `ROLE_${id}`, tenantId, RoleKind.TENANT_INSTANCE, true)
}

describe('GrantInitialAccessForEmployeeAccountHandler', () => {
  const fingerprintFor = (input: {
    tenantId: string
    accountId: string
    roleIds: string[]
  }) =>
    JSON.stringify({
      tenantId: input.tenantId,
      accountId: input.accountId,
      roleIds: [...new Set(input.roleIds)].sort()
    })

  it('grants all requested tenant roles and persists a succeeded idempotency record', async () => {
    const roleRepository = createRoleRepository()
    const requestRepository = createOnboardingGrantRequestRepository()
    const identityAccountReferencePort = createIdentityAccountReferencePort()

    identityAccountReferencePort.getAccountById.mockResolvedValue({
      accountId: 'account-1',
      tenantId: 'tenant-1',
      scopeLevel: 'TENANT'
    })
    requestRepository.findByIdempotencyKey.mockResolvedValue(null)
    requestRepository.createPending.mockResolvedValue({
      idempotencyKey: 'grant-key-1',
      tenantId: 'tenant-1',
      accountId: 'account-1',
      roleIds: ['role-1', 'role-2'],
      fingerprint: 'fp-1',
      status: 'PENDING'
    })
    roleRepository.findById
      .mockResolvedValueOnce(tenantRole('role-1'))
      .mockResolvedValueOnce(tenantRole('role-2'))
    requestRepository.markSucceeded.mockResolvedValue({
      id: 'grant-request-1',
      idempotencyKey: 'grant-key-1',
      tenantId: 'tenant-1',
      accountId: 'account-1',
      roleIds: ['role-1', 'role-2'],
      fingerprint: 'fp-1',
      status: 'SUCCEEDED'
    })

    const handler = new GrantInitialAccessForEmployeeAccountHandler(
      roleRepository as unknown as RoleRepository,
      requestRepository as unknown as OnboardingGrantRequestRepository,
      identityAccountReferencePort
    )

    await expect(
      handler.execute(
        new GrantInitialAccessForEmployeeAccountCommand({
          tenantId: 'tenant-1',
          accountId: 'account-1',
          roleIds: ['role-1', 'role-2'],
          idempotencyKey: 'grant-key-1',
          operatorScope: buildTenantBoundQueryScope(
            {
              operatorId: 'operator-1',
              tenantId: 'tenant-1',
              isSystemScope: false
            },
            'tenant-1'
          )
        })
      )
    ).resolves.toMatchObject({
      idempotencyKey: 'grant-key-1',
      accountId: 'account-1',
      roleIds: ['role-1', 'role-2']
    })

    expect(roleRepository.assignAccountRole).toHaveBeenCalledTimes(2)
    expect(roleRepository.assignAccountRole).toHaveBeenNthCalledWith(
      1,
      'account-1',
      'role-1',
      'tenant-1',
      ScopeLevel.TENANT,
      AccountType.USER
    )
    expect(roleRepository.assignAccountRole).toHaveBeenNthCalledWith(
      2,
      'account-1',
      'role-2',
      'tenant-1',
      ScopeLevel.TENANT,
      AccountType.USER
    )
  })

  it('returns stored success for a repeated identical idempotency key without granting twice', async () => {
    const roleRepository = createRoleRepository()
    const requestRepository = createOnboardingGrantRequestRepository()
    const identityAccountReferencePort = createIdentityAccountReferencePort()

    identityAccountReferencePort.getAccountById.mockResolvedValue({
      accountId: 'account-1',
      tenantId: 'tenant-1',
      scopeLevel: 'TENANT'
    })
    requestRepository.findByIdempotencyKey.mockResolvedValue({
      id: 'grant-request-1',
      idempotencyKey: 'grant-key-1',
      tenantId: 'tenant-1',
      accountId: 'account-1',
      roleIds: ['role-1'],
      fingerprint: fingerprintFor({
        tenantId: 'tenant-1',
        accountId: 'account-1',
        roleIds: ['role-1']
      }),
      status: 'SUCCEEDED'
    })

    const handler = new GrantInitialAccessForEmployeeAccountHandler(
      roleRepository as unknown as RoleRepository,
      requestRepository as unknown as OnboardingGrantRequestRepository,
      identityAccountReferencePort
    )

    await expect(
      handler.execute(
        new GrantInitialAccessForEmployeeAccountCommand({
          tenantId: 'tenant-1',
          accountId: 'account-1',
          roleIds: ['role-1'],
          idempotencyKey: 'grant-key-1',
          operatorScope: buildTenantBoundQueryScope(
            {
              operatorId: 'operator-1',
              tenantId: 'tenant-1',
              isSystemScope: false
            },
            'tenant-1'
          )
        })
      )
    ).resolves.toMatchObject({
      idempotencyKey: 'grant-key-1',
      accountId: 'account-1',
      roleIds: ['role-1']
    })

    expect(roleRepository.assignAccountRole).not.toHaveBeenCalled()
  })

  it('rejects conflicting retries that reuse the same key with different critical fields', async () => {
    const roleRepository = createRoleRepository()
    const requestRepository = createOnboardingGrantRequestRepository()
    const identityAccountReferencePort = createIdentityAccountReferencePort()

    identityAccountReferencePort.getAccountById.mockResolvedValue({
      accountId: 'account-1',
      tenantId: 'tenant-1',
      scopeLevel: 'TENANT'
    })
    requestRepository.findByIdempotencyKey.mockResolvedValue({
      id: 'grant-request-1',
      idempotencyKey: 'grant-key-1',
      tenantId: 'tenant-1',
      accountId: 'account-1',
      roleIds: ['role-1'],
      fingerprint: 'fp-old',
      status: 'SUCCEEDED'
    })

    const handler = new GrantInitialAccessForEmployeeAccountHandler(
      roleRepository as unknown as RoleRepository,
      requestRepository as unknown as OnboardingGrantRequestRepository,
      identityAccountReferencePort
    )

    const error = await handler
      .execute(
        new GrantInitialAccessForEmployeeAccountCommand({
          tenantId: 'tenant-1',
          accountId: 'account-1',
          roleIds: ['role-2'],
          idempotencyKey: 'grant-key-1',
          operatorScope: buildTenantBoundQueryScope(
            {
              operatorId: 'operator-1',
              tenantId: 'tenant-1',
              isSystemScope: false
            },
            'tenant-1'
          )
        })
      )
      .then(
        () => null,
        (reason) => reason
      )

    expect(error).toBeInstanceOf(OESExceptionBase)
    expect((error as OESExceptionBase).toRpcPayload()).toMatchObject({
      code: 'ONBOARDING_GRANT_IDEMPOTENCY_CONFLICT',
      message: 'Onboarding grant idempotency conflict',
      grpcStatus: 9
    })

    expect(roleRepository.assignAccountRole).not.toHaveBeenCalled()
  })

  it('surfaces role-not-assignable as a business error instead of a generic conflict', async () => {
    const roleRepository = createRoleRepository()
    const requestRepository = createOnboardingGrantRequestRepository()
    const identityAccountReferencePort = createIdentityAccountReferencePort()

    identityAccountReferencePort.getAccountById.mockResolvedValue({
      accountId: 'account-1',
      tenantId: 'tenant-1',
      scopeLevel: 'TENANT'
    })
    requestRepository.findByIdempotencyKey.mockResolvedValue(null)
    requestRepository.createPending.mockResolvedValue({
      idempotencyKey: 'grant-key-1',
      tenantId: 'tenant-1',
      accountId: 'account-1',
      roleIds: ['role-1'],
      fingerprint: 'fp-1',
      status: 'PENDING'
    })
    roleRepository.findById.mockResolvedValue(
      new Role('role-1', 'Role role-1', 'ROLE_ROLE_1', 'tenant-2', RoleKind.TENANT_INSTANCE, true)
    )

    const handler = new GrantInitialAccessForEmployeeAccountHandler(
      roleRepository as unknown as RoleRepository,
      requestRepository as unknown as OnboardingGrantRequestRepository,
      identityAccountReferencePort
    )

    const error = await handler
      .execute(
        new GrantInitialAccessForEmployeeAccountCommand({
          tenantId: 'tenant-1',
          accountId: 'account-1',
          roleIds: ['role-1'],
          idempotencyKey: 'grant-key-1',
          operatorScope: buildTenantBoundQueryScope(
            {
              operatorId: 'operator-1',
              tenantId: 'tenant-1',
              isSystemScope: false
            },
            'tenant-1'
          )
        })
      )
      .then(
        () => null,
        (reason) => reason
      )

    expect(error).toBeInstanceOf(OESExceptionBase)
    expect((error as OESExceptionBase).toRpcPayload()).toMatchObject({
      code: 'ROLE_NOT_ASSIGNABLE',
      message: 'Role is not assignable in the current tenant context',
      grpcStatus: 9
    })
    expect(roleRepository.assignAccountRole).not.toHaveBeenCalled()
  })
})
