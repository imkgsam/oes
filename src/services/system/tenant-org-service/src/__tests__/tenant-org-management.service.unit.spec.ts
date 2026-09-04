import { BadRequestException } from '@nestjs/common'
import { TenantOrgManagementService } from '../application/services/tenant-org-management.service'
import { OrgUnitStatus, OrgUnitType, TenantStatus } from '../domain/value-objects'

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

/** createOrganizationTenantPartyReaderMock builds the downstream party lookup double for org-party validation tests. */
function createOrganizationTenantPartyReaderMock() {
  return {
    getOrganizationTenantPartyById: jest.fn()
  }
}

/** createAuthSessionRevocationPortMock builds the downstream auth session revocation double for tenant lifecycle tests. */
function createAuthSessionRevocationPortMock() {
  return {
    revokeTenantSessions: jest.fn()
  }
}

describe('TenantOrgManagementService', () => {
  it('suspendTenant / should revoke tenant-scope sessions through auth-service after status changes', async () => {
    const tenantRepository = createTenantRepositoryMock()
    const orgUnitRepository = createOrgUnitRepositoryMock()
    const organizationTenantPartyReader = createOrganizationTenantPartyReaderMock()
    const authSessionRevocationPort = createAuthSessionRevocationPortMock()
    tenantRepository.setStatus.mockResolvedValue({
      id: 'tenant-1',
      code: 'acme',
      name: 'Acme',
      status: TenantStatus.SUSPENDED,
      rootOrgId: 'root-1'
    })
    const service = new TenantOrgManagementService(
      tenantRepository as never,
      orgUnitRepository as never,
      organizationTenantPartyReader as never,
      authSessionRevocationPort as never
    )

    await expect(service.suspendTenant({ tenantId: 'tenant-1' })).resolves.toMatchObject({
      status: TenantStatus.SUSPENDED
    })

    expect(authSessionRevocationPort.revokeTenantSessions).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      reason: 'TENANT_SUSPENDED'
    })
  })

  it('archiveTenant / should revoke tenant-scope sessions through auth-service after status changes', async () => {
    const tenantRepository = createTenantRepositoryMock()
    const orgUnitRepository = createOrgUnitRepositoryMock()
    const organizationTenantPartyReader = createOrganizationTenantPartyReaderMock()
    const authSessionRevocationPort = createAuthSessionRevocationPortMock()
    tenantRepository.setStatus.mockResolvedValue({
      id: 'tenant-1',
      code: 'acme',
      name: 'Acme',
      status: TenantStatus.ARCHIVED,
      rootOrgId: 'root-1'
    })
    const service = new TenantOrgManagementService(
      tenantRepository as never,
      orgUnitRepository as never,
      organizationTenantPartyReader as never,
      authSessionRevocationPort as never
    )

    await expect(service.archiveTenant({ tenantId: 'tenant-1' })).resolves.toMatchObject({
      status: TenantStatus.ARCHIVED
    })

    expect(authSessionRevocationPort.revokeTenantSessions).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      reason: 'TENANT_ARCHIVED'
    })
  })

  it('reactivateTenant / should not restore or revoke existing sessions', async () => {
    const tenantRepository = createTenantRepositoryMock()
    const orgUnitRepository = createOrgUnitRepositoryMock()
    const organizationTenantPartyReader = createOrganizationTenantPartyReaderMock()
    const authSessionRevocationPort = createAuthSessionRevocationPortMock()
    tenantRepository.setStatus.mockResolvedValue({
      id: 'tenant-1',
      code: 'acme',
      name: 'Acme',
      status: TenantStatus.ACTIVE,
      rootOrgId: 'root-1'
    })
    const service = new TenantOrgManagementService(
      tenantRepository as never,
      orgUnitRepository as never,
      organizationTenantPartyReader as never,
      authSessionRevocationPort as never
    )

    await expect(service.reactivateTenant({ tenantId: 'tenant-1' })).resolves.toMatchObject({
      status: TenantStatus.ACTIVE
    })

    expect(authSessionRevocationPort.revokeTenantSessions).not.toHaveBeenCalled()
  })

  it('createTenant / should return tenant and root org from the transactional repository', async () => {
    const tenantRepository = createTenantRepositoryMock()
    const orgUnitRepository = createOrgUnitRepositoryMock()
    const organizationTenantPartyReader = createOrganizationTenantPartyReaderMock()
    tenantRepository.createWithRootOrg.mockResolvedValue({
      tenant: {
        id: 'tenant-1',
        code: 'acme',
        employeeCodePrefix: '0AF',
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
        organizationTenantPartyId: null
      }
    })
    const service = new TenantOrgManagementService(
      tenantRepository as never,
      orgUnitRepository as never,
      organizationTenantPartyReader as never,
      createAuthSessionRevocationPortMock() as never
    )

    const result = await service.createTenant({ code: 'acme', employeeCodePrefix: '0af', name: 'Acme' })

    expect(tenantRepository.createWithRootOrg).toHaveBeenCalledWith({
      code: 'acme',
      employeeCodePrefix: '0AF',
      name: 'Acme',
      rootOrgName: 'Acme'
    })
    expect(result.rootOrgUnit.id).toBe('root-1')
  })

  it('updateTenantProfile / should persist the tenant public website URL', async () => {
    const tenantRepository = createTenantRepositoryMock()
    const orgUnitRepository = createOrgUnitRepositoryMock()
    const organizationTenantPartyReader = createOrganizationTenantPartyReaderMock()
    tenantRepository.updateProfile.mockResolvedValue({
      id: 'tenant-1',
      code: 'acme',
      employeeCodePrefix: '0AF',
      name: 'Acme',
      status: TenantStatus.ACTIVE,
      rootOrgId: 'root-1',
      websiteUrl: 'https://www.acme.example'
    })
    const service = new TenantOrgManagementService(
      tenantRepository as never,
      orgUnitRepository as never,
      organizationTenantPartyReader as never,
      createAuthSessionRevocationPortMock() as never
    )

    await service.updateTenantProfile({
      tenantId: 'tenant-1',
      name: 'Acme',
      websiteUrl: ' https://www.acme.example '
    } as never)

    expect(tenantRepository.updateProfile).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      name: 'Acme',
      code: undefined,
      employeeCodePrefix: undefined,
      websiteUrl: 'https://www.acme.example'
    })
  })

  it('createOrgUnit / when tenant is suspended / should reject new org units', async () => {
    const tenantRepository = createTenantRepositoryMock()
    const orgUnitRepository = createOrgUnitRepositoryMock()
    const organizationTenantPartyReader = createOrganizationTenantPartyReaderMock()
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
      organizationTenantPartyReader as never,
      createAuthSessionRevocationPortMock() as never
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
    const organizationTenantPartyReader = createOrganizationTenantPartyReaderMock()
    orgUnitRepository.move.mockRejectedValue(
      new BadRequestException('Cannot move org unit below its descendant')
    )
    const service = new TenantOrgManagementService(
      tenantRepository as never,
      orgUnitRepository as never,
      organizationTenantPartyReader as never,
      createAuthSessionRevocationPortMock() as never
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
    const organizationTenantPartyReader = createOrganizationTenantPartyReaderMock()
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
      organizationTenantPartyReader as never,
      createAuthSessionRevocationPortMock() as never
    )

    await expect(
      service.createOrgUnit({
        tenantId: 'tenant-1',
        parentOrgId: 'root-1',
        name: 'Ops',
        type: OrgUnitType.DEPARTMENT,
        organizationTenantPartyId: 'party-1'
      })
    ).rejects.toBeInstanceOf(BadRequestException)

    expect(organizationTenantPartyReader.getOrganizationTenantPartyById).not.toHaveBeenCalled()
    expect(orgUnitRepository.create).not.toHaveBeenCalled()
  })

  it('createOrgUnit / when root binds active organization party / should validate and persist association', async () => {
    const tenantRepository = createTenantRepositoryMock()
    const orgUnitRepository = createOrgUnitRepositoryMock()
    const organizationTenantPartyReader = createOrganizationTenantPartyReaderMock()
    tenantRepository.findById.mockResolvedValue({
      id: 'tenant-1',
      code: 'acme',
      name: 'Acme',
      status: TenantStatus.ACTIVE,
      rootOrgId: 'root-1'
    })
    organizationTenantPartyReader.getOrganizationTenantPartyById.mockResolvedValue({
      id: 'party-1',
      tenantId: 'tenant-1',
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
      organizationTenantPartyId: 'party-1'
    })
    const service = new TenantOrgManagementService(
      tenantRepository as never,
      orgUnitRepository as never,
      organizationTenantPartyReader as never,
      createAuthSessionRevocationPortMock() as never
    )

    await expect(
      service.createOrgUnit({
        tenantId: 'tenant-1',
        parentOrgId: 'root-1',
        name: 'Acme Legal',
        type: OrgUnitType.ROOT,
        organizationTenantPartyId: 'party-1'
      })
    ).resolves.toEqual(
      expect.objectContaining({
        id: 'org-1',
        organizationTenantPartyId: 'party-1'
      })
    )

    expect(organizationTenantPartyReader.getOrganizationTenantPartyById).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      tenantPartyId: 'party-1'
    })
    expect(orgUnitRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationTenantPartyId: 'party-1'
      })
    )
  })
})
