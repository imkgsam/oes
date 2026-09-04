import { VerifiedTenantTarget } from '../../common/tenant-target'
import { OrgManagementService } from './org-management.service'

const verifiedTarget = (value: string) => value as VerifiedTenantTarget

// Verifies the gateway org management service preserves organizationTenantPartyId through downstream tenant-org contracts.
describe('OrgManagementService', () => {
  const tenantOrgQueryAdapter = {
    getOrgTreeByTenantId: jest.fn(),
    getOrgUnitByVerifiedTarget: jest.fn(),
    getTenantById: jest.fn(),
    getTenantByVerifiedTarget: jest.fn()
  }
  const partyQueryAdapter = {
    getOrganizationTenantPartyById: jest.fn(),
    getOrganizationTenantPartyByVerifiedTarget: jest.fn()
  }
  const tenantOrgManagementAdapter = {
    archiveOrgUnit: jest.fn(),
    createOrgUnit: jest.fn(),
    moveOrgUnit: jest.fn(),
    updateOrgUnit: jest.fn()
  }

  const service = new OrgManagementService(
    tenantOrgQueryAdapter as any,
    partyQueryAdapter as any,
    tenantOrgManagementAdapter as any
  )

  beforeEach(() => {
    tenantOrgQueryAdapter.getOrgTreeByTenantId.mockReset()
    tenantOrgQueryAdapter.getOrgUnitByVerifiedTarget.mockReset()
    tenantOrgQueryAdapter.getTenantById.mockReset()
    tenantOrgQueryAdapter.getTenantByVerifiedTarget.mockReset()
    partyQueryAdapter.getOrganizationTenantPartyById.mockReset()
    partyQueryAdapter.getOrganizationTenantPartyByVerifiedTarget.mockReset()
    tenantOrgManagementAdapter.archiveOrgUnit.mockReset()
    tenantOrgManagementAdapter.createOrgUnit.mockReset()
    tenantOrgManagementAdapter.moveOrgUnit.mockReset()
    tenantOrgManagementAdapter.updateOrgUnit.mockReset()
  })

  it('getOrgUnitDetail / should hydrate organizationTenantParty summary from party-service when organizationTenantPartyId exists', async () => {
    const source = { requestId: 'req-1', traceId: 'trace-1', user: { scopeLevel: 'SYSTEM' } }
    tenantOrgQueryAdapter.getOrgUnitByVerifiedTarget.mockResolvedValue({
      orgUnit: {
        id: 'org-1',
        tenantId: 'tenant-1',
        parentOrgId: 'root-1',
        name: 'Acme Branch',
        type: 'BRANCH',
        status: 'ACTIVE',
        path: '/root-1/org-1',
        depth: 1,
        sortOrder: 10,
        organizationTenantPartyId: 'party-1'
      }
    })
    partyQueryAdapter.getOrganizationTenantPartyByVerifiedTarget.mockResolvedValue({
      id: 'party-1',
      tenantId: 'tenant-1',
      type: 'ORGANIZATION',
      status: 'ACTIVE',
      legalName: 'Acme Manufacturing Ltd.'
    })

    await expect(
      service.getOrgUnitDetailByVerifiedTarget(verifiedTarget('tenant-1'), 'org-1', source as any)
    ).resolves.toEqual({
      orgUnit: expect.objectContaining({
        id: 'org-1',
        organizationTenantPartyId: 'party-1',
        organizationTenantParty: expect.objectContaining({
          id: 'party-1',
          type: 'ORGANIZATION',
          status: 'ACTIVE',
          legalName: 'Acme Manufacturing Ltd.'
        })
      })
    })

    expect(partyQueryAdapter.getOrganizationTenantPartyByVerifiedTarget).toHaveBeenCalledWith(
      'tenant-1',
      'party-1',
      source
    )
  })

  it('getOrgTree / should hydrate organizationTenantParty summaries for tree nodes with organizationTenantPartyId', async () => {
    const source = { requestId: 'req-1', traceId: 'trace-1', user: { scopeLevel: 'SYSTEM' } }
    tenantOrgQueryAdapter.getTenantByVerifiedTarget.mockResolvedValue({
      tenant: {
        id: 'tenant-1',
        code: 'tenant.alpha',
        name: 'Alpha Tenant',
        rootOrgId: 'org-root-1',
        status: 'ACTIVE'
      }
    })
    tenantOrgQueryAdapter.getOrgTreeByTenantId.mockResolvedValue({
      roots: [
        {
          orgUnit: {
            id: 'org-root-1',
            tenantId: 'tenant-1',
            parentOrgId: undefined,
            name: 'Alpha Root',
            type: 'ROOT',
            status: 'ACTIVE',
            path: '/org-root-1',
            depth: 0,
            sortOrder: 0,
            organizationTenantPartyId: 'party-root-1'
          },
          children: [
            {
              orgUnit: {
                id: 'org-branch-1',
                tenantId: 'tenant-1',
                parentOrgId: 'org-root-1',
                name: 'Alpha Branch',
                type: 'BRANCH',
                status: 'ACTIVE',
                path: '/org-root-1/org-branch-1',
                depth: 1,
                sortOrder: 10,
                organizationTenantPartyId: 'party-branch-1'
              },
              children: []
            },
            {
              orgUnit: {
                id: 'org-dept-1',
                tenantId: 'tenant-1',
                parentOrgId: 'org-root-1',
                name: 'Manufacturing',
                type: 'DEPARTMENT',
                status: 'ACTIVE',
                path: '/org-root-1/org-dept-1',
                depth: 1,
                sortOrder: 20,
                organizationTenantPartyId: undefined
              },
              children: []
            }
          ]
        }
      ]
    })
    partyQueryAdapter.getOrganizationTenantPartyByVerifiedTarget.mockImplementation(
      async (_tenantId: string, tenantPartyId: string) =>
        tenantPartyId === 'party-root-1'
          ? {
              id: 'party-root-1',
              type: 'ORGANIZATION',
              status: 'ACTIVE',
              legalName: 'Alpha Holdings Co.'
            }
          : {
              id: 'party-branch-1',
              type: 'ORGANIZATION',
              status: 'ACTIVE',
              legalName: 'Alpha Shenzhen Branch'
            }
    )

    await expect(service.getOrgTree(verifiedTarget('tenant-1'), source as any)).resolves.toEqual({
      scope: 'SYSTEM',
      tenant: expect.objectContaining({
        id: 'tenant-1',
        name: 'Alpha Tenant'
      }),
      roots: [
        {
          orgUnit: expect.objectContaining({
            id: 'org-root-1',
            organizationTenantPartyId: 'party-root-1',
            organizationTenantParty: expect.objectContaining({
              id: 'party-root-1',
              legalName: 'Alpha Holdings Co.'
            })
          }),
          children: [
            {
              orgUnit: expect.objectContaining({
                id: 'org-branch-1',
                organizationTenantPartyId: 'party-branch-1',
                organizationTenantParty: expect.objectContaining({
                  id: 'party-branch-1',
                  legalName: 'Alpha Shenzhen Branch'
                })
              }),
              children: []
            },
            {
              orgUnit: expect.objectContaining({
                id: 'org-dept-1',
                organizationTenantPartyId: null,
                organizationTenantParty: null
              }),
              children: []
            }
          ]
        }
      ]
    })
  })

  it('updateOrgUnit / should preserve explicit organizationTenantPartyId clear requests', async () => {
    const source = { requestId: 'req-1', traceId: 'trace-1', user: { scopeLevel: 'SYSTEM' } }
    tenantOrgManagementAdapter.updateOrgUnit.mockResolvedValue({
      orgUnit: {
        id: 'org-1',
        tenantId: 'tenant-1',
        parentOrgId: 'root-1',
        name: 'Acme Branch',
        type: 'BRANCH',
        status: 'ACTIVE',
        path: '/root-1/org-1',
        depth: 1,
        sortOrder: 10,
        organizationTenantPartyId: undefined
      }
    })

    await expect(
      service.updateOrgUnit(
        verifiedTarget('tenant-1'),
        'org-1',
        {
          organizationTenantPartyId: null
        },
        source as any
      )
    ).resolves.toEqual({
      orgUnit: expect.objectContaining({
        id: 'org-1',
        organizationTenantPartyId: null
      })
    })

    expect(tenantOrgManagementAdapter.updateOrgUnit).toHaveBeenCalledWith(
      {
        tenantId: 'tenant-1',
        orgUnitId: 'org-1',
        name: undefined,
        type: undefined,
        sortOrder: undefined,
        organizationTenantPartyId: null
      },
      source
    )
  })

  it('moveOrgUnit / should forward a bounded move command to tenant-org-service', async () => {
    const source = { requestId: 'req-1', traceId: 'trace-1', user: { scopeLevel: 'SYSTEM' } }
    tenantOrgManagementAdapter.moveOrgUnit.mockResolvedValue({
      orgUnit: {
        id: 'org-1',
        tenantId: 'tenant-1',
        parentOrgId: 'org-parent-2',
        name: 'Manufacturing',
        type: 'DEPARTMENT',
        status: 'ACTIVE',
        path: '/root-1/org-parent-2/org-1',
        depth: 2,
        sortOrder: 10,
        organizationTenantPartyId: undefined
      }
    })

    await expect(
      service.moveOrgUnit(
        verifiedTarget('tenant-1'),
        'org-1',
        {
          newParentOrgId: 'org-parent-2'
        },
        source as any
      )
    ).resolves.toEqual({
      orgUnit: expect.objectContaining({
        id: 'org-1',
        parentOrgId: 'org-parent-2'
      })
    })

    expect(tenantOrgManagementAdapter.moveOrgUnit).toHaveBeenCalledWith(
      {
        tenantId: 'tenant-1',
        orgUnitId: 'org-1',
        newParentOrgId: 'org-parent-2'
      },
      source
    )
  })
})
