import { ConflictException, NotFoundException } from '@nestjs/common'
import { EmployeeAccessPendingException } from '../../src/application/services'
import { HrEmployeeOnboardingService } from '../../src/application/services/hr-employee-onboarding.service'
import { OnboardingAccessStatus } from '../../src/domain/value-objects'

/** createPartyPortMock builds the party registration boundary used by employee onboarding. */
function createPartyPortMock() {
  return {
    registerPersonParty: jest.fn().mockResolvedValue({
      partyId: 'party-1',
      tenantPartyId: 'tenant-party-1'
    })
  }
}

/** createHrManagementServiceMock builds the HR write use-case dependency for employee onboarding. */
function createHrManagementServiceMock() {
  return {
    createEmployee: jest.fn().mockResolvedValue({
      id: 'employee-1',
      tenantId: 'tenant-1',
      tenantPartyId: 'tenant-party-1',
      partyId: 'party-1',
      employeeCode: 'EMP-0001',
      lifecycleStatus: 'PREBOARDING'
    }),
    createEmployment: jest.fn().mockResolvedValue({
      employee: {
        id: 'employee-1',
        tenantId: 'tenant-1',
        tenantPartyId: 'tenant-party-1',
        partyId: 'party-1',
        employeeCode: 'EMP-0001',
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
      }
    })
  }
}

/** createHrQueryServiceMock builds retry/idempotency read helpers for employee onboarding. */
function createHrQueryServiceMock() {
  return {
    getEmployeeByTenantPartyId: jest.fn().mockRejectedValue(new NotFoundException('not found')),
    getActiveEmployment: jest.fn().mockRejectedValue(new NotFoundException('not found')),
    listEmployees: jest.fn().mockResolvedValue({ total: 0, items: [], page: 1, pageSize: 1 })
  }
}

/** createAccessServiceMock builds the account onboarding dependency for employee onboarding. */
function createAccessServiceMock() {
  return {
    completeAccess: jest.fn().mockResolvedValue({
      id: 'process-1',
      tenantId: 'tenant-1',
      employeeId: 'employee-1',
      employmentId: 'employment-1',
      accountId: 'account-1',
      status: OnboardingAccessStatus.COMPLETED,
      grantIdempotencyKey: 'hr-employee-onboarding:onboarding-1:access',
      failureReason: null
    })
  }
}

describe('HrEmployeeOnboardingService', () => {
  it('creates employee onboarding with account.basic default grant by sending empty roleIds', async () => {
    const partyPort = createPartyPortMock()
    const hrManagementService = createHrManagementServiceMock()
    const hrQueryService = createHrQueryServiceMock()
    const accessService = createAccessServiceMock()
    const service = new HrEmployeeOnboardingService(
      partyPort as never,
      hrManagementService as never,
      hrQueryService as never,
      accessService as never
    )

    const result = await service.startEmployeeOnboarding({
      idempotencyKey: 'onboarding-1',
      tenantId: 'tenant-1',
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
        effectiveFrom: new Date('2026-05-04T00:00:00.000Z')
      },
      account: {
        displayName: '林予安',
        email: 'lin@example.com'
      }
    })

    expect(result.employee.id).toBe('employee-1')
    expect(result.employment?.id).toBe('employment-1')
    expect(result.access?.status).toBe(OnboardingAccessStatus.COMPLETED)
    expect(partyPort.registerPersonParty).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      legalName: '林予安',
      localDisplayName: '林予安',
      identifiers: [
        {
          identifierType: 'NATIONAL_ID',
          normalizedValue: '110101199001011234',
          rawValue: '110101199001011234',
          issuerCountryOrRegion: 'CN'
        }
      ],
      idempotencyKey: 'hr-employee-onboarding:onboarding-1:party'
    })
    expect(accessService.completeAccess).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        employeeId: 'employee-1',
        employmentId: 'employment-1',
        createAccount: {
          displayName: '林予安',
          email: 'lin@example.com',
          phone: undefined
        },
        roleIds: [],
        reason: 'employee_onboarding_account_basic'
      })
    )
  })

  it('creates employee onboarding access by binding a selected existing identity user', async () => {
    const partyPort = createPartyPortMock()
    const hrManagementService = createHrManagementServiceMock()
    const hrQueryService = createHrQueryServiceMock()
    const accessService = createAccessServiceMock()
    const service = new HrEmployeeOnboardingService(
      partyPort as never,
      hrManagementService as never,
      hrQueryService as never,
      accessService as never
    )

    await service.startEmployeeOnboarding({
      idempotencyKey: 'onboarding-existing-user',
      tenantId: 'tenant-1',
      person: {
        legalName: '林予安',
        identifiers: []
      },
      primaryEmployment: {
        orgUnitId: 'org-root-1',
        effectiveFrom: new Date('2026-05-04T00:00:00.000Z')
      },
      account: {
        displayName: '林予安',
        existingUserId: 'user-existing-1'
      } as never
    })

    expect(accessService.completeAccess).toHaveBeenCalledWith(
      expect.objectContaining({
        createAccount: {
          displayName: '林予安',
          email: undefined,
          existingUserId: 'user-existing-1',
          phone: undefined
        },
        roleIds: [],
        reason: 'employee_onboarding_account_basic'
      })
    )
  })

  it('returns pending access process when downstream account creation needs recovery', async () => {
    const partyPort = createPartyPortMock()
    const hrManagementService = createHrManagementServiceMock()
    const hrQueryService = createHrQueryServiceMock()
    const accessService = createAccessServiceMock()
    accessService.completeAccess.mockRejectedValue(
      new EmployeeAccessPendingException({
        id: 'process-pending',
        tenantId: 'tenant-1',
        employeeId: 'employee-1',
        employmentId: 'employment-1',
        accountId: null,
        status: OnboardingAccessStatus.ACCOUNT_BINDING_PENDING,
        grantIdempotencyKey: 'retry-key',
        failureReason: 'CONTACT_ALREADY_BOUND'
      })
    )
    const service = new HrEmployeeOnboardingService(
      partyPort as never,
      hrManagementService as never,
      hrQueryService as never,
      accessService as never
    )

    const result = await service.startEmployeeOnboarding({
      idempotencyKey: 'onboarding-1',
      tenantId: 'tenant-1',
      person: {
        legalName: '林予安',
        identifiers: []
      },
      primaryEmployment: {
        orgUnitId: 'org-root-1',
        effectiveFrom: new Date('2026-05-04T00:00:00.000Z')
      },
      account: {
        displayName: '林予安',
        email: 'lin@example.com'
      }
    })

    expect(result.access?.status).toBe(OnboardingAccessStatus.ACCOUNT_BINDING_PENDING)
    expect(result.access?.failureReason).toBe('CONTACT_ALREADY_BOUND')
  })

  it('retries backend-owned employee code generation when concurrent onboarding consumes the first code', async () => {
    const partyPort = createPartyPortMock()
    const hrManagementService = createHrManagementServiceMock()
    hrManagementService.createEmployee
      .mockRejectedValueOnce(new ConflictException('Employee already exists for employeeCode'))
      .mockResolvedValueOnce({
        id: 'employee-2',
        tenantId: 'tenant-1',
        tenantPartyId: 'tenant-party-1',
        partyId: 'party-1',
        employeeCode: 'EMP-0002',
        lifecycleStatus: 'PREBOARDING'
      })
    const hrQueryService = createHrQueryServiceMock()
    hrQueryService.listEmployees
      .mockResolvedValueOnce({ total: 0, items: [], page: 1, pageSize: 1 })
      .mockResolvedValueOnce({ total: 1, items: [], page: 1, pageSize: 1 })
    const accessService = createAccessServiceMock()
    const service = new HrEmployeeOnboardingService(
      partyPort as never,
      hrManagementService as never,
      hrQueryService as never,
      accessService as never
    )

    await expect(
      service.startEmployeeOnboarding({
        idempotencyKey: 'onboarding-1',
        tenantId: 'tenant-1',
        person: { legalName: '林予安' }
      })
    ).resolves.toMatchObject({
      employee: { id: 'employee-2', employeeCode: 'EMP-0002' }
    })

    expect(hrManagementService.createEmployee).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ employeeCode: 'EMP-0001' })
    )
    expect(hrManagementService.createEmployee).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ employeeCode: 'EMP-0002' })
    )
  })
})
