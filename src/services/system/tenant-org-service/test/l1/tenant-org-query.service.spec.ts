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
      organizationPartyId: null
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
