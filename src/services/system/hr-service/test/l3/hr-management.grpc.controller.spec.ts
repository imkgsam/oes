import { BadRequestException } from '@nestjs/common'
import { Metadata } from '@grpc/grpc-js'
import { attachOperatorContext } from '@oes/common/authorization'
import { HrManagementService } from '../../src/application/services'
import { HrManagementGrpcController } from '../../src/interfaces/grpc/hr-management.grpc.controller'

/** createHrManagementServiceMock builds the application service double for management gRPC tests. */
function createHrManagementServiceMock() {
  return {
    createEmployee: jest.fn(),
    createEmployment: jest.fn(),
    endEmployment: jest.fn(),
    changePrimaryEmployment: jest.fn(),
    completeEmployeeAccess: jest.fn(),
    updateEmployeeOfficialPhoto: jest.fn(),
    removeEmployeeOfficialPhoto: jest.fn()
  }
}

/** createHrOnboardingAccessServiceMock builds the onboarding application service double for gRPC mapping tests. */
function createHrOnboardingAccessServiceMock() {
  return {
    completeAccess: jest.fn()
  }
}

/** createHrEmployeeOnboardingServiceMock builds the full employee onboarding service double for gRPC mapping tests. */
function createHrEmployeeOnboardingServiceMock() {
  return {
    startEmployeeOnboarding: jest.fn()
  }
}

/** createOperatorMetadata builds the minimum write metadata required by HR management controllers. */
function createOperatorMetadata() {
  const metadata = new Metadata()
  metadata.set('x-operator-context', 'signed-operator-context')
  metadata.set('x-request-id', 'request-1')
  metadata.set('x-trace-id', 'trace-1')
  return metadata
}

/** attachTestOperatorContext simulates the authenticated operator guard in direct controller tests. */
function attachTestOperatorContext(request: object) {
  attachOperatorContext(request, {
    operator_id: 'operator-1',
    operator_type: 'HUMAN',
    tenant_id: 'tenant-1',
    org_id: 'org-root-1',
    operator_roles: ['hr.admin'],
    issued_at: '2026-05-04T00:00:00.000Z',
    expires_at: '2026-05-04T00:05:00.000Z',
    issuer: 'api-gateway',
    signature: 'test-signature'
  })
  return request
}

describe('HrManagementGrpcController L3', () => {
  it('CreateEmployee / should map application PREBOARDING status to proto enum', async () => {
    const service = createHrManagementServiceMock()
    const onboardingService = createHrOnboardingAccessServiceMock()
    const employeeOnboardingService = createHrEmployeeOnboardingServiceMock()
    service.createEmployee.mockResolvedValue({
      id: 'employee-1',
      tenantId: 'tenant-1',
      tenantPartyId: 'tenant-party-1',
      employeeCode: 'EMP-0AF-0001',
      lifecycleStatus: 'PREBOARDING'
    })
    const controller = new HrManagementGrpcController(
      service as unknown as HrManagementService,
      employeeOnboardingService as any,
      onboardingService as any
    )

    const result = await controller.createEmployee(
      {
        tenantId: 'tenant-1',
        tenantPartyId: 'tenant-party-1',
        employeeCode: 'EMP-0AF-0001'
      },
      createOperatorMetadata()
    )

    expect(service.createEmployee).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      tenantPartyId: 'tenant-party-1',
      employeeCode: 'EMP-0AF-0001'
    })
    expect(result.employee?.id).toBe('employee-1')
    expect(result.employee?.lifecycleStatus).toBe(1)
  })

  it('CreateEmployment / should surface invalid org references from the application layer', async () => {
    const service = createHrManagementServiceMock()
    const onboardingService = createHrOnboardingAccessServiceMock()
    const employeeOnboardingService = createHrEmployeeOnboardingServiceMock()
    service.createEmployment.mockRejectedValue(new BadRequestException('Invalid org reference'))
    const controller = new HrManagementGrpcController(
      service as unknown as HrManagementService,
      employeeOnboardingService as any,
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

  it('Employment commands / should map positionName as employment-owned truth', async () => {
    const service = createHrManagementServiceMock()
    const onboardingService = createHrOnboardingAccessServiceMock()
    const employeeOnboardingService = createHrEmployeeOnboardingServiceMock()
    service.createEmployment.mockResolvedValue({
      employee: {
        id: 'employee-1',
        tenantId: 'tenant-1',
        tenantPartyId: 'tenant-party-1',
        lifecycleStatus: 'ACTIVE'
      },
      employment: {
        id: 'employment-1',
        tenantId: 'tenant-1',
        employeeId: 'employee-1',
        orgUnitId: 'org-1',
        positionName: '生产主管',
        status: 'ACTIVE',
        effectiveFrom: new Date('2026-04-25T00:00:00.000Z')
      }
    })
    service.changePrimaryEmployment.mockResolvedValue({
      employee: {
        id: 'employee-1',
        tenantId: 'tenant-1',
        tenantPartyId: 'tenant-party-1',
        lifecycleStatus: 'ACTIVE'
      },
      endedEmployment: {
        id: 'employment-1',
        tenantId: 'tenant-1',
        employeeId: 'employee-1',
        orgUnitId: 'org-1',
        positionName: '生产主管',
        status: 'ENDED',
        effectiveFrom: new Date('2026-04-25T00:00:00.000Z')
      },
      newEmployment: {
        id: 'employment-2',
        tenantId: 'tenant-1',
        employeeId: 'employee-1',
        orgUnitId: 'org-2',
        positionName: '生产经理',
        status: 'ACTIVE',
        effectiveFrom: new Date('2026-04-26T00:00:00.000Z')
      }
    })
    const controller = new HrManagementGrpcController(
      service as unknown as HrManagementService,
      employeeOnboardingService as any,
      onboardingService as any
    )

    await controller.createEmployment(
      {
        tenantId: 'tenant-1',
        employeeId: 'employee-1',
        orgUnitId: 'org-1',
        effectiveFrom: '2026-04-25T00:00:00.000Z',
        positionName: '生产主管'
      },
      createOperatorMetadata()
    )
    await controller.changePrimaryEmployment(
      {
        tenantId: 'tenant-1',
        employeeId: 'employee-1',
        fromEmploymentId: 'employment-1',
        toOrgUnitId: 'org-2',
        effectiveFrom: '2026-04-26T00:00:00.000Z',
        endedReason: 'transfer',
        positionName: '生产经理'
      },
      createOperatorMetadata()
    )

    expect(service.createEmployment).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      employeeId: 'employee-1',
      orgUnitId: 'org-1',
      positionName: '生产主管',
      effectiveFrom: new Date('2026-04-25T00:00:00.000Z')
    })
    expect(service.changePrimaryEmployment).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      employeeId: 'employee-1',
      fromEmploymentId: 'employment-1',
      toOrgUnitId: 'org-2',
      positionName: '生产经理',
      effectiveFrom: new Date('2026-04-26T00:00:00.000Z'),
      endedReason: 'transfer'
    })
  })

  it('CreateEmployeeOnboarding / should map employee onboarding to HR-owned saga input', async () => {
    const service = createHrManagementServiceMock()
    const onboardingService = createHrOnboardingAccessServiceMock()
    const employeeOnboardingService = createHrEmployeeOnboardingServiceMock()
    employeeOnboardingService.startEmployeeOnboarding.mockResolvedValue({
      employee: {
        id: 'employee-1',
        tenantId: 'tenant-1',
        tenantPartyId: 'tenant-party-1',
        employeeCode: 'EMP-0AF-0001',
        lifecycleStatus: 'ACTIVE'
      },
      employment: {
        id: 'employment-1',
        tenantId: 'tenant-1',
        employeeId: 'employee-1',
        orgUnitId: 'org-root-1',
        status: 'ACTIVE',
        effectiveFrom: new Date('2026-05-04T00:00:00.000Z'),
        effectiveTo: null,
        endedReason: null
      },
      access: {
        id: 'process-1',
        tenantId: 'tenant-1',
        employeeId: 'employee-1',
        employmentId: 'employment-1',
        accountId: 'account-1',
        status: 'COMPLETED',
        grantIdempotencyKey: 'grant-key-1',
        failureReason: null
      }
    })
    const controller = new HrManagementGrpcController(
      service as unknown as HrManagementService,
      employeeOnboardingService as any,
      onboardingService as any
    )

    const result = await controller.createEmployeeOnboarding(
      attachTestOperatorContext({
        tenantId: 'tenant-1',
        idempotencyKey: 'employee-onboarding-1',
        person: {
          legalName: '林予安',
          identifiers: [
            {
              identifierType: 'NATIONAL_ID',
              normalizedValue: '110101199001011234',
              rawValue: '110101199001011234',
              issuerCountryOrRegion: 'CN'
            }
          ]
        },
        primaryEmployment: {
          orgUnitId: 'org-root-1',
          effectiveFrom: '2026-05-04T00:00:00.000Z',
          positionName: '租户管理员'
        },
        createAccount: {
          displayName: '林予安',
          email: 'lin@example.com',
          phone: ''
        },
        employeeCode: ''
      }),
      createOperatorMetadata()
    )

    expect(employeeOnboardingService.startEmployeeOnboarding).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        idempotencyKey: 'employee-onboarding-1',
        person: {
          legalName: '林予安',
          identifiers: [
            {
              identifierType: 'NATIONAL_ID',
              normalizedValue: '110101199001011234',
              rawValue: '110101199001011234',
              issuerCountryOrRegion: 'CN'
            }
          ]
        },
        account: {
          displayName: '林予安',
          email: 'lin@example.com',
          phone: undefined
        },
        operatorContext: {
          operatorId: 'operator-1',
          operatorType: 'HUMAN',
          tenantId: 'tenant-1',
          orgId: 'org-root-1',
          operatorRoles: ['hr.admin']
        },
        requestId: 'request-1',
        traceId: 'trace-1'
      })
    )
    expect(result.employee?.id).toBe('employee-1')
    expect(result.employment?.id).toBe('employment-1')
    expect(result.access?.status).toBe(3)
  })

  it('CreateEmployee / should reject missing operator context metadata for management writes', async () => {
    const service = createHrManagementServiceMock()
    const onboardingService = createHrOnboardingAccessServiceMock()
    const employeeOnboardingService = createHrEmployeeOnboardingServiceMock()
    const controller = new HrManagementGrpcController(
      service as unknown as HrManagementService,
      employeeOnboardingService as any,
      onboardingService as any
    )

    await expect(
      controller.createEmployee({
        tenantId: 'tenant-1',
        tenantPartyId: 'tenant-party-1',
        employeeCode: 'EMP-0AF-0001'
      })
    ).rejects.toBeInstanceOf(BadRequestException)
    expect(service.createEmployee).not.toHaveBeenCalled()
  })

  it('UpdateEmployeeOfficialPhoto / should require operator metadata and map the official photo binding', async () => {
    const service = createHrManagementServiceMock()
    const onboardingService = createHrOnboardingAccessServiceMock()
    const employeeOnboardingService = createHrEmployeeOnboardingServiceMock()
    service.updateEmployeeOfficialPhoto.mockResolvedValue({
      id: 'employee-1',
      tenantId: 'tenant-1',
      tenantPartyId: 'tenant-party-1',
      employeeCode: 'EMP-0AF-0001',
      lifecycleStatus: 'ACTIVE',
      officialPhotoAssetId: 'asset-1',
      officialPhotoUrl: 'https://assets.example.com/photo.webp'
    })
    const controller = new HrManagementGrpcController(
      service as unknown as HrManagementService,
      employeeOnboardingService as any,
      onboardingService as any
    )

    const result = await (controller as any).updateEmployeeOfficialPhoto(
      {
        tenantId: 'tenant-1',
        employeeId: 'employee-1',
        officialPhotoAssetId: 'asset-1',
        officialPhotoUrl: 'https://assets.example.com/photo.webp'
      },
      createOperatorMetadata()
    )

    expect(service.updateEmployeeOfficialPhoto).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      employeeId: 'employee-1',
      officialPhotoAssetId: 'asset-1',
      officialPhotoUrl: 'https://assets.example.com/photo.webp'
    })
    expect(result.employee?.officialPhotoAssetId).toBe('asset-1')
    expect(result.employee?.officialPhotoUrl).toBe('https://assets.example.com/photo.webp')
  })

  it('RemoveEmployeeOfficialPhoto / should require operator metadata and map empty official photo fields', async () => {
    const service = createHrManagementServiceMock()
    const onboardingService = createHrOnboardingAccessServiceMock()
    const employeeOnboardingService = createHrEmployeeOnboardingServiceMock()
    service.removeEmployeeOfficialPhoto.mockResolvedValue({
      id: 'employee-1',
      tenantId: 'tenant-1',
      tenantPartyId: 'tenant-party-1',
      employeeCode: 'EMP-0AF-0001',
      lifecycleStatus: 'ACTIVE',
      officialPhotoAssetId: null,
      officialPhotoUrl: null
    })
    const controller = new HrManagementGrpcController(
      service as unknown as HrManagementService,
      employeeOnboardingService as any,
      onboardingService as any
    )

    const result = await (controller as any).removeEmployeeOfficialPhoto(
      {
        tenantId: 'tenant-1',
        employeeId: 'employee-1'
      },
      createOperatorMetadata()
    )

    expect(service.removeEmployeeOfficialPhoto).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      employeeId: 'employee-1'
    })
    expect(result.employee?.officialPhotoAssetId).toBe('')
    expect(result.employee?.officialPhotoUrl).toBe('')
  })

  it('UpdateEmployeeOfficialPhoto / should reject missing operator metadata before application writes', async () => {
    const service = createHrManagementServiceMock()
    const onboardingService = createHrOnboardingAccessServiceMock()
    const employeeOnboardingService = createHrEmployeeOnboardingServiceMock()
    const controller = new HrManagementGrpcController(
      service as unknown as HrManagementService,
      employeeOnboardingService as any,
      onboardingService as any
    )

    await expect(
      (controller as any).updateEmployeeOfficialPhoto({
        tenantId: 'tenant-1',
        employeeId: 'employee-1',
        officialPhotoAssetId: 'asset-1',
        officialPhotoUrl: 'https://assets.example.com/photo.webp'
      })
    ).rejects.toBeInstanceOf(BadRequestException)
    expect(service.updateEmployeeOfficialPhoto).not.toHaveBeenCalled()
  })

  it('CompleteEmployeeAccess / should accept either a new account payload or an existing account id and map pending status', async () => {
    const service = createHrManagementServiceMock()
    const onboardingService = createHrOnboardingAccessServiceMock()
    const employeeOnboardingService = createHrEmployeeOnboardingServiceMock()
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
      employeeOnboardingService as any,
      onboardingService as any
    )

    const result = await controller.completeEmployeeAccess(
      attachTestOperatorContext({
        tenantId: 'tenant-1',
        employeeId: 'employee-1',
        employmentId: 'employment-1',
        existingAccountId: '',
        roleIds: ['role-1'],
        reason: 'member_access_enable',
        createAccount: {
          displayName: 'EMP-0AF-0001',
          email: 'member@example.com',
          phone: ''
        }
      }),
      createOperatorMetadata()
    )

    expect(onboardingService.completeAccess).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        employeeId: 'employee-1',
        employmentId: 'employment-1',
        existingAccountId: undefined,
        roleIds: ['role-1'],
        reason: 'member_access_enable',
        createAccount: {
          displayName: 'EMP-0AF-0001',
          email: 'member@example.com',
          existingUserId: undefined,
          phone: undefined
        },
        operatorContext: {
          operatorId: 'operator-1',
          operatorType: 'HUMAN',
          tenantId: 'tenant-1',
          orgId: 'org-root-1',
          operatorRoles: ['hr.admin']
        },
        requestId: 'request-1',
        traceId: 'trace-1'
      })
    )
    expect(result.process?.status).toBe(1)
    expect(result.process?.failureReason).toBe('identity unavailable')
  })
})
