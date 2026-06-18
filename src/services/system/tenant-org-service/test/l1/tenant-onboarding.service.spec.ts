import { TenantOnboardingService } from '../../src/application/services/tenant-onboarding.service'
import { TenantOnboardingRunRecord, TenantOnboardingRunRepository } from '../../src/domain/repositories'
import { TenantOnboardingRunStatus } from '../../src/domain/value-objects'

function createRunRepository(): jest.Mocked<TenantOnboardingRunRepository> {
  const runs = new Map<string, TenantOnboardingRunRecord>()
  return {
    create: jest.fn(async (input) => {
      const run: TenantOnboardingRunRecord = {
        id: 'onboarding-1',
        idempotencyKey: input.idempotencyKey,
        requestHash: input.requestHash,
        requestPayload: input.requestPayload,
        status: TenantOnboardingRunStatus.PENDING,
        externalRefs: {},
        steps: input.steps,
        failure: null
      }
      runs.set(run.id, run)
      return run
    }),
    findById: jest.fn(async (id) => runs.get(id) ?? null),
    findByIdempotencyKey: jest.fn(async (key) => Array.from(runs.values()).find((run) => run.idempotencyKey === key) ?? null),
    update: jest.fn(async (input) => {
      const existing = runs.get(input.id)!
      const next = {
        ...existing,
        status: input.status ?? existing.status,
        externalRefs: input.externalRefs ?? existing.externalRefs,
        steps: input.steps ?? existing.steps,
        failure: input.failure === undefined ? existing.failure : input.failure
      }
      runs.set(input.id, next)
      return next
    })
  }
}

describe('TenantOnboardingService', () => {
  it('creates tenant, party refs, first admin account, auth bootstrap, and tenant/hr admin grants through owner ports', async () => {
    const tenantRepository = {
      createWithRootOrg: jest.fn().mockResolvedValue({
        tenant: { id: 'tenant-1', code: 'acme', employeeCodePrefix: '0AF', name: 'ACME', status: 'ACTIVE', rootOrgId: 'root-org-1' },
        rootOrgUnit: {
          id: 'root-org-1',
          tenantId: 'tenant-1',
          parentOrgId: null,
          name: 'ACME HQ',
          type: 'ROOT',
          status: 'ACTIVE',
          path: '/root-org-1',
          depth: 0,
          sortOrder: 0,
          organizationTenantPartyId: null
        }
      }),
      findById: jest.fn().mockResolvedValue({ id: 'tenant-1', code: 'acme', employeeCodePrefix: '0AF', name: 'ACME', status: 'ACTIVE', rootOrgId: 'root-org-1' })
    }
    const orgUnitRepository = {
      update: jest.fn().mockResolvedValue({}),
      findById: jest.fn().mockResolvedValue({
        id: 'root-org-1',
        tenantId: 'tenant-1',
        parentOrgId: null,
        name: 'ACME HQ',
        type: 'ROOT',
        status: 'ACTIVE',
        path: '/root-org-1',
        depth: 0,
        sortOrder: 0,
        organizationTenantPartyId: 'org-tenant-party-1'
      })
    }
    const runRepository = createRunRepository()
    const partyPort = {
      registerOrganizationTenantParty: jest.fn().mockResolvedValue({ tenantPartyId: 'org-tenant-party-1' })
    }
    const identityPort = {
      createTenantUserAccount: jest.fn().mockResolvedValue({
        userId: 'user-1',
        accountId: 'account-1',
        tenantPartyId: 'person-tenant-party-1'
      })
    }
    const authPort = {
      bootstrapUserLoginMethods: jest.fn().mockResolvedValue({ emailBootstrapped: true, phoneBootstrapped: false, passwordBootstrapped: false }),
      requirePasswordSetup: jest.fn().mockResolvedValue(undefined)
    }
    const permissionPort = {
      ensureTenantAdminRole: jest.fn().mockResolvedValue({ roleId: 'role-tenant-admin', roleCode: 'tenant.admin', created: true }),
      ensureHrAdminRole: jest.fn().mockResolvedValue({ roleId: 'role-hr-admin', roleCode: 'hr.admin', created: true }),
      ensureAccountBasicRole: jest.fn().mockResolvedValue({ roleId: 'role-account-basic', roleCode: 'account.basic', created: true }),
      grantTenantAdmin: jest.fn().mockResolvedValue({ grantId: 'grant-tenant-admin' }),
      grantHrAdmin: jest.fn().mockResolvedValue({ grantId: 'grant-hr-admin' })
    }
    const hrEmployeeOnboardingPort = {
      createEmployeeOnboarding: jest.fn().mockResolvedValue({
        employeeId: 'employee-first-admin',
        employmentId: 'employment-first-admin',
        accessProcessId: 'access-first-admin'
      })
    }

    const service = new (TenantOnboardingService as any)(
      tenantRepository as any,
      orgUnitRepository as any,
      runRepository,
      partyPort,
      identityPort,
      authPort,
      permissionPort,
      hrEmployeeOnboardingPort
    )

    await expect(
      service.start({
        idempotencyKey: 'onboarding-key-1',
        tenant: { code: 'acme', employeeCodePrefix: '0AF', name: 'ACME' },
        organizationTenantParty: {
          legalName: 'ACME Inc.',
          registeredCountry: 'US',
          identifiers: [
            {
              identifierType: 'EIN',
              rawValue: '12-3456789',
              normalizedValue: '',
              issuerCountryOrRegion: ''
            }
          ]
        },
        rootOrg: { name: 'ACME HQ' },
        firstAdmin: { displayName: 'Alice Admin', email: 'alice@example.com', requirePasswordSetup: true }
      })
    ).resolves.toMatchObject({
      status: 'SUCCEEDED',
      organizationTenantParty: { tenantPartyId: 'org-tenant-party-1' },
      firstAdmin: { userId: 'user-1', accountId: 'account-1', tenantPartyId: 'person-tenant-party-1' },
      access: {
        roleCode: 'tenant.admin',
        roleId: 'role-tenant-admin',
        grantId: 'grant-tenant-admin',
        hrAdminRoleCode: 'hr.admin',
        hrAdminRoleId: 'role-hr-admin',
        hrAdminGrantId: 'grant-hr-admin',
        accountBasicRoleCode: 'account.basic',
        accountBasicRoleId: 'role-account-basic'
      }
    })

    expect(partyPort.registerOrganizationTenantParty).toHaveBeenCalledWith(
      expect.objectContaining({
        identifiers: [
          {
            identifierType: 'EIN',
            issuerCountryOrRegion: 'US',
            normalizedValue: '123456789',
            rawValue: '12-3456789'
          }
        ]
      })
    )
    expect(identityPort.createTenantUserAccount).toHaveBeenCalledWith(expect.objectContaining({ tenantId: 'tenant-1' }))
    expect(permissionPort.grantTenantAdmin).toHaveBeenCalledWith(expect.objectContaining({ accountId: 'account-1', roleId: 'role-tenant-admin' }))
    expect(permissionPort.ensureHrAdminRole).toHaveBeenCalledWith(expect.objectContaining({ tenantId: 'tenant-1' }))
    expect(permissionPort.grantHrAdmin).toHaveBeenCalledWith(expect.objectContaining({ accountId: 'account-1', roleId: 'role-hr-admin' }))
    expect(permissionPort.ensureAccountBasicRole).toHaveBeenCalledWith(expect.objectContaining({ tenantId: 'tenant-1' }))
    expect(hrEmployeeOnboardingPort.createEmployeeOnboarding).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      employeeCode: 'EMP-0AF-0001',
      idempotencyKey: 'onboarding-1:CREATE_FIRST_ADMIN_EMPLOYEE',
      person: {
        existingTenantPartyId: 'person-tenant-party-1',
        legalName: 'Alice Admin'
      },
      primaryEmployment: {
        orgUnitId: 'root-org-1',
        effectiveFrom: expect.any(Date),
        positionName: 'Tenant Administrator'
      },
      account: {
        existingAccountId: 'account-1'
      }
    })
  })

  it('rejects tenant onboarding without an organization identifier', async () => {
    const service = new (TenantOnboardingService as any)(
      { createWithRootOrg: jest.fn(), findById: jest.fn() } as any,
      { update: jest.fn(), findById: jest.fn() } as any,
      createRunRepository(),
      { registerOrganizationTenantParty: jest.fn() } as any,
      { createTenantUserAccount: jest.fn() } as any,
      { bootstrapUserLoginMethods: jest.fn(), requirePasswordSetup: jest.fn() } as any,
      { ensureTenantAdminRole: jest.fn(), ensureHrAdminRole: jest.fn(), ensureAccountBasicRole: jest.fn(), grantTenantAdmin: jest.fn(), grantHrAdmin: jest.fn() } as any,
      { createEmployeeOnboarding: jest.fn() } as any
    )

    await expect(
      service.start({
        idempotencyKey: 'onboarding-key-1',
        tenant: { code: 'acme', employeeCodePrefix: '0AF', name: 'ACME' },
        organizationTenantParty: { legalName: 'ACME Inc.', registeredCountry: 'US', identifiers: [] },
        rootOrg: { name: 'ACME HQ' },
        firstAdmin: { displayName: 'Alice Admin', email: 'alice@example.com', requirePasswordSetup: true }
      })
    ).rejects.toThrow('organizationTenantParty.identifiers is required')
  })

  it('can bind an existing user as the first tenant admin without creating login methods', async () => {
    const tenantRepository = {
      createWithRootOrg: jest.fn().mockResolvedValue({
        tenant: { id: 'tenant-1', code: 'acme', employeeCodePrefix: '0AF', name: 'ACME', status: 'ACTIVE', rootOrgId: 'root-org-1' },
        rootOrgUnit: {
          id: 'root-org-1',
          tenantId: 'tenant-1',
          parentOrgId: null,
          name: 'ACME HQ',
          type: 'ROOT',
          status: 'ACTIVE',
          path: '/root-org-1',
          depth: 0,
          sortOrder: 0,
          organizationTenantPartyId: null
        }
      }),
      findById: jest.fn().mockResolvedValue({ id: 'tenant-1', code: 'acme', employeeCodePrefix: '0AF', name: 'ACME', status: 'ACTIVE', rootOrgId: 'root-org-1' })
    }
    const orgUnitRepository = {
      update: jest.fn().mockResolvedValue({}),
      findById: jest.fn().mockResolvedValue({
        id: 'root-org-1',
        tenantId: 'tenant-1',
        parentOrgId: null,
        name: 'ACME HQ',
        type: 'ROOT',
        status: 'ACTIVE',
        path: '/root-org-1',
        depth: 0,
        sortOrder: 0,
        organizationTenantPartyId: 'org-tenant-party-1'
      })
    }
    const partyPort = {
      registerOrganizationTenantParty: jest.fn().mockResolvedValue({ tenantPartyId: 'org-tenant-party-1' })
    }
    const identityPort = {
      createTenantUserAccount: jest.fn().mockResolvedValue({
        userId: 'user-system-admin',
        accountId: 'tenant-account-1',
        tenantPartyId: 'person-tenant-party-1'
      })
    }
    const authPort = {
      bootstrapUserLoginMethods: jest.fn(),
      requirePasswordSetup: jest.fn()
    }
    const permissionPort = {
      ensureTenantAdminRole: jest.fn().mockResolvedValue({ roleId: 'role-tenant-admin', roleCode: 'tenant.admin', created: true }),
      ensureHrAdminRole: jest.fn().mockResolvedValue({ roleId: 'role-hr-admin', roleCode: 'hr.admin', created: true }),
      ensureAccountBasicRole: jest.fn().mockResolvedValue({ roleId: 'role-account-basic', roleCode: 'account.basic', created: true }),
      grantTenantAdmin: jest.fn().mockResolvedValue({ grantId: 'grant-tenant-admin' }),
      grantHrAdmin: jest.fn().mockResolvedValue({ grantId: 'grant-hr-admin' })
    }
    const hrEmployeeOnboardingPort = {
      createEmployeeOnboarding: jest.fn().mockResolvedValue({
        employeeId: 'employee-existing-admin',
        employmentId: 'employment-existing-admin',
        accessProcessId: 'access-existing-admin'
      })
    }

    const service = new (TenantOnboardingService as any)(
      tenantRepository as any,
      orgUnitRepository as any,
      createRunRepository(),
      partyPort,
      identityPort,
      authPort as any,
      permissionPort,
      hrEmployeeOnboardingPort
    )

    await expect(
      service.start({
        idempotencyKey: 'onboarding-key-1',
        tenant: { code: 'acme', employeeCodePrefix: '0AF', name: 'ACME' },
        organizationTenantParty: {
          legalName: 'ACME Inc.',
          registeredCountry: 'US',
          identifiers: [{ identifierType: 'EIN', rawValue: '12-3456789', normalizedValue: '', issuerCountryOrRegion: '' }]
        },
        rootOrg: { name: 'ACME HQ' },
        firstAdmin: {
          displayName: 'System Admin',
          existingUserId: 'user-system-admin',
          provisioningMode: 'EXISTING_USER',
          requirePasswordSetup: false
        }
      })
    ).resolves.toMatchObject({
      status: 'SUCCEEDED',
      firstAdmin: { userId: 'user-system-admin', accountId: 'tenant-account-1' },
      access: { grantId: 'grant-tenant-admin', hrAdminGrantId: 'grant-hr-admin' }
    })

    expect(identityPort.createTenantUserAccount).toHaveBeenCalledWith(
      expect.objectContaining({
        existingUserId: 'user-system-admin',
        tenantId: 'tenant-1'
      })
    )
    expect(authPort.bootstrapUserLoginMethods).not.toHaveBeenCalled()
    expect(authPort.requirePasswordSetup).not.toHaveBeenCalled()
    expect(permissionPort.grantHrAdmin).toHaveBeenCalledWith(expect.objectContaining({ accountId: 'tenant-account-1', roleId: 'role-hr-admin' }))
    expect(permissionPort.ensureAccountBasicRole).toHaveBeenCalledWith(expect.objectContaining({ tenantId: 'tenant-1' }))
    expect(hrEmployeeOnboardingPort.createEmployeeOnboarding).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        employeeCode: 'EMP-0AF-0001',
        person: expect.objectContaining({
          existingTenantPartyId: 'person-tenant-party-1',
          legalName: 'System Admin'
        }),
        account: {
          existingAccountId: 'tenant-account-1'
        }
      })
    )
  })
})
