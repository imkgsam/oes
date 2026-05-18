import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common'
import { HrManagementService } from './hr-management.service'

// Verifies the gateway HR management service keeps tenant-admin access tenant-scoped while composing employee and employment read models.
describe('HrManagementService', () => {
  const hrQueryAdapter = {
    getActiveEmployment: jest.fn(),
    getEmployeeById: jest.fn(),
    getLatestOnboardingAccess: jest.fn(),
    listEmployees: jest.fn(),
    listEmployments: jest.fn()
  }
  const hrMutationAdapter = {
    completeEmployeeAccess: jest.fn(),
    changePrimaryEmployment: jest.fn(),
    createEmployee: jest.fn(),
    createEmployment: jest.fn(),
    endEmployment: jest.fn()
  }
  const identityQueryAdapter = {
    getAccountById: jest.fn(),
    getEmployeeBindingByAccountId: jest.fn()
  }
  const authAdapter = {
    listLoginMethods: jest.fn()
  }
  const partyTenantQueryAdapter = {
    getTenantPartyById: jest.fn()
  }
  const permissionService = {
    listAccountRoles: jest.fn()
  }
  const orgManagementService = {
    getOrgUnitDetail: jest.fn()
  }

  const service = new HrManagementService(
    hrQueryAdapter as any,
    hrMutationAdapter as any,
    identityQueryAdapter as any,
    authAdapter as any,
    partyTenantQueryAdapter as any,
    permissionService as any,
    orgManagementService as any
  )

  beforeEach(() => {
    hrQueryAdapter.getActiveEmployment.mockReset()
    hrQueryAdapter.getEmployeeById.mockReset()
    hrQueryAdapter.getLatestOnboardingAccess.mockReset()
    hrQueryAdapter.listEmployees.mockReset()
    hrQueryAdapter.listEmployments.mockReset()
    hrMutationAdapter.completeEmployeeAccess.mockReset()
    hrMutationAdapter.changePrimaryEmployment.mockReset()
    hrMutationAdapter.createEmployee.mockReset()
    hrMutationAdapter.createEmployment.mockReset()
    hrMutationAdapter.endEmployment.mockReset()
    identityQueryAdapter.getAccountById.mockReset()
    identityQueryAdapter.getEmployeeBindingByAccountId.mockReset()
    authAdapter.listLoginMethods.mockReset()
    partyTenantQueryAdapter.getTenantPartyById.mockReset()
    permissionService.listAccountRoles.mockReset()
    orgManagementService.getOrgUnitDetail.mockReset()
  })

  it('rejects tenant-scoped operators when they request another tenant employee directory', async () => {
    const source = {
      requestId: 'req-1',
      traceId: 'trace-1',
      user: { aid: 'account-1', scopeLevel: 'TENANT', tid: 'tenant-1' }
    }

    await expect(
      service.listEmployees(
        'tenant-2',
        {
          page: 1,
          pageSize: 20
        },
        source as any
      )
    ).rejects.toBeInstanceOf(ForbiddenException)

    expect(hrQueryAdapter.listEmployees).not.toHaveBeenCalled()
  })

  it('builds the employee directory from HR truth and keeps active employment optional', async () => {
    const source = {
      requestId: 'req-1',
      traceId: 'trace-1',
      user: { aid: 'account-1', scopeLevel: 'TENANT', tid: 'tenant-1' }
    }
    hrQueryAdapter.listEmployees.mockResolvedValue({
      items: [
        {
          id: 'employee-preboarding',
          tenantId: 'tenant-1',
          tenantPartyId: 'tenant-party-1',
          partyId: 'party-1',
          employeeCode: 'EMP-001',
          lifecycleStatus: 'PREBOARDING'
        },
        {
          id: 'employee-active',
          tenantId: 'tenant-1',
          tenantPartyId: 'tenant-party-2',
          partyId: 'party-2',
          employeeCode: 'EMP-002',
          lifecycleStatus: 'ACTIVE'
        }
      ],
      page: 1,
      pageSize: 20,
      total: 2
    })
    hrQueryAdapter.getActiveEmployment.mockRejectedValueOnce(new NotFoundException('no active employment'))
    hrQueryAdapter.getActiveEmployment.mockResolvedValueOnce({
      id: 'employment-1',
      tenantId: 'tenant-1',
      employeeId: 'employee-active',
      orgUnitId: 'org-1',
      status: 'ACTIVE',
      effectiveFrom: '2026-04-24T00:00:00.000Z',
      effectiveTo: undefined,
      endedReason: undefined
    })
    orgManagementService.getOrgUnitDetail.mockResolvedValue({
      orgUnit: {
        id: 'org-1',
        tenantId: 'tenant-1',
        parentOrgId: 'org-root-1',
        name: '制造中心',
        type: 'DEPARTMENT',
        status: 'ACTIVE',
        path: '/org-root-1/org-1',
        depth: 1,
        sortOrder: 10,
        organizationPartyId: null,
        organizationParty: null
      }
    })

    await expect(
      service.listEmployees(
        'tenant-1',
        {
          keyword: 'EMP',
          page: 1,
          pageSize: 20
        },
        source as any
      )
    ).resolves.toEqual({
      items: [
        {
          activeEmployment: undefined,
          employee: {
            id: 'employee-preboarding',
            tenantId: 'tenant-1',
            tenantPartyId: 'tenant-party-1',
            partyId: 'party-1',
            employeeCode: 'EMP-001',
            lifecycleStatus: 'PREBOARDING'
          }
        },
        {
          activeEmployment: {
            id: 'employment-1',
            tenantId: 'tenant-1',
            employeeId: 'employee-active',
            orgUnitId: 'org-1',
            status: 'ACTIVE',
            effectiveFrom: '2026-04-24T00:00:00.000Z',
            effectiveTo: undefined,
            endedReason: undefined,
            orgUnit: {
              id: 'org-1',
              tenantId: 'tenant-1',
              parentOrgId: 'org-root-1',
              name: '制造中心',
              type: 'DEPARTMENT',
              status: 'ACTIVE',
              path: '/org-root-1/org-1',
              depth: 1,
              sortOrder: 10,
              organizationPartyId: null,
              organizationParty: null
            }
          },
          employee: {
            id: 'employee-active',
            tenantId: 'tenant-1',
            tenantPartyId: 'tenant-party-2',
            partyId: 'party-2',
            employeeCode: 'EMP-002',
            lifecycleStatus: 'ACTIVE'
          }
        }
      ],
      page: 1,
      pageSize: 20,
      total: 2
    })

    expect(hrQueryAdapter.listEmployees).toHaveBeenCalledWith(
      {
        tenantId: 'tenant-1',
        keyword: 'EMP',
        lifecycleStatus: undefined,
        page: 1,
        pageSize: 20
      },
      source
    )
    expect(hrQueryAdapter.getActiveEmployment).toHaveBeenNthCalledWith(1, 'employee-preboarding', source)
    expect(hrQueryAdapter.getActiveEmployment).toHaveBeenNthCalledWith(2, 'employee-active', source)
    expect(hrQueryAdapter.getLatestOnboardingAccess).not.toHaveBeenCalled()
    expect(orgManagementService.getOrgUnitDetail).toHaveBeenCalledWith('tenant-1', 'org-1', source)
  })

  it('loads one employee detail with history and current active employment', async () => {
    const source = {
      requestId: 'req-1',
      traceId: 'trace-1',
      user: { aid: 'account-1', scopeLevel: 'TENANT', tid: 'tenant-1' }
    }
    hrQueryAdapter.getEmployeeById.mockResolvedValue({
      id: 'employee-1',
      tenantId: 'tenant-1',
      tenantPartyId: 'tenant-party-1',
      partyId: 'party-1',
      employeeCode: 'EMP-001',
      lifecycleStatus: 'ACTIVE'
    })
    hrQueryAdapter.getActiveEmployment.mockResolvedValue({
      id: 'employment-active',
      tenantId: 'tenant-1',
      employeeId: 'employee-1',
      orgUnitId: 'org-1',
      status: 'ACTIVE',
      effectiveFrom: '2026-04-24T00:00:00.000Z',
      effectiveTo: undefined,
      endedReason: undefined
    })
    hrQueryAdapter.listEmployments.mockResolvedValue([
      {
        id: 'employment-ended',
        tenantId: 'tenant-1',
        employeeId: 'employee-1',
        orgUnitId: 'org-legacy',
        status: 'ENDED',
        effectiveFrom: '2026-03-01T00:00:00.000Z',
        effectiveTo: '2026-04-01T00:00:00.000Z',
        endedReason: 'transfer'
      }
    ])
    orgManagementService.getOrgUnitDetail
      .mockResolvedValueOnce({
        orgUnit: {
          id: 'org-1',
          tenantId: 'tenant-1',
          parentOrgId: 'org-root-1',
          name: '制造中心',
          type: 'DEPARTMENT',
          status: 'ACTIVE',
          path: '/org-root-1/org-1',
          depth: 1,
          sortOrder: 10,
          organizationPartyId: null,
          organizationParty: null
        }
      })
      .mockResolvedValueOnce({
        orgUnit: {
          id: 'org-legacy',
          tenantId: 'tenant-1',
          parentOrgId: 'org-root-1',
          name: '华东分公司',
          type: 'BRANCH',
          status: 'ACTIVE',
          path: '/org-root-1/org-legacy',
          depth: 1,
          sortOrder: 20,
          organizationPartyId: 'party-legacy',
          organizationParty: {
            id: 'party-legacy',
            type: 'ORGANIZATION',
            status: 'ACTIVE',
            legalName: '华东制造主体有限公司'
          }
        }
      })

    await expect(service.getEmployeeDetail('tenant-1', 'employee-1', source as any)).resolves.toEqual({
      employee: {
        id: 'employee-1',
        tenantId: 'tenant-1',
        tenantPartyId: 'tenant-party-1',
        partyId: 'party-1',
        employeeCode: 'EMP-001',
        lifecycleStatus: 'ACTIVE'
      },
      activeEmployment: {
        id: 'employment-active',
        tenantId: 'tenant-1',
        employeeId: 'employee-1',
        orgUnitId: 'org-1',
        status: 'ACTIVE',
        effectiveFrom: '2026-04-24T00:00:00.000Z',
        effectiveTo: undefined,
        endedReason: undefined,
        orgUnit: {
          id: 'org-1',
          tenantId: 'tenant-1',
          parentOrgId: 'org-root-1',
          name: '制造中心',
          type: 'DEPARTMENT',
          status: 'ACTIVE',
          path: '/org-root-1/org-1',
          depth: 1,
          sortOrder: 10,
          organizationPartyId: null,
          organizationParty: null
        }
      },
      employments: [
        {
          id: 'employment-ended',
          tenantId: 'tenant-1',
          employeeId: 'employee-1',
          orgUnitId: 'org-legacy',
          status: 'ENDED',
          effectiveFrom: '2026-03-01T00:00:00.000Z',
          effectiveTo: '2026-04-01T00:00:00.000Z',
          endedReason: 'transfer',
          orgUnit: {
            id: 'org-legacy',
            tenantId: 'tenant-1',
            parentOrgId: 'org-root-1',
            name: '华东分公司',
            type: 'BRANCH',
            status: 'ACTIVE',
            path: '/org-root-1/org-legacy',
            depth: 1,
            sortOrder: 20,
            organizationPartyId: 'party-legacy',
            organizationParty: {
              id: 'party-legacy',
              type: 'ORGANIZATION',
              status: 'ACTIVE',
              legalName: '华东制造主体有限公司'
            }
          }
        }
      ]
    })

    expect(orgManagementService.getOrgUnitDetail).toHaveBeenNthCalledWith(1, 'tenant-1', 'org-1', source)
    expect(orgManagementService.getOrgUnitDetail).toHaveBeenNthCalledWith(
      2,
      'tenant-1',
      'org-legacy',
      source
    )
  })

  it('builds an employee account-access summary without turning the HR entry into an account owner page', async () => {
    const source = {
      requestId: 'req-1',
      traceId: 'trace-1',
      user: { aid: 'account-1', scopeLevel: 'TENANT', tid: 'tenant-1' }
    }
    hrQueryAdapter.getEmployeeById.mockResolvedValue({
      id: 'employee-1',
      tenantId: 'tenant-1',
      tenantPartyId: 'tenant-party-1',
      employeeCode: 'EMP-001',
      lifecycleStatus: 'ACTIVE'
    })
    hrQueryAdapter.getActiveEmployment.mockResolvedValue({
      id: 'employment-1',
      tenantId: 'tenant-1',
      employeeId: 'employee-1',
      orgUnitId: 'org-1',
      status: 'ACTIVE',
      effectiveFrom: '2026-04-24T00:00:00.000Z'
    })
    hrQueryAdapter.getLatestOnboardingAccess.mockResolvedValue({
      id: 'process-1',
      tenantId: 'tenant-1',
      employeeId: 'employee-1',
      employmentId: 'employment-1',
      accountId: 'account-1',
      status: 'ACCESS_GRANT_PENDING',
      grantIdempotencyKey: 'grant-key-1',
      failureReason: 'permission-service unavailable'
    })
    identityQueryAdapter.getAccountById.mockResolvedValue({
      account: {
        id: 'account-1',
        userId: 'user-1',
        tenantId: 'tenant-1',
        displayName: 'EMP-001',
        isEnabled: true,
        scopeLevel: 'TENANT'
      }
    })
    authAdapter.listLoginMethods.mockResolvedValue({
      loginMethods: [
        {
          methodId: 'method-1',
          type: 'EMAIL_PASSWORD',
          maskedIdentifier: 'm***@example.com',
          enabled: true,
          verified: true,
          hasPassword: false
        }
      ],
      passwordSetupRequired: true
    })
    permissionService.listAccountRoles.mockResolvedValue({
      roles: [
        {
          id: 'role-1',
          code: 'tenant.admin',
          name: 'Tenant Admin'
        }
      ]
    })

    await expect(
      service.getEmployeeAccountAccess('tenant-1', 'employee-1', source as any)
    ).resolves.toEqual({
      status: 'PENDING',
      onboardingStatus: 'ACCESS_GRANT_PENDING',
      canContinue: true,
      activeEmploymentId: 'employment-1',
      failureReason: 'permission-service unavailable',
      account: {
        accountId: 'account-1',
        userId: 'user-1',
        tenantId: 'tenant-1',
        displayName: 'EMP-001',
        isEnabled: true,
        scopeLevel: 'TENANT'
      },
      loginMethods: [
        {
          methodId: 'method-1',
          type: 'EMAIL_PASSWORD',
          maskedIdentifier: 'm***@example.com',
          enabled: true,
          verified: true,
          hasPassword: false
        }
      ],
      passwordSetupRequired: true,
      roles: [
        {
          id: 'role-1',
          code: 'tenant.admin',
          name: 'Tenant Admin'
        }
      ]
    })
  })

  it('delegates member login enablement to the HR-owned onboarding access command instead of assigning roles in gateway', async () => {
    const source = {
      requestId: 'req-1',
      traceId: 'trace-1',
      user: { aid: 'account-1', scopeLevel: 'TENANT', tid: 'tenant-1' }
    }
    hrQueryAdapter.getEmployeeById.mockResolvedValue({
      id: 'employee-1',
      tenantId: 'tenant-1',
      tenantPartyId: 'tenant-party-1',
      employeeCode: 'EMP-001',
      lifecycleStatus: 'ACTIVE'
    })
    hrQueryAdapter.getActiveEmployment.mockResolvedValue({
      id: 'employment-1',
      tenantId: 'tenant-1',
      employeeId: 'employee-1',
      orgUnitId: 'org-1',
      status: 'ACTIVE',
      effectiveFrom: '2026-04-24T00:00:00.000Z'
    })
    hrMutationAdapter.completeEmployeeAccess.mockResolvedValue({
      process: {
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
    hrQueryAdapter.getLatestOnboardingAccess.mockResolvedValue({
      id: 'process-1',
      tenantId: 'tenant-1',
      employeeId: 'employee-1',
      employmentId: 'employment-1',
      accountId: 'account-1',
      status: 'COMPLETED',
      grantIdempotencyKey: 'grant-key-1',
      failureReason: null
    })
    identityQueryAdapter.getAccountById.mockResolvedValue({
      account: {
        id: 'account-1',
        userId: 'user-1',
        tenantId: 'tenant-1',
        displayName: 'EMP-001',
        isEnabled: true,
        scopeLevel: 'TENANT'
      }
    })
    authAdapter.listLoginMethods.mockResolvedValue({
      loginMethods: [],
      passwordSetupRequired: false
    })
    permissionService.listAccountRoles.mockResolvedValue({
      roles: []
    })

    await expect(
      service.completeEmployeeAccess(
        'tenant-1',
        'employee-1',
        {
          employmentId: 'employment-1',
          roleIds: ['role-1'],
          reason: 'member_access_enable',
          createAccount: {
            displayName: 'EMP-001',
            email: 'member@example.com'
          }
        },
        source as any
      )
    ).resolves.toEqual(
      expect.objectContaining({
        status: 'ACTIVE',
        onboardingStatus: 'COMPLETED'
      })
    )

    expect(hrMutationAdapter.completeEmployeeAccess).toHaveBeenCalledWith(
      {
        tenantId: 'tenant-1',
        employeeId: 'employee-1',
        employmentId: 'employment-1',
        roleIds: ['role-1'],
        reason: 'member_access_enable',
        createAccount: {
          displayName: 'EMP-001',
          email: 'member@example.com'
        }
      },
      source
    )
    expect(permissionService.listAccountRoles).toHaveBeenCalled()
  })

  it('rejects change-primary employment requests without effectiveFrom as a bad request', async () => {
    const source = {
      requestId: 'req-1',
      traceId: 'trace-1',
      user: { aid: 'account-1', scopeLevel: 'TENANT', tid: 'tenant-1' }
    }
    hrQueryAdapter.getEmployeeById.mockResolvedValue({
      id: 'employee-1',
      tenantId: 'tenant-1',
      tenantPartyId: 'tenant-party-1',
      employeeCode: 'EMP-001',
      lifecycleStatus: 'ACTIVE'
    })
    hrQueryAdapter.listEmployments.mockResolvedValue([
      {
        id: 'employment-1',
        tenantId: 'tenant-1',
        employeeId: 'employee-1',
        orgUnitId: 'org-1',
        status: 'ACTIVE',
        effectiveFrom: '2026-04-24T00:00:00.000Z'
      }
    ])

    await expect(
      service.changePrimaryEmployment(
        'tenant-1',
        'employee-1',
        {
          fromEmploymentId: 'employment-1',
          toOrgUnitId: 'org-2',
          effectiveFrom: ''
        },
        source as any
      )
    ).rejects.toBeInstanceOf(BadRequestException)

    expect(hrMutationAdapter.changePrimaryEmployment).not.toHaveBeenCalled()
  })
})
