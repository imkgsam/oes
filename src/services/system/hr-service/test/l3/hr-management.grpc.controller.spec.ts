import { BadRequestException } from '@nestjs/common'
import { Metadata } from '@grpc/grpc-js'
import { HrManagementService } from '../../src/application/services'
import { HrManagementGrpcController } from '../../src/interfaces/grpc/hr-management.grpc.controller'

/** createHrManagementServiceMock builds the application service double for management gRPC tests. */
function createHrManagementServiceMock() {
  return {
    createEmployee: jest.fn(),
    createEmployment: jest.fn(),
    endEmployment: jest.fn(),
    changePrimaryEmployment: jest.fn(),
    completeEmployeeAccess: jest.fn()
  }
}

/** createHrOnboardingAccessServiceMock builds the onboarding application service double for gRPC mapping tests. */
function createHrOnboardingAccessServiceMock() {
  return {
    completeAccess: jest.fn()
  }
}

/** createOperatorMetadata builds the minimum write metadata required by HR management controllers. */
function createOperatorMetadata() {
  const metadata = new Metadata()
  metadata.set('operator-id', 'operator-1')
  metadata.set('trace-id', 'trace-1')
  return metadata
}

describe('HrManagementGrpcController L3', () => {
  it('CreateEmployee / should map application PREBOARDING status to proto enum', async () => {
    const service = createHrManagementServiceMock()
    const onboardingService = createHrOnboardingAccessServiceMock()
    service.createEmployee.mockResolvedValue({
      id: 'employee-1',
      tenantId: 'tenant-1',
      tenantPartyId: 'tenant-party-1',
      partyId: 'party-1',
      employeeCode: 'E001',
      lifecycleStatus: 'PREBOARDING'
    })
    const controller = new HrManagementGrpcController(
      service as unknown as HrManagementService,
      onboardingService as any
    )

    const result = await controller.createEmployee(
      {
        tenantId: 'tenant-1',
        tenantPartyId: 'tenant-party-1',
        partyId: 'party-1',
        employeeCode: 'E001'
      },
      createOperatorMetadata()
    )

    expect(service.createEmployee).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      tenantPartyId: 'tenant-party-1',
      partyId: 'party-1',
      employeeCode: 'E001'
    })
    expect(result.employee?.id).toBe('employee-1')
    expect(result.employee?.lifecycleStatus).toBe(1)
  })

  it('CreateEmployment / should surface invalid org references from the application layer', async () => {
    const service = createHrManagementServiceMock()
    const onboardingService = createHrOnboardingAccessServiceMock()
    service.createEmployment.mockRejectedValue(new BadRequestException('Invalid org reference'))
    const controller = new HrManagementGrpcController(
      service as unknown as HrManagementService,
      onboardingService as any
    )

    await expect(
      controller.createEmployment(
        {
          tenantId: 'tenant-1',
          employeeId: 'employee-1',
          orgUnitId: 'missing-org',
          effectiveFrom: new Date().toISOString()
        },
        createOperatorMetadata()
      )
    ).rejects.toBeInstanceOf(BadRequestException)
  })

  it('CreateEmployee / should reject missing operator context metadata for management writes', async () => {
    const service = createHrManagementServiceMock()
    const onboardingService = createHrOnboardingAccessServiceMock()
    const controller = new HrManagementGrpcController(
      service as unknown as HrManagementService,
      onboardingService as any
    )

    await expect(
      controller.createEmployee({
        tenantId: 'tenant-1',
        tenantPartyId: 'tenant-party-1',
        employeeCode: 'E001'
      })
    ).rejects.toBeInstanceOf(BadRequestException)
    expect(service.createEmployee).not.toHaveBeenCalled()
  })

  it('CompleteEmployeeAccess / should accept either a new account payload or an existing account id and map pending status', async () => {
    const service = createHrManagementServiceMock()
    const onboardingService = createHrOnboardingAccessServiceMock()
    onboardingService.completeAccess.mockResolvedValue({
      id: 'process-1',
      tenantId: 'tenant-1',
      employeeId: 'employee-1',
      employmentId: 'employment-1',
      accountId: 'account-1',
      status: 'ACCOUNT_BINDING_PENDING',
      grantIdempotencyKey: 'grant-key-1',
      failureReason: 'identity unavailable'
    })
    const controller = new HrManagementGrpcController(
      service as unknown as HrManagementService,
      onboardingService as any
    )

    const result = await controller.completeEmployeeAccess(
      {
        tenantId: 'tenant-1',
        employeeId: 'employee-1',
        employmentId: 'employment-1',
        existingAccountId: '',
        roleIds: ['role-1'],
        reason: 'member_access_enable',
        createAccount: {
          displayName: 'EMP-001',
          email: 'member@example.com',
          phone: ''
        }
      },
      createOperatorMetadata()
    )

    expect(onboardingService.completeAccess).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      employeeId: 'employee-1',
      employmentId: 'employment-1',
      existingAccountId: undefined,
      roleIds: ['role-1'],
      reason: 'member_access_enable',
      createAccount: {
        displayName: 'EMP-001',
        email: 'member@example.com',
        phone: undefined
      }
    })
    expect(result.process?.status).toBe(1)
    expect(result.process?.failureReason).toBe('identity unavailable')
  })
})
