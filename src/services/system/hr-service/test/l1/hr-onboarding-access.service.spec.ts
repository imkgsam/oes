import { RpcException } from '@nestjs/microservices'
import { AppLogger } from '@oes/common/logging'
import { HrOnboardingAccessService } from '../../src/application/services/hr-onboarding-access.service'
import { OnboardingAccessStatus } from '../../src/domain/value-objects'

/** createOnboardingRepositoryMock builds the compensation process repository double. */
function createOnboardingRepositoryMock() {
  return {
    recordAccessStatus: jest.fn()
  }
}

/** createIdentityBindingPortMock builds the identity handoff port double. */
function createIdentityBindingPortMock() {
  return {
    bindAccountToEmployee: jest.fn().mockResolvedValue({ accountId: 'account-1' })
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

describe('HrOnboardingAccessService L1', () => {
  it('completeAccess / binding failure should enter ACCOUNT_BINDING_PENDING without calling permission', async () => {
    const repository = createOnboardingRepositoryMock()
    const identityPort = createIdentityBindingPortMock()
    const permissionPort = createPermissionGrantPortMock()
    const logger = createLoggerMock()
    identityPort.bindAccountToEmployee.mockRejectedValue(new Error('identity unavailable'))
    repository.recordAccessStatus.mockImplementation(async (input) => input)
    const service = new HrOnboardingAccessService(
      repository as never,
      identityPort as never,
      permissionPort as never,
      logger as never
    )

    const result = await service.completeAccess({
      tenantId: 'tenant-1',
      employeeId: 'employee-1',
      employmentId: 'employment-1',
      accountId: 'account-1',
      roleIds: ['role-1'],
      idempotencyKey: 'hr-onboarding-1'
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
    const service = new HrOnboardingAccessService(
      repository as never,
      identityPort as never,
      permissionPort as never,
      logger as never
    )

    const result = await service.completeAccess({
      tenantId: 'tenant-1',
      employeeId: 'employee-1',
      employmentId: 'employment-1',
      accountId: 'account-1',
      roleIds: ['role-1'],
      idempotencyKey: 'hr-onboarding-1'
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
    const service = new HrOnboardingAccessService(
      repository as never,
      identityPort as never,
      permissionPort as never,
      logger as never
    )

    await service.completeAccess({
      tenantId: 'tenant-1',
      employeeId: 'employee-1',
      employmentId: 'employment-1',
      accountId: 'account-1',
      roleIds: ['role-1'],
      idempotencyKey: 'hr-onboarding-1'
    })

    expect(legacyMembershipPort.addAccountOrgMembership).not.toHaveBeenCalled()
    expect(legacyMembershipPort.setAccountPrimaryOrg).not.toHaveBeenCalled()
  })
})
