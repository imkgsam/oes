import { GrantInitialAccessForEmployeeAccountCommand } from '../application/commands/role/grant-initial-access-for-employee-account.command'
import { GrantInitialAccessForEmployeeAccountHandler } from '../application/commands/role/grant-initial-access-for-employee-account.handler'
import { Role } from '../domain/aggregates/role.aggregate'
import { AccountType } from '../domain/enums/account-type.enum'
import { RoleKind } from '../domain/enums/role-kind.enum'
import { ScopeLevel } from '../domain/enums/scope-level.enum'
import { RoleRepository } from '../domain/repositories/role.repository'
import { NavigationRepository } from '../domain/repositories/navigation.repository'
import { OnboardingGrantRequestRepository } from '../domain/repositories/onboarding-grant-request.repository'
import { RolePermission } from '../domain/vo/role-permission.value-object'
import { IdentityAccountReferencePort } from '../application/ports/identity-account-reference.port'
import { buildTenantBoundQueryScope } from '../application/authorization/operator-scope'
import { OESExceptionBase } from '@oes/common/exceptions'
import { AccountRole } from '../domain/vo/account-role.value-object'

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

function createNavigationRepository(): jest.Mocked<NavigationRepository> {
  return {
    findEntryByKey: jest.fn(),
    listEntries: jest.fn(),
    saveEntry: jest.fn(),
    findRoleNavigation: jest.fn().mockResolvedValue({
      roleId: 'template-account-basic',
      visibility: [],
      landingPolicies: []
    }),
    replaceRoleVisibility: jest.fn().mockResolvedValue({
      roleId: 'account-basic-role-id',
      visibility: [],
      landingPolicies: []
    }),
    replaceRoleLandingPolicies: jest.fn().mockResolvedValue({
      roleId: 'account-basic-role-id',
      visibility: [],
      landingPolicies: []
    }),
    findVisibleEntriesForRoles: jest.fn(),
    findLandingPoliciesForRoles: jest.fn()
  } as unknown as jest.Mocked<NavigationRepository>
}

function tenantRole(id: string, tenantId = 'tenant-1') {
  return new Role(id, `Role ${id}`, `ROLE_${id}`, tenantId, RoleKind.TENANT_INSTANCE, true)
}

describe('GrantInitialAccessForEmployeeAccountHandler', () => {
  const fingerprintFor = (input: { tenantId: string; accountId: string; roleIds: string[] }) =>
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
      bindingIds: ['binding-1', 'binding-2'],
      fingerprint: 'fp-1',
      status: 'PENDING'
    })
    roleRepository.findById
      .mockResolvedValueOnce(tenantRole('role-1'))
      .mockResolvedValueOnce(tenantRole('role-2'))
    roleRepository.assignAccountRole
      .mockResolvedValueOnce(
        new AccountRole(
          AccountType.USER,
          'account-1',
          'role-1',
          'tenant-1',
          ScopeLevel.TENANT,
          null,
          null,
          'binding-1'
        )
      )
      .mockResolvedValueOnce(
        new AccountRole(
          AccountType.USER,
          'account-1',
          'role-2',
          'tenant-1',
          ScopeLevel.TENANT,
          null,
          null,
          'binding-2'
        )
      )
    requestRepository.markSucceeded.mockResolvedValue({
      id: 'grant-request-1',
      idempotencyKey: 'grant-key-1',
      tenantId: 'tenant-1',
      accountId: 'account-1',
      roleIds: ['role-1', 'role-2'],
      bindingIds: ['binding-1', 'binding-2'],
      fingerprint: 'fp-1',
      status: 'SUCCEEDED'
    })

    const handler = new GrantInitialAccessForEmployeeAccountHandler(
      roleRepository as unknown as RoleRepository,
      requestRepository as unknown as OnboardingGrantRequestRepository,
      identityAccountReferencePort,
      createNavigationRepository()
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
      roleIds: ['role-1', 'role-2'],
      bindingIds: ['binding-1', 'binding-2']
    })

    expect(roleRepository.assignAccountRole).toHaveBeenCalledTimes(2)
    expect(roleRepository.assignAccountRole).toHaveBeenNthCalledWith(
      1,
      'account-1',
      'role-1',
      'tenant-1',
      ScopeLevel.TENANT,
      AccountType.USER,
      null,
      null,
      expect.objectContaining({ bindingId: 'binding-1' })
    )
    expect(roleRepository.assignAccountRole).toHaveBeenNthCalledWith(
      2,
      'account-1',
      'role-2',
      'tenant-1',
      ScopeLevel.TENANT,
      AccountType.USER,
      null,
      null,
      expect.objectContaining({ bindingId: 'binding-2' })
    )
    expect(requestRepository.markSucceeded).toHaveBeenCalledWith(
      expect.objectContaining({ bindingIds: ['binding-1', 'binding-2'] })
    )
  })

  it('defaults empty onboarding grants to the tenant account.basic role', async () => {
    const roleRepository = createRoleRepository()
    const requestRepository = createOnboardingGrantRequestRepository()
    const identityAccountReferencePort = createIdentityAccountReferencePort()

    identityAccountReferencePort.getAccountById.mockResolvedValue({
      accountId: 'account-1',
      tenantId: 'tenant-1',
      scopeLevel: 'TENANT'
    })
    roleRepository.findByScopeKindAndCode.mockResolvedValue(
      new Role(
        'account-basic-role-id',
        'Account Basic',
        'account.basic',
        'tenant-1',
        RoleKind.TENANT_INSTANCE,
        true
      )
    )
    requestRepository.findByIdempotencyKey.mockResolvedValue(null)
    requestRepository.createPending.mockResolvedValue({
      idempotencyKey: 'grant-key-1',
      tenantId: 'tenant-1',
      accountId: 'account-1',
      roleIds: ['account-basic-role-id'],
      fingerprint: 'fp-1',
      status: 'PENDING'
    })
    roleRepository.findById.mockResolvedValue(tenantRole('account-basic-role-id'))
    requestRepository.markSucceeded.mockResolvedValue({
      id: 'grant-request-1',
      idempotencyKey: 'grant-key-1',
      tenantId: 'tenant-1',
      accountId: 'account-1',
      roleIds: ['account-basic-role-id'],
      fingerprint: 'fp-1',
      status: 'SUCCEEDED'
    })

    const handler = new GrantInitialAccessForEmployeeAccountHandler(
      roleRepository as unknown as RoleRepository,
      requestRepository as unknown as OnboardingGrantRequestRepository,
      identityAccountReferencePort,
      createNavigationRepository()
    )

    await expect(
      handler.execute(
        new GrantInitialAccessForEmployeeAccountCommand({
          tenantId: 'tenant-1',
          accountId: 'account-1',
          roleIds: [],
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
      roleIds: ['account-basic-role-id']
    })

    expect(roleRepository.findByScopeKindAndCode).toHaveBeenCalledWith(
      'tenant-1',
      RoleKind.TENANT_INSTANCE,
      'account.basic'
    )
    expect(roleRepository.assignAccountRole).toHaveBeenCalledWith(
      'account-1',
      'account-basic-role-id',
      'tenant-1',
      ScopeLevel.TENANT,
      AccountType.USER,
      null,
      null,
      expect.objectContaining({ bindingId: expect.any(String) })
    )
  })

  it('creates the tenant account.basic role from the system template when the tenant instance is missing', async () => {
    const roleRepository = createRoleRepository()
    const requestRepository = createOnboardingGrantRequestRepository()
    const identityAccountReferencePort = createIdentityAccountReferencePort()
    const navigationRepository = createNavigationRepository()
    const accountBasicTemplate = new Role(
      'template-account-basic',
      'Account Basic',
      'account.basic',
      null,
      RoleKind.SYSTEM_TEMPLATE,
      true
    )
    accountBasicTemplate.addPermission(
      new RolePermission(
        'template-account-basic',
        'permission-self-read',
        'identity.account.self.read'
      )
    )
    roleRepository.findByScopeKindAndCode
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(accountBasicTemplate)
    roleRepository.save.mockImplementation(async (role) => {
      roleRepository.findById.mockResolvedValue(role)
      return role
    })
    identityAccountReferencePort.getAccountById.mockResolvedValue({
      accountId: 'account-1',
      tenantId: 'tenant-1',
      scopeLevel: 'TENANT'
    })
    requestRepository.findByIdempotencyKey.mockResolvedValue(null)
    requestRepository.createPending.mockImplementation(async (input) => ({
      ...input,
      status: 'PENDING'
    }))
    requestRepository.markSucceeded.mockImplementation(async (input) => ({
      id: 'grant-request-1',
      ...input,
      status: 'SUCCEEDED'
    }))

    const handler = new GrantInitialAccessForEmployeeAccountHandler(
      roleRepository as unknown as RoleRepository,
      requestRepository as unknown as OnboardingGrantRequestRepository,
      identityAccountReferencePort,
      navigationRepository
    )

    const result = await handler.execute(
      new GrantInitialAccessForEmployeeAccountCommand({
        tenantId: 'tenant-1',
        accountId: 'account-1',
        roleIds: [],
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

    expect(result.roleIds).toHaveLength(1)
    expect(roleRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'account.basic',
        tenantId: 'tenant-1',
        kind: RoleKind.TENANT_INSTANCE,
        templateRoleId: 'template-account-basic'
      })
    )
    expect(navigationRepository.findRoleNavigation).toHaveBeenCalledWith('template-account-basic')
    expect(roleRepository.assignAccountRole).toHaveBeenCalledWith(
      'account-1',
      result.roleIds[0],
      'tenant-1',
      ScopeLevel.TENANT,
      AccountType.USER,
      null,
      null,
      expect.objectContaining({ bindingId: expect.any(String) })
    )
  })

  it('does not derive account.basic before tenant scope authorization passes', async () => {
    const roleRepository = createRoleRepository()
    const requestRepository = createOnboardingGrantRequestRepository()
    const identityAccountReferencePort = createIdentityAccountReferencePort()
    const accountBasicTemplate = new Role(
      'template-account-basic',
      'Account Basic',
      'account.basic',
      null,
      RoleKind.SYSTEM_TEMPLATE,
      true
    )

    roleRepository.findByScopeKindAndCode
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(accountBasicTemplate)
    roleRepository.save.mockImplementation(async (role) => role)

    const handler = new GrantInitialAccessForEmployeeAccountHandler(
      roleRepository as unknown as RoleRepository,
      requestRepository as unknown as OnboardingGrantRequestRepository,
      identityAccountReferencePort,
      createNavigationRepository()
    )

    const error = await handler
      .execute(
        new GrantInitialAccessForEmployeeAccountCommand({
          tenantId: 'tenant-1',
          accountId: 'account-1',
          roleIds: [],
          idempotencyKey: 'grant-key-1',
          operatorScope: buildTenantBoundQueryScope(
            {
              operatorId: 'operator-1',
              tenantId: 'tenant-2',
              isSystemScope: false
            },
            'tenant-2'
          )
        })
      )
      .then(
        () => null,
        (reason) => reason
      )

    expect(error).toBeInstanceOf(OESExceptionBase)
    expect((error as OESExceptionBase).toRpcPayload()).toMatchObject({
      code: 'AUTHORIZATION_DENIED'
    })
    expect(roleRepository.findByScopeKindAndCode).not.toHaveBeenCalled()
    expect(roleRepository.save).not.toHaveBeenCalled()
    expect(roleRepository.assignAccountRole).not.toHaveBeenCalled()
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
      identityAccountReferencePort,
      createNavigationRepository()
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
      identityAccountReferencePort,
      createNavigationRepository()
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
      identityAccountReferencePort,
      createNavigationRepository()
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
