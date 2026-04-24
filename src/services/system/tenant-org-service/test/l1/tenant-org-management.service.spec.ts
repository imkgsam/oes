import { BadRequestException } from '@nestjs/common'
import { TenantOrgManagementService } from '../../src/application/services/tenant-org-management.service'
import { OrgUnitStatus, OrgUnitType, TenantStatus } from '../../src/domain/value-objects'

/** createTenantRepositoryMock builds the tenant repository double for management service behavior tests. */
function createTenantRepositoryMock() {
  return {
    createWithRootOrg: jest.fn(),
    findById: jest.fn(),
    list: jest.fn(),
    updateProfile: jest.fn(),
    setStatus: jest.fn()
  }
}

/** createOrgUnitRepositoryMock builds the org unit repository double for management service behavior tests. */
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

/** createOrganizationPartyReaderMock builds the downstream party lookup double for org-party validation tests. */
function createOrganizationPartyReaderMock() {
  return {
    getOrganizationPartyById: jest.fn()
  }
}

describe('TenantOrgManagementService', () => {
  it('createTenant / should return tenant and root org from the transactional repository', async () => {
    const tenantRepository = createTenantRepositoryMock()
    const orgUnitRepository = createOrgUnitRepositoryMock()
    const organizationPartyReader = createOrganizationPartyReaderMock()
    tenantRepository.createWithRootOrg.mockResolvedValue({
      tenant: {
        id: 'tenant-1',
        code: 'acme',
        name: 'Acme',
        status: TenantStatus.ACTIVE,
        rootOrgId: 'root-1'
      },
      rootOrgUnit: {
        id: 'root-1',
        tenantId: 'tenant-1',
        parentOrgId: null,
        name: 'Acme',
        type: OrgUnitType.ROOT,
        status: OrgUnitStatus.ACTIVE,
        path: '/root-1',
        depth: 0,
        sortOrder: 0,
        organizationPartyId: null
      }
    })
    const service = new TenantOrgManagementService(
      tenantRepository as never,
      orgUnitRepository as never,
      organizationPartyReader as never
    )

    const result = await service.createTenant({ code: 'acme', name: 'Acme' })

    expect(tenantRepository.createWithRootOrg).toHaveBeenCalledWith({
      code: 'acme',
      name: 'Acme',
      rootOrgName: 'Acme'
    })
    expect(result.rootOrgUnit.id).toBe('root-1')
  })

  it('createOrgUnit / when tenant is suspended / should reject new org units', async () => {
    const tenantRepository = createTenantRepositoryMock()
    const orgUnitRepository = createOrgUnitRepositoryMock()
    const organizationPartyReader = createOrganizationPartyReaderMock()
    tenantRepository.findById.mockResolvedValue({
      id: 'tenant-1',
      code: 'acme',
      name: 'Acme',
      status: TenantStatus.SUSPENDED,
      rootOrgId: 'root-1'
    })
    const service = new TenantOrgManagementService(
      tenantRepository as never,
      orgUnitRepository as never,
      organizationPartyReader as never
    )

    await expect(
      service.createOrgUnit({
        tenantId: 'tenant-1',
        parentOrgId: 'root-1',
        name: 'Sales',
        type: OrgUnitType.DEPARTMENT
      })
    ).rejects.toBeInstanceOf(BadRequestException)
    expect(orgUnitRepository.create).not.toHaveBeenCalled()
  })

  it('moveOrgUnit / should delegate cycle detection to the org repository', async () => {
    const tenantRepository = createTenantRepositoryMock()
    const orgUnitRepository = createOrgUnitRepositoryMock()
    const organizationPartyReader = createOrganizationPartyReaderMock()
    orgUnitRepository.move.mockRejectedValue(
      new BadRequestException('Cannot move org unit below its descendant')
    )
    const service = new TenantOrgManagementService(
      tenantRepository as never,
      orgUnitRepository as never,
      organizationPartyReader as never
    )

    await expect(
      service.moveOrgUnit({
        tenantId: 'tenant-1',
        orgUnitId: 'root-1',
        newParentOrgId: 'child-1'
      })
    ).rejects.toBeInstanceOf(BadRequestException)
  })

  it('createOrgUnit / when department tries to bind organization party / should reject before persistence', async () => {
    const tenantRepository = createTenantRepositoryMock()
    const orgUnitRepository = createOrgUnitRepositoryMock()
    const organizationPartyReader = createOrganizationPartyReaderMock()
    tenantRepository.findById.mockResolvedValue({
      id: 'tenant-1',
      code: 'acme',
      name: 'Acme',
      status: TenantStatus.ACTIVE,
      rootOrgId: 'root-1'
    })
    const service = new TenantOrgManagementService(
      tenantRepository as never,
      orgUnitRepository as never,
      organizationPartyReader as never
    )

    await expect(
      service.createOrgUnit({
        tenantId: 'tenant-1',
        parentOrgId: 'root-1',
        name: 'Ops',
        type: OrgUnitType.DEPARTMENT,
        organizationPartyId: 'party-1'
      })
    ).rejects.toBeInstanceOf(BadRequestException)

    expect(organizationPartyReader.getOrganizationPartyById).not.toHaveBeenCalled()
    expect(orgUnitRepository.create).not.toHaveBeenCalled()
  })

  it('createOrgUnit / when root binds active organization party / should validate and persist association', async () => {
    const tenantRepository = createTenantRepositoryMock()
    const orgUnitRepository = createOrgUnitRepositoryMock()
    const organizationPartyReader = createOrganizationPartyReaderMock()
    tenantRepository.findById.mockResolvedValue({
      id: 'tenant-1',
      code: 'acme',
      name: 'Acme',
      status: TenantStatus.ACTIVE,
      rootOrgId: 'root-1'
    })
    organizationPartyReader.getOrganizationPartyById.mockResolvedValue({
      id: 'party-1',
      type: 'ORGANIZATION',
      status: 'ACTIVE'
    })
    orgUnitRepository.create.mockResolvedValue({
      id: 'org-1',
      tenantId: 'tenant-1',
      parentOrgId: 'root-1',
      name: 'Acme Legal',
      type: OrgUnitType.ROOT,
      status: OrgUnitStatus.ACTIVE,
      path: '/root-1/org-1',
      depth: 1,
      sortOrder: 0,
      organizationPartyId: 'party-1'
    })
    const service = new TenantOrgManagementService(
      tenantRepository as never,
      orgUnitRepository as never,
      organizationPartyReader as never
    )

    await expect(
      service.createOrgUnit({
        tenantId: 'tenant-1',
        parentOrgId: 'root-1',
        name: 'Acme Legal',
        type: OrgUnitType.ROOT,
        organizationPartyId: 'party-1'
      })
    ).resolves.toEqual(
      expect.objectContaining({
        id: 'org-1',
        organizationPartyId: 'party-1'
      })
    )

    expect(organizationPartyReader.getOrganizationPartyById).toHaveBeenCalledWith('party-1')
    expect(orgUnitRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationPartyId: 'party-1'
      })
    )
  })
})
