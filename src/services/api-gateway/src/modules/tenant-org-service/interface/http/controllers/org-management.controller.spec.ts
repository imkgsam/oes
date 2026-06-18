import { Reflector } from '@nestjs/core'
import { REQUIRE_PERMISSIONS_METADATA_KEY } from '@oes/common/authorization'
import { OrgManagementController } from './org-management.controller'

// Verifies the org-management gateway controller keeps org tree endpoints aligned with tenant-org management permissions.
describe('OrgManagementController', () => {
  const orgManagementService = {
    archiveOrgUnit: jest.fn(),
    createOrgUnit: jest.fn(),
    getOrgTree: jest.fn(),
    getOrgUnitDetail: jest.fn(),
    moveOrgUnit: jest.fn(),
    updateOrgUnit: jest.fn()
  }

  const controller = new OrgManagementController(orgManagementService as any)

  it('declares the expected coarse-grained permissions on org management endpoints', () => {
    const reflector = new Reflector()

    expect(
      reflector.get(REQUIRE_PERMISSIONS_METADATA_KEY, OrgManagementController.prototype.getOrgTree)
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        OrgManagementController.prototype.getOrgUnitDetail
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        OrgManagementController.prototype.createOrgUnit
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        OrgManagementController.prototype.updateOrgUnit
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        OrgManagementController.prototype.moveOrgUnit
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        OrgManagementController.prototype.archiveOrgUnit
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
  })

  it('forwards read and write requests to the org management service', async () => {
    const source = { requestId: 'req-1', traceId: 'trace-1', user: { scopeLevel: 'SYSTEM' } }
    orgManagementService.getOrgTree.mockResolvedValue({
      scope: 'SYSTEM',
      tenant: { id: 'tenant-1', name: 'Alpha Tenant' },
      roots: []
    })
    orgManagementService.getOrgUnitDetail.mockResolvedValue({
      orgUnit: { id: 'org-1', name: 'Alpha Root', type: 'ROOT' }
    })
    orgManagementService.createOrgUnit.mockResolvedValue({
      orgUnit: {
        id: 'org-2',
        name: 'Manufacturing',
        type: 'BRANCH',
        organizationTenantPartyId: 'party-1'
      }
    })
    orgManagementService.updateOrgUnit.mockResolvedValue({
      orgUnit: {
        id: 'org-2',
        name: 'Manufacturing Updated',
        type: 'BRANCH',
        organizationTenantPartyId: null
      }
    })
    orgManagementService.moveOrgUnit.mockResolvedValue({
      orgUnit: {
        id: 'org-2',
        name: 'Manufacturing Updated',
        parentOrgId: 'org-3',
        type: 'BRANCH'
      }
    })
    orgManagementService.archiveOrgUnit.mockResolvedValue({
      orgUnit: { id: 'org-2', name: 'Manufacturing Updated', status: 'ARCHIVED' }
    })

    await expect(controller.getOrgTree('tenant-1', source as any)).resolves.toEqual({
      scope: 'SYSTEM',
      tenant: { id: 'tenant-1', name: 'Alpha Tenant' },
      roots: []
    })
    await expect(controller.getOrgUnitDetail('tenant-1', 'org-1', source as any)).resolves.toEqual({
      orgUnit: { id: 'org-1', name: 'Alpha Root', type: 'ROOT' }
    })
    await expect(
      controller.createOrgUnit(
        'tenant-1',
        {
          name: 'Manufacturing',
          parentOrgId: 'org-1',
          organizationTenantPartyId: 'party-1',
          sortOrder: 10,
          type: 'BRANCH'
        } as any,
        source as any
      )
    ).resolves.toEqual({
      orgUnit: {
        id: 'org-2',
        name: 'Manufacturing',
        type: 'BRANCH',
        organizationTenantPartyId: 'party-1'
      }
    })
    await expect(
      controller.updateOrgUnit(
        'tenant-1',
        'org-2',
        {
          name: 'Manufacturing Updated',
          organizationTenantPartyId: null,
          sortOrder: 11
        } as any,
        source as any
      )
    ).resolves.toEqual({
      orgUnit: {
        id: 'org-2',
        name: 'Manufacturing Updated',
        type: 'BRANCH',
        organizationTenantPartyId: null
      }
    })
    await expect(
      controller.moveOrgUnit(
        'tenant-1',
        'org-2',
        {
          newParentOrgId: 'org-3'
        } as any,
        source as any
      )
    ).resolves.toEqual({
      orgUnit: {
        id: 'org-2',
        name: 'Manufacturing Updated',
        parentOrgId: 'org-3',
        type: 'BRANCH'
      }
    })
    await expect(controller.archiveOrgUnit('tenant-1', 'org-2', source as any)).resolves.toEqual({
      orgUnit: { id: 'org-2', name: 'Manufacturing Updated', status: 'ARCHIVED' }
    })

    expect(orgManagementService.getOrgTree).toHaveBeenCalledWith('tenant-1', source)
    expect(orgManagementService.getOrgUnitDetail).toHaveBeenCalledWith('tenant-1', 'org-1', source)
    expect(orgManagementService.createOrgUnit).toHaveBeenCalledWith(
      'tenant-1',
      {
        name: 'Manufacturing',
        parentOrgId: 'org-1',
        organizationTenantPartyId: 'party-1',
        sortOrder: 10,
        type: 'BRANCH'
      },
      source
    )
    expect(orgManagementService.updateOrgUnit).toHaveBeenCalledWith(
      'tenant-1',
      'org-2',
      {
        name: 'Manufacturing Updated',
        organizationTenantPartyId: null,
        sortOrder: 11,
        type: undefined
      },
      source
    )
    expect(orgManagementService.moveOrgUnit).toHaveBeenCalledWith(
      'tenant-1',
      'org-2',
      {
        newParentOrgId: 'org-3'
      },
      source
    )
    expect(orgManagementService.archiveOrgUnit).toHaveBeenCalledWith('tenant-1', 'org-2', source)
  })
})
