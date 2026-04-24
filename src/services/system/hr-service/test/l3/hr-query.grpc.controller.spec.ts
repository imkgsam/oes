import { HrQueryService } from '../../src/application/services'
import { HrQueryGrpcController } from '../../src/interfaces/grpc/hr-query.grpc.controller'

/** createHrQueryServiceMock builds the application query service double for gRPC mapping tests. */
function createHrQueryServiceMock() {
  return {
    listEmployees: jest.fn(),
    getEmployeeById: jest.fn(),
    getEmployeeByTenantPartyId: jest.fn(),
    getActiveEmployment: jest.fn(),
    listEmployments: jest.fn(),
    getLatestOnboardingAccess: jest.fn()
  }
}

describe('HrQueryGrpcController L3', () => {
  it('GetActiveEmployment / should expose Employment -> OrgUnit as HR truth without account-org fields', async () => {
    const service = createHrQueryServiceMock()
    service.getActiveEmployment.mockResolvedValue({
      id: 'employment-1',
      tenantId: 'tenant-1',
      employeeId: 'employee-1',
      orgUnitId: 'org-1',
      status: 'ACTIVE',
      effectiveFrom: new Date('2026-04-23T00:00:00.000Z'),
      effectiveTo: null,
      endedReason: null
    })
    const controller = new HrQueryGrpcController(service as unknown as HrQueryService)

    const result = await controller.getActiveEmployment({ employeeId: 'employee-1' })

    expect(result.employment?.orgUnitId).toBe('org-1')
    expect(result.employment).not.toHaveProperty('accountOrgMembershipId')
    expect(result.employment).not.toHaveProperty('accountId')
  })

  it('ListEmployees / should expose tenant-scoped employee directory rows without account-owned fields', async () => {
    const service = createHrQueryServiceMock()
    service.listEmployees.mockResolvedValue({
      items: [
        {
          id: 'employee-1',
          tenantId: 'tenant-1',
          tenantPartyId: 'tenant-party-1',
          partyId: 'party-1',
          employeeCode: 'EMP-001',
          lifecycleStatus: 'ACTIVE'
        }
      ],
      page: 2,
      pageSize: 10,
      total: 1
    })
    const controller = new HrQueryGrpcController(service as unknown as HrQueryService)

    const result = await controller.listEmployees({
      keyword: 'EMP',
      lifecycleStatus: 2,
      page: 2,
      pageSize: 10,
      tenantId: 'tenant-1'
    })

    expect(service.listEmployees).toHaveBeenCalledWith({
      keyword: 'EMP',
      lifecycleStatus: 'ACTIVE',
      page: 2,
      pageSize: 10,
      tenantId: 'tenant-1'
    })
    expect(result.items?.[0]?.employeeCode).toBe('EMP-001')
    expect(result.items?.[0]).not.toHaveProperty('accountId')
    expect(result.total).toBe(1)
  })

  it('GetLatestOnboardingAccess / should expose HR-owned access compensation state without granting account truth ownership to HR', async () => {
    const service = createHrQueryServiceMock()
    service.getLatestOnboardingAccess.mockResolvedValue({
      id: 'process-1',
      tenantId: 'tenant-1',
      employeeId: 'employee-1',
      employmentId: 'employment-1',
      accountId: 'account-1',
      status: 'ACCESS_GRANT_PENDING',
      grantIdempotencyKey: 'grant-key-1',
      failureReason: 'permission.onboarding.account_not_found: account not found'
    })
    const controller = new HrQueryGrpcController(service as unknown as HrQueryService)

    const result = await controller.getLatestOnboardingAccess({
      tenantId: 'tenant-1',
      employeeId: 'employee-1'
    })

    expect(service.getLatestOnboardingAccess).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      employeeId: 'employee-1'
    })
    expect(result.process).toEqual({
      id: 'process-1',
      tenantId: 'tenant-1',
      employeeId: 'employee-1',
      employmentId: 'employment-1',
      accountId: 'account-1',
      status: 2,
      grantIdempotencyKey: 'grant-key-1',
      failureReason: 'permission.onboarding.account_not_found: account not found'
    })
    expect(result.process).not.toHaveProperty('loginMethods')
    expect(result.process).not.toHaveProperty('roles')
  })
})
