import { RpcException } from '@nestjs/microservices'
import { AppLogger } from '@oes/common/logging'
import { HrOnboardingAccessService } from '../../src/application/services/hr-onboarding-access.service'
import { OnboardingAccessStatus } from '../../src/domain/value-objects'

/** createOnboardingRepositoryMock builds the compensation process repository double. */
function createOnboardingRepositoryMock() {
  return {
    findLatestByEmployeeId: jest.fn().mockResolvedValue(null),
    recordAccessStatus: jest.fn()
  }
}

/** createEmployeeRepositoryMock builds the HR employee ownership guard double. */
function createEmployeeRepositoryMock() {
  return {
    findById: jest.fn().mockResolvedValue({
      id: 'employee-1',
      tenantId: 'tenant-1'
    })
  }
}

/** createEmploymentRepositoryMock builds the HR employment ownership guard double. */
function createEmploymentRepositoryMock() {
  return {
    findById: jest.fn().mockResolvedValue({
      id: 'employment-1',
      tenantId: 'tenant-1',
      employeeId: 'employee-1'
    })
  }
}

/** createIdentityBindingPortMock builds the identity handoff port double. */
function createIdentityBindingPortMock() {
  return {
    bindAccountToEmployee: jest.fn().mockResolvedValue({ accountId: 'account-1' })
  }
}

/** createIdentityAccountProvisioningPortMock builds the identity account provisioning double. */
function createIdentityAccountProvisioningPortMock() {
  return {
    createUserAccount: jest.fn().mockResolvedValue({
      accountId: 'account-from-existing-user',
      userId: 'user-existing-1',
      displayName: 'Existing User'
    })
  }
}

/** createAuthLoginBootstrapPortMock builds the auth login bootstrap double. */
function createAuthLoginBootstrapPortMock() {
  return {
    bootstrapUserLoginMethods: jest.fn().mockResolvedValue(undefined)
  }
}

/** createPermissionGrantPortMock builds the permission handoff port double. */
function createPermissionGrantPortMock() {
  return {
    grantInitialAccessForEmployeeAccount: jest.fn().mockResolvedValue({ grantId: 'grant-1' })
  }
}

/** createLoggerMock builds the onboarding access structured logger double. */
function createLoggerMock() {
  return {
    warn: jest.fn()
  } as unknown as jest.Mocked<AppLogger>
}

/** createService wires HrOnboardingAccessService with current constructor dependencies. */
function createService(overrides: {
  authLoginBootstrapPort?: ReturnType<typeof createAuthLoginBootstrapPortMock>
  employeeRepository?: ReturnType<typeof createEmployeeRepositoryMock>
  employmentRepository?: ReturnType<typeof createEmploymentRepositoryMock>
  identityAccountProvisioningPort?: ReturnType<typeof createIdentityAccountProvisioningPortMock>
  identityBindingPort?: ReturnType<typeof createIdentityBindingPortMock>
  logger?: jest.Mocked<AppLogger>
  onboardingRepository?: ReturnType<typeof createOnboardingRepositoryMock>
  permissionPort?: ReturnType<typeof createPermissionGrantPortMock>
} = {}) {
  const employeeRepository = overrides.employeeRepository ?? createEmployeeRepositoryMock()
  const employmentRepository = overrides.employmentRepository ?? createEmploymentRepositoryMock()
  const onboardingRepository = overrides.onboardingRepository ?? createOnboardingRepositoryMock()
  const identityAccountProvisioningPort =
    overrides.identityAccountProvisioningPort ?? createIdentityAccountProvisioningPortMock()
  const authLoginBootstrapPort = overrides.authLoginBootstrapPort ?? createAuthLoginBootstrapPortMock()
  const identityBindingPort = overrides.identityBindingPort ?? createIdentityBindingPortMock()
  const permissionPort = overrides.permissionPort ?? createPermissionGrantPortMock()
  const logger = overrides.logger ?? createLoggerMock()
  return {
    authLoginBootstrapPort,
    employeeRepository,
    employmentRepository,
    identityAccountProvisioningPort,
    identityBindingPort,
    logger,
    onboardingRepository,
    permissionPort,
    service: new HrOnboardingAccessService(
      employeeRepository as never,
      employmentRepository as never,
      onboardingRepository as never,
      identityAccountProvisioningPort as never,
      authLoginBootstrapPort as never,
      identityBindingPort as never,
      permissionPort as never,
      logger as never
    )
  }
}

describe('HrOnboardingAccessService L1', () => {
  it('completeAccess / binding failure should enter ACCOUNT_BINDING_PENDING without calling permission', async () => {
    const repository = createOnboardingRepositoryMock()
    const identityPort = createIdentityBindingPortMock()
    const permissionPort = createPermissionGrantPortMock()
    const logger = createLoggerMock()
    identityPort.bindAccountToEmployee.mockRejectedValue(new Error('identity unavailable'))
    repository.recordAccessStatus.mockImplementation(async (input) => input)
    const { service } = createService({
      identityBindingPort: identityPort,
      logger,
      onboardingRepository: repository,
      permissionPort
    })

    const result = await service.completeAccess({
      tenantId: 'tenant-1',
      employeeId: 'employee-1',
      employmentId: 'employment-1',
      existingAccountId: 'account-1',
      roleIds: ['role-1'],
      reason: 'hr-onboarding-1'
    })

    expect(result.status).toBe(OnboardingAccessStatus.ACCOUNT_BINDING_PENDING)
    expect(permissionPort.grantInitialAccessForEmployeeAccount).not.toHaveBeenCalled()
    expect(repository.recordAccessStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        status: OnboardingAccessStatus.ACCOUNT_BINDING_PENDING,
        employeeId: 'employee-1',
        accountId: 'account-1',
        failureReason: 'identity unavailable'
      })
    )
    expect(logger.warn).toHaveBeenCalledWith(
      'Employee onboarding access handoff failed',
      expect.objectContaining({
        stage: 'ACCOUNT_BINDING',
        failureCategory: 'INFRASTRUCTURE',
        errorMessage: 'identity unavailable'
      })
    )
  })

  it('completeAccess / grant failure should preserve binding and enter ACCESS_GRANT_PENDING', async () => {
    const repository = createOnboardingRepositoryMock()
    const identityPort = createIdentityBindingPortMock()
    const permissionPort = createPermissionGrantPortMock()
    const logger = createLoggerMock()
    permissionPort.grantInitialAccessForEmployeeAccount.mockRejectedValue(
      new RpcException({
        grpcStatus: 9,
        code: 'ROLE_NOT_ASSIGNABLE',
        message: 'Role is not assignable in the current tenant context',
        meta: {
          traceId: 'trace-1'
        }
      })
    )
    repository.recordAccessStatus.mockImplementation(async (input) => input)
    const { service } = createService({
      identityBindingPort: identityPort,
      logger,
      onboardingRepository: repository,
      permissionPort
    })

    const result = await service.completeAccess({
      tenantId: 'tenant-1',
      employeeId: 'employee-1',
      employmentId: 'employment-1',
      existingAccountId: 'account-1',
      roleIds: ['role-1'],
      reason: 'hr-onboarding-1'
    })

    expect(identityPort.bindAccountToEmployee).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      employeeId: 'employee-1',
      accountId: 'account-1'
    })
    expect(result.status).toBe(OnboardingAccessStatus.ACCESS_GRANT_PENDING)
    expect(repository.recordAccessStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        status: OnboardingAccessStatus.ACCESS_GRANT_PENDING,
        employeeId: 'employee-1',
        accountId: 'account-1',
        failureReason: 'ROLE_NOT_ASSIGNABLE: Role is not assignable in the current tenant context'
      })
    )
    expect(logger.warn).toHaveBeenCalledWith(
      'Employee onboarding access handoff failed',
      expect.objectContaining({
        stage: 'ACCESS_GRANT',
        failureCategory: 'BUSINESS',
        errorCode: 'ROLE_NOT_ASSIGNABLE',
        traceId: 'trace-1'
      })
    )
  })

  it('completeAccess / guardrail should never call legacy account-org membership ports', async () => {
    const repository = createOnboardingRepositoryMock()
    const identityPort = createIdentityBindingPortMock()
    const permissionPort = createPermissionGrantPortMock()
    const logger = createLoggerMock()
    repository.recordAccessStatus.mockImplementation(async (input) => input)
    const legacyMembershipPort = {
      addAccountOrgMembership: jest.fn(),
      setAccountPrimaryOrg: jest.fn()
    }
    const { service } = createService({
      identityBindingPort: identityPort,
      logger,
      onboardingRepository: repository,
      permissionPort
    })

    await service.completeAccess({
      tenantId: 'tenant-1',
      employeeId: 'employee-1',
      employmentId: 'employment-1',
      existingAccountId: 'account-1',
      roleIds: ['role-1'],
      reason: 'hr-onboarding-1'
    })

    expect(legacyMembershipPort.addAccountOrgMembership).not.toHaveBeenCalled()
    expect(legacyMembershipPort.setAccountPrimaryOrg).not.toHaveBeenCalled()
  })

  it('completeAccess / existing user should create a tenant account without bootstrapping login methods', async () => {
    const repository = createOnboardingRepositoryMock()
    repository.recordAccessStatus.mockImplementation(async (input) => input)
    const identityAccountProvisioningPort = createIdentityAccountProvisioningPortMock()
    const authLoginBootstrapPort = createAuthLoginBootstrapPortMock()
    const { identityBindingPort, permissionPort, service } = createService({
      authLoginBootstrapPort,
      identityAccountProvisioningPort,
      onboardingRepository: repository
    })

    const result = await service.completeAccess({
      tenantId: 'tenant-1',
      employeeId: 'employee-1',
      employmentId: 'employment-1',
      createAccount: {
        displayName: 'Existing User',
        existingUserId: 'user-existing-1'
      } as never,
      roleIds: []
    })

    expect(result.status).toBe(OnboardingAccessStatus.COMPLETED)
    expect(identityAccountProvisioningPort.createUserAccount).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        displayName: 'Existing User',
        existingUserId: 'user-existing-1'
      })
    )
    expect(authLoginBootstrapPort.bootstrapUserLoginMethods).not.toHaveBeenCalled()
    expect(identityBindingPort.bindAccountToEmployee).toHaveBeenCalledWith(
      expect.objectContaining({
        accountId: 'account-from-existing-user',
        employeeId: 'employee-1',
        tenantId: 'tenant-1'
      })
    )
    expect(permissionPort.grantInitialAccessForEmployeeAccount).toHaveBeenCalledWith(
      expect.objectContaining({
        accountId: 'account-from-existing-user',
        roleIds: []
      })
    )
  })
})
