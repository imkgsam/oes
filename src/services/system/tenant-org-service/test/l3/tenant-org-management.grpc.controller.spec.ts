import { BadRequestException } from '@nestjs/common'
import { TenantOrgManagementService } from '../../src/application/services'
import { TenantOrgManagementGrpcController } from '../../src/interfaces/grpc/tenant-org-management.grpc.controller'

/** createTenantOrgManagementServiceMock builds the application service double for management controller mapping tests. */
function createTenantOrgManagementServiceMock() {
  return {
    createTenant: jest.fn(),
    updateTenantProfile: jest.fn(),
    suspendTenant: jest.fn(),
    reactivateTenant: jest.fn(),
    archiveTenant: jest.fn(),
    createOrgUnit: jest.fn(),
    updateOrgUnit: jest.fn(),
    moveOrgUnit: jest.fn(),
    archiveOrgUnit: jest.fn()
  }
}

/** createTenantOnboardingServiceMock builds the tenant onboarding service double for gRPC mapping tests. */
function createTenantOnboardingServiceMock() {
  return {
    start: jest.fn(),
    get: jest.fn(),
    retry: jest.fn()
  }
}

describe('TenantOrgManagementGrpcController L3', () => {
  it('createTenant / should map root org result to proto response', async () => {
    const service = createTenantOrgManagementServiceMock()
    const onboardingService = createTenantOnboardingServiceMock()
    const controller = new TenantOrgManagementGrpcController(
      service as unknown as TenantOrgManagementService,
      onboardingService as any
    )
    service.createTenant.mockResolvedValue({
      tenant: {
        id: 'tenant-1',
        code: 'acme',
        name: 'Acme',
        status: 'ACTIVE',
        rootOrgId: 'root-1'
      },
      rootOrgUnit: {
        id: 'root-1',
        tenantId: 'tenant-1',
        parentOrgId: null,
        name: 'Acme',
        type: 'ROOT',
        status: 'ACTIVE',
        path: '/root-1',
        depth: 0,
        sortOrder: 0,
        organizationPartyId: null
      }
    })

    const result = await controller.createTenant({ code: 'acme', name: 'Acme' } as any)

    expect(service.createTenant).toHaveBeenCalledWith({
      code: 'acme',
      name: 'Acme',
      rootOrgName: ''
    })
    expect(result.rootOrgUnit?.id).toBe('root-1')
  })

  it('moveOrgUnit / should surface invalid move errors from the application layer', async () => {
    const service = createTenantOrgManagementServiceMock()
    const onboardingService = createTenantOnboardingServiceMock()
    const controller = new TenantOrgManagementGrpcController(
      service as unknown as TenantOrgManagementService,
      onboardingService as any
    )
    service.moveOrgUnit.mockRejectedValue(
      new BadRequestException('Cannot move org unit below its descendant')
    )

    await expect(
      controller.moveOrgUnit({
        tenantId: 'tenant-1',
        orgUnitId: 'root-1',
        newParentOrgId: 'child-1'
      } as any)
    ).rejects.toBeInstanceOf(BadRequestException)
  })

  it('updateOrgUnit / when organizationPartyId is sent as empty string / should forward explicit clear semantics', async () => {
    const service = createTenantOrgManagementServiceMock()
    const onboardingService = createTenantOnboardingServiceMock()
    const controller = new TenantOrgManagementGrpcController(
      service as unknown as TenantOrgManagementService,
      onboardingService as any
    )
    service.updateOrgUnit.mockResolvedValue({
      id: 'org-1',
      tenantId: 'tenant-1',
      parentOrgId: 'root-1',
      name: 'Acme Branch',
      type: 'BRANCH',
      status: 'ACTIVE',
      path: '/root-1/org-1',
      depth: 1,
      sortOrder: 10,
      organizationPartyId: null
    })

    await controller.updateOrgUnit({
      tenantId: 'tenant-1',
      orgUnitId: 'org-1',
      organizationPartyId: ''
    } as any)

    expect(service.updateOrgUnit).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      orgUnitId: 'org-1',
      name: undefined,
      type: undefined,
      sortOrder: undefined,
      organizationPartyId: null
    })
  })

  it('startTenantOnboarding / should include first-admin employee and account.basic refs in the result contract', async () => {
    const service = createTenantOrgManagementServiceMock()
    const onboardingService = createTenantOnboardingServiceMock()
    onboardingService.start.mockResolvedValue({
      onboardingId: 'onboarding-1',
      status: 'SUCCEEDED',
      firstAdminEmployee: {
        employeeId: 'employee-first-admin',
        employmentId: 'employment-first-admin',
        accessProcessId: 'access-first-admin'
      },
      access: {
        roleCode: 'tenant.admin',
        roleId: 'role-tenant-admin',
        grantId: 'grant-tenant-admin',
        hrAdminRoleCode: 'hr.admin',
        hrAdminRoleId: 'role-hr-admin',
        hrAdminGrantId: 'grant-hr-admin',
        accountBasicRoleCode: 'account.basic',
        accountBasicRoleId: 'role-account-basic'
      },
      steps: [],
      failure: null
    })
    const controller = new TenantOrgManagementGrpcController(
      service as unknown as TenantOrgManagementService,
      onboardingService as any
    )

    const result = await controller.startTenantOnboarding({
      idempotencyKey: 'onboarding-key-1',
      tenant: { code: 'acme', name: 'ACME' },
      organizationParty: {
        legalName: 'ACME Inc.',
        registeredCountry: 'US',
        identifiers: [{ identifierType: 'EIN', rawValue: '12-3456789' }]
      },
      rootOrg: { name: 'ACME Inc.' },
      firstAdmin: { displayName: 'Alice Admin', email: 'alice@example.com' }
    } as any)

    expect((result.onboarding as any).firstAdminEmployee).toEqual({
      employeeId: 'employee-first-admin',
      employmentId: 'employment-first-admin',
      accessProcessId: 'access-first-admin'
    })
    expect(result.onboarding?.access).toMatchObject({
      accountBasicRoleCode: 'account.basic',
      accountBasicRoleId: 'role-account-basic'
    })
  })
})
