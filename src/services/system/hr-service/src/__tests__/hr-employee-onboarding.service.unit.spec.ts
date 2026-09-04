import { ConflictException, NotFoundException } from '@nestjs/common'
import { EmployeeAccessPendingException } from '../application/services'
import { HrEmployeeOnboardingService } from '../application/services/hr-employee-onboarding.service'
import { OnboardingAccessStatus } from '../domain/value-objects'

/** createPartyPortMock builds the party registration boundary used by employee onboarding. */
function createPartyPortMock() {
  return {
    registerTenantParty: jest.fn().mockResolvedValue({
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
      employeeCode: 'EMP-0AF-0001',
      lifecycleStatus: 'PREBOARDING'
    }),
    createEmployment: jest.fn().mockResolvedValue({
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
      }
    })
  }
}

/** createHrQueryServiceMock builds retry/idempotency read helpers for employee onboarding. */
function createHrQueryServiceMock() {
  return {
    getEmployeeByTenantPartyId: jest.fn().mockRejectedValue(new NotFoundException('not found')),
    getActiveEmployment: jest.fn().mockRejectedValue(new NotFoundException('not found')),
    listEmployees: jest.fn().mockResolvedValue({
      total: 1,
      items: [{ employeeCode: 'EMP-0AF-0001' }],
      page: 1,
      pageSize: 1
    })
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
    expect(partyPort.registerTenantParty).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      legalName: '林予安',
      displayName: '林予安',
      identifiers: [
        {
          identifierType: 'NATIONAL_ID',
          normalizedValue: '110101199001011234',
          rawValue: '110101199001011234',
          issuerCountryOrRegion: 'CN'
        }
      ],
      idempotencyKey: expect.stringMatching(/^hr-employee-party:[a-f0-9]{64}$/)
    })
    expect(accessService.completeAccess).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        employeeId: 'employee-1',
        employmentId: 'employment-1',
        createAccount: {
          displayName: '林予安',
          email: 'lin@example.com',
          tenantPartyId: 'tenant-party-1',
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
          tenantPartyId: 'tenant-party-1',
          phone: undefined
        },
        roleIds: [],
        reason: 'employee_onboarding_account_basic'
      })
    )
  })

  it('uses a bounded deterministic party registration idempotency key for long upstream onboarding keys', async () => {
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
    const longGatewayKey =
      'hr:create-employee-person:00000000-0000-4000-8000-000000000001:CODEX_LIVE_TEST:US:CODEX-LIVE-20260610-F19E'

    await service.startEmployeeOnboarding({
      idempotencyKey: longGatewayKey,
      tenantId: '00000000-0000-4000-8000-000000000001',
      person: {
        legalName: 'Codex Live F19E',
        identifiers: [
          {
            identifierType: 'CODEX_LIVE_TEST',
            normalizedValue: 'CODEX-LIVE-20260610-F19E',
            rawValue: 'CODEX-LIVE-20260610-F19E',
            issuerCountryOrRegion: 'US'
          }
        ]
      }
    })

    const partyInput = partyPort.registerTenantParty.mock.calls[0][0]
    expect(partyInput.idempotencyKey).toMatch(/^hr-employee-party:[a-f0-9]{64}$/)
    expect(partyInput.idempotencyKey).toHaveLength(82)
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

  it('retries backend-owned employee creation when generated suffix allocation collides', async () => {
    const partyPort = createPartyPortMock()
    const hrManagementService = createHrManagementServiceMock()
    hrManagementService.createEmployee
      .mockRejectedValueOnce(new ConflictException('Employee already exists for employeeCode'))
      .mockResolvedValueOnce({
        id: 'employee-2',
        tenantId: 'tenant-1',
        tenantPartyId: 'tenant-party-1',
        employeeCode: 'EMP-0AF-0003',
        lifecycleStatus: 'PREBOARDING'
      })
    const hrQueryService = createHrQueryServiceMock()
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
      employee: { id: 'employee-2', employeeCode: 'EMP-0AF-0003' }
    })

    expect(hrManagementService.createEmployee).toHaveBeenNthCalledWith(
      1,
      expect.not.objectContaining({ employeeCode: expect.any(String) })
    )
    expect(hrManagementService.createEmployee).toHaveBeenNthCalledWith(
      2,
      expect.not.objectContaining({ employeeCode: expect.any(String) })
    )
  })

  it('delegates omitted employee code generation to HR management', async () => {
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
      idempotencyKey: 'first-employee',
      tenantId: 'tenant-1',
      person: { legalName: '首位员工' }
    })

    expect(hrManagementService.createEmployee).toHaveBeenCalledWith(
      expect.not.objectContaining({ employeeCode: expect.any(String) })
    )
  })
})
