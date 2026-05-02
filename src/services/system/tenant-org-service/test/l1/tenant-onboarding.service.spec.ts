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
  it('creates tenant, party refs, first admin account, auth bootstrap, and tenant.admin grant through owner ports', async () => {
    const tenantRepository = {
      createWithRootOrg: jest.fn().mockResolvedValue({
        tenant: { id: 'tenant-1', code: 'acme', name: 'ACME', status: 'ACTIVE', rootOrgId: 'root-org-1' },
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
          organizationPartyId: null
        }
      }),
      findById: jest.fn().mockResolvedValue({ id: 'tenant-1', code: 'acme', name: 'ACME', status: 'ACTIVE', rootOrgId: 'root-org-1' })
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
        organizationPartyId: 'org-party-1'
      })
    }
    const runRepository = createRunRepository()
    const partyPort = {
      registerOrganizationParty: jest.fn().mockResolvedValue({ partyId: 'org-party-1' }),
      bindExistingPartyToTenant: jest.fn().mockResolvedValue({ partyId: 'org-party-1', tenantPartyId: 'org-tenant-party-1' })
    }
    const identityPort = {
      createTenantUserAccount: jest.fn().mockResolvedValue({
        userId: 'user-1',
        accountId: 'account-1',
        userPartyId: 'person-party-1',
        userTenantPartyId: 'person-tenant-party-1'
      })
    }
    const authPort = {
      bootstrapUserLoginMethods: jest.fn().mockResolvedValue({ emailBootstrapped: true, phoneBootstrapped: false, passwordBootstrapped: false }),
      requirePasswordSetup: jest.fn().mockResolvedValue(undefined)
    }
    const permissionPort = {
      ensureTenantAdminRole: jest.fn().mockResolvedValue({ roleId: 'role-tenant-admin', roleCode: 'tenant.admin', created: true }),
      grantTenantAdmin: jest.fn().mockResolvedValue({ grantId: 'grant-1' })
    }

    const service = new TenantOnboardingService(
      tenantRepository as any,
      orgUnitRepository as any,
      runRepository,
      partyPort,
      identityPort,
      authPort,
      permissionPort
    )

    await expect(
      service.start({
        idempotencyKey: 'onboarding-key-1',
        tenant: { code: 'acme', name: 'ACME' },
        organizationParty: { legalName: 'ACME Inc.', registeredCountry: 'US', identifiers: [] },
        rootOrg: { name: 'ACME HQ' },
        firstAdmin: { displayName: 'Alice Admin', email: 'alice@example.com', requirePasswordSetup: true }
      })
    ).resolves.toMatchObject({
      status: 'SUCCEEDED',
      organizationParty: { partyId: 'org-party-1', tenantPartyId: 'org-tenant-party-1' },
      firstAdmin: { userId: 'user-1', accountId: 'account-1', personPartyId: 'person-party-1' },
      access: { roleCode: 'tenant.admin', roleId: 'role-tenant-admin', grantId: 'grant-1' }
    })

    expect(partyPort.registerOrganizationParty).toHaveBeenCalled()
    expect(identityPort.createTenantUserAccount).toHaveBeenCalledWith(expect.objectContaining({ tenantId: 'tenant-1' }))
    expect(permissionPort.grantTenantAdmin).toHaveBeenCalledWith(expect.objectContaining({ accountId: 'account-1', roleId: 'role-tenant-admin' }))
  })
})
