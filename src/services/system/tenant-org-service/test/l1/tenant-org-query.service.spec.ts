import { TenantOrgQueryService } from '../../src/application/services/tenant-org-query.service'
import { OrgUnitStatus, OrgUnitType, TenantStatus } from '../../src/domain/value-objects'

/** createTenantRepositoryMock builds the tenant repository double for query service behavior tests. */
function createTenantRepositoryMock() {
  return {
    createWithRootOrg: jest.fn(),
    findById: jest.fn(),
    list: jest.fn(),
    updateProfile: jest.fn(),
    setStatus: jest.fn()
  }
}

/** createOrgUnitRepositoryMock builds the org unit repository double for query service behavior tests. */
function createOrgUnitRepositoryMock() {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    listTreeByTenant: jest.fn(),
    update: jest.fn(),
    move: jest.fn(),
    archive: jest.fn(),
    listAncestors: jest.fn(),
    listDescendants: jest.fn()
  }
}

describe('TenantOrgQueryService', () => {
  it('org reference validation / when org belongs to another tenant / should return invalid without throwing', async () => {
    const tenantRepository = createTenantRepositoryMock()
    const orgUnitRepository = createOrgUnitRepositoryMock()
    orgUnitRepository.findById.mockResolvedValue(null)
    const service = new TenantOrgQueryService(tenantRepository as never, orgUnitRepository as never)

    const result = await service.validateOrgReference({
      tenantId: 'tenant-a',
      orgUnitId: 'org-from-tenant-b'
    })

    expect(result).toEqual({
      valid: false,
      rejectionReason: 'ORG_UNIT_NOT_FOUND',
      orgUnitSummary: null
    })
  })

  it('org reference validation / when expected type differs / should reject with org summary for diagnostics', async () => {
    const tenantRepository = createTenantRepositoryMock()
    const orgUnitRepository = createOrgUnitRepositoryMock()
    orgUnitRepository.findById.mockResolvedValue({
      id: 'org-1',
      tenantId: 'tenant-1',
      parentOrgId: null,
      name: 'Operations',
      type: OrgUnitType.DEPARTMENT,
      status: OrgUnitStatus.ACTIVE,
      path: '/org-1',
      depth: 0,
      sortOrder: 0,
      organizationTenantPartyId: null
    })
    const service = new TenantOrgQueryService(tenantRepository as never, orgUnitRepository as never)

    const result = await service.validateOrgReference({
      tenantId: 'tenant-1',
      orgUnitId: 'org-1',
      expectedOrgType: OrgUnitType.TEAM
    })

    expect(result).toEqual({
      valid: false,
      rejectionReason: 'ORG_TYPE_MISMATCH',
      orgUnitSummary: expect.objectContaining({
        id: 'org-1',
        type: OrgUnitType.DEPARTMENT
      })
    })
  })

  it('query API surface / should not expose account-org membership methods', () => {
    const tenantRepository = createTenantRepositoryMock()
    const orgUnitRepository = createOrgUnitRepositoryMock()
    const service = new TenantOrgQueryService(
      tenantRepository as never,
      orgUnitRepository as never
    ) as any

    expect(service.listAccountOrgMemberships).toBeUndefined()
    expect(service.addAccountOrgMembership).toBeUndefined()
    expect(service.setAccountPrimaryOrg).toBeUndefined()
  })
})

describe('TenantOrgQueryService Public Business Card owner fact', () => {
  it('returns active company and same-tenant active department projection', async () => {
    const tenants = createTenantRepositoryMock()
    const orgs = createOrgUnitRepositoryMock()
    tenants.findById.mockResolvedValue({
      id: 'tenant-1',
      name: 'OES Manufacturing',
      status: TenantStatus.ACTIVE,
      websiteUrl: 'https://oes.example'
    })
    orgs.findById.mockResolvedValue({
      id: 'org-1',
      tenantId: 'tenant-1',
      name: 'Enterprise Sales',
      status: OrgUnitStatus.ACTIVE
    })
    const service = new TenantOrgQueryService(tenants as never, orgs as never)
    await expect(
      service.resolvePublicBusinessCardOrganization({ tenantId: 'tenant-1', orgUnitId: 'org-1' })
    ).resolves.toEqual({
      available: true,
      tenantId: 'tenant-1',
      companyDisplayName: 'OES Manufacturing',
      websiteUrl: 'https://oes.example',
      orgUnitId: 'org-1',
      orgUnitDisplayName: 'Enterprise Sales',
      reasonCode: ''
    })
  })

  it('allows an absent optional department selector', async () => {
    const tenants = createTenantRepositoryMock()
    const orgs = createOrgUnitRepositoryMock()
    tenants.findById.mockResolvedValue({
      id: 'tenant-1',
      name: 'OES Manufacturing',
      status: TenantStatus.ACTIVE
    })
    const service = new TenantOrgQueryService(tenants as never, orgs as never)
    await expect(
      service.resolvePublicBusinessCardOrganization({ tenantId: 'tenant-1' })
    ).resolves.toMatchObject({ available: true, orgUnitId: null, orgUnitDisplayName: null })
    expect(orgs.findById).not.toHaveBeenCalled()
  })

  it('fails closed for inactive tenant or a supplied cross-tenant org selector', async () => {
    const tenants = createTenantRepositoryMock()
    const orgs = createOrgUnitRepositoryMock()
    tenants.findById.mockResolvedValue({
      id: 'tenant-1',
      name: 'OES Manufacturing',
      status: TenantStatus.ACTIVE
    })
    orgs.findById.mockResolvedValue({
      id: 'org-1',
      tenantId: 'tenant-2',
      name: 'Foreign org',
      status: OrgUnitStatus.ACTIVE
    })
    const service = new TenantOrgQueryService(tenants as never, orgs as never)
    await expect(
      service.resolvePublicBusinessCardOrganization({ tenantId: 'tenant-1', orgUnitId: 'org-1' })
    ).resolves.toEqual({ available: false, reasonCode: 'ORG_UNIT_UNAVAILABLE' })
    tenants.findById.mockResolvedValue({
      id: 'tenant-1',
      name: 'OES Manufacturing',
      status: TenantStatus.SUSPENDED
    })
    await expect(
      service.resolvePublicBusinessCardOrganization({ tenantId: 'tenant-1' })
    ).resolves.toEqual({ available: false, reasonCode: 'TENANT_UNAVAILABLE' })
  })
})
