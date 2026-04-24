import { ForbiddenException, NotFoundException } from '@nestjs/common'
import { OrgManagementService } from './org-management.service'
import { TenantManagementService } from './tenant-management.service'

// Verifies the tenant management gateway service stays system-scoped while composing tenant and root-org read models.
describe('TenantManagementService', () => {
  const tenantOrgQueryAdapter = {
    getOrgUnitById: jest.fn(),
    getTenantById: jest.fn(),
    listTenants: jest.fn()
  }
  const tenantOrgManagementAdapter = {
    archiveTenant: jest.fn(),
    createTenant: jest.fn(),
    reactivateTenant: jest.fn(),
    suspendTenant: jest.fn(),
    updateTenantProfile: jest.fn()
  }

  const service = new TenantManagementService(
    tenantOrgQueryAdapter as any,
    tenantOrgManagementAdapter as any
  )

  beforeEach(() => {
    tenantOrgQueryAdapter.getOrgUnitById.mockReset()
    tenantOrgQueryAdapter.getTenantById.mockReset()
    tenantOrgQueryAdapter.listTenants.mockReset()
    tenantOrgManagementAdapter.archiveTenant.mockReset()
    tenantOrgManagementAdapter.createTenant.mockReset()
    tenantOrgManagementAdapter.reactivateTenant.mockReset()
    tenantOrgManagementAdapter.suspendTenant.mockReset()
    tenantOrgManagementAdapter.updateTenantProfile.mockReset()
  })

  it('rejects tenant-scoped operators before calling downstream tenant management contracts', async () => {
    const tenantScopedSource = {
      requestId: 'req-1',
      traceId: 'trace-1',
      user: { aid: 'account-1', scopeLevel: 'TENANT', tid: 'tenant-1' }
    }

    await expect(service.listTenants({}, tenantScopedSource as any)).rejects.toBeInstanceOf(
      ForbiddenException
    )
    await expect(service.createTenant({ code: 'alpha', name: 'Alpha' }, tenantScopedSource as any)).rejects.toBeInstanceOf(
      ForbiddenException
    )

    expect(tenantOrgQueryAdapter.listTenants).not.toHaveBeenCalled()
    expect(tenantOrgManagementAdapter.createTenant).not.toHaveBeenCalled()
  })

  it('lists tenant summaries for system operators', async () => {
    const source = { requestId: 'req-1', traceId: 'trace-1', user: { aid: 'account-1', scopeLevel: 'SYSTEM' } }
    tenantOrgQueryAdapter.listTenants.mockResolvedValue({
      tenants: [{ id: 'tenant-1', code: 'alpha', name: 'Alpha Tenant', isActive: true, rootOrgId: 'org-root-1' }],
      total: 1
    })

    await expect(
      service.listTenants(
        {
          keyword: 'alpha',
          page: 2,
          pageSize: 20,
          status: 'ACTIVE'
        },
        source as any
      )
    ).resolves.toEqual({
      items: [
        {
          id: 'tenant-1',
          code: 'alpha',
          name: 'Alpha Tenant',
          rootOrgId: 'org-root-1',
          status: 'ACTIVE'
        }
      ],
      page: 2,
      pageSize: 20,
      total: 1
    })

    expect(tenantOrgQueryAdapter.listTenants).toHaveBeenCalledWith(
      {
        keyword: 'alpha',
        page: 2,
        pageSize: 20,
        status: 'ACTIVE'
      },
      source
    )
  })

  it('hydrates one tenant detail with root org metadata when the tenant exists', async () => {
    const source = { requestId: 'req-1', traceId: 'trace-1', user: { aid: 'account-1', scopeLevel: 'SYSTEM' } }
    tenantOrgQueryAdapter.getTenantById.mockResolvedValue({
      tenant: {
        id: 'tenant-1',
        code: 'alpha',
        name: 'Alpha Tenant',
        isActive: false,
        rootOrgId: 'org-root-1'
      }
    })
    tenantOrgQueryAdapter.getOrgUnitById.mockResolvedValue({
      orgUnit: {
        id: 'org-root-1',
        name: 'Alpha Root'
      }
    })

    await expect(service.getTenantById('tenant-1', source as any)).resolves.toEqual({
      tenant: {
        id: 'tenant-1',
        code: 'alpha',
        name: 'Alpha Tenant',
        rootOrgId: 'org-root-1',
        rootOrgName: 'Alpha Root',
        status: 'SUSPENDED'
      }
    })

    expect(tenantOrgQueryAdapter.getTenantById).toHaveBeenCalledWith('tenant-1', source)
    expect(tenantOrgQueryAdapter.getOrgUnitById).toHaveBeenCalledWith(
      {
        orgUnitId: 'org-root-1',
        tenantId: 'tenant-1'
      },
      source
    )
  })

  it('throws when the requested tenant does not exist', async () => {
    const source = { requestId: 'req-1', traceId: 'trace-1', user: { aid: 'account-1', scopeLevel: 'SYSTEM' } }
    tenantOrgQueryAdapter.getTenantById.mockResolvedValue({ tenant: undefined })

    await expect(service.getTenantById('missing-tenant', source as any)).rejects.toBeInstanceOf(
      NotFoundException
    )
  })

  it('forwards tenant lifecycle writes to the dedicated management adapter', async () => {
    const source = { requestId: 'req-1', traceId: 'trace-1', user: { aid: 'account-1', scopeLevel: 'SYSTEM' } }
    tenantOrgManagementAdapter.createTenant.mockResolvedValue({
      tenant: { id: 'tenant-1', code: 'alpha', name: 'Alpha Tenant', status: 'ACTIVE' },
      rootOrgUnit: { id: 'org-root-1', name: 'Alpha Root' }
    })
    tenantOrgManagementAdapter.updateTenantProfile.mockResolvedValue({
      tenant: { id: 'tenant-1', code: 'alpha-new', name: 'Alpha Tenant New', status: 'ACTIVE' }
    })
    tenantOrgManagementAdapter.suspendTenant.mockResolvedValue({
      tenant: { id: 'tenant-1', code: 'alpha', name: 'Alpha Tenant', status: 'SUSPENDED' }
    })
    tenantOrgManagementAdapter.reactivateTenant.mockResolvedValue({
      tenant: { id: 'tenant-1', code: 'alpha', name: 'Alpha Tenant', status: 'ACTIVE' }
    })
    tenantOrgManagementAdapter.archiveTenant.mockResolvedValue({
      tenant: { id: 'tenant-1', code: 'alpha', name: 'Alpha Tenant', status: 'ARCHIVED' }
    })

    await expect(
      service.createTenant(
        {
          code: 'alpha',
          name: 'Alpha Tenant',
          rootOrgName: 'Alpha Root'
        },
        source as any
      )
    ).resolves.toEqual({
      tenant: { id: 'tenant-1', code: 'alpha', name: 'Alpha Tenant', status: 'ACTIVE' },
      rootOrgUnit: { id: 'org-root-1', name: 'Alpha Root' }
    })

    await expect(
      service.updateTenantProfile(
        'tenant-1',
        {
          code: 'alpha-new',
          name: 'Alpha Tenant New'
        },
        source as any
      )
    ).resolves.toEqual({
      tenant: { id: 'tenant-1', code: 'alpha-new', name: 'Alpha Tenant New', status: 'ACTIVE' }
    })

    await expect(
      service.updateTenantStatus(
        'tenant-1',
        {
          reason: 'Manual review',
          status: 'SUSPENDED'
        },
        source as any
      )
    ).resolves.toEqual({
      tenant: { id: 'tenant-1', code: 'alpha', name: 'Alpha Tenant', status: 'SUSPENDED' }
    })

    await expect(
      service.updateTenantStatus(
        'tenant-1',
        {
          status: 'ACTIVE'
        },
        source as any
      )
    ).resolves.toEqual({
      tenant: { id: 'tenant-1', code: 'alpha', name: 'Alpha Tenant', status: 'ACTIVE' }
    })

    await expect(
      service.updateTenantStatus(
        'tenant-1',
        {
          reason: 'Duplicate tenant',
          status: 'ARCHIVED'
        },
        source as any
      )
    ).resolves.toEqual({
      tenant: { id: 'tenant-1', code: 'alpha', name: 'Alpha Tenant', status: 'ARCHIVED' }
    })

    expect(tenantOrgManagementAdapter.createTenant).toHaveBeenCalledWith(
      {
        code: 'alpha',
        name: 'Alpha Tenant',
        rootOrgName: 'Alpha Root'
      },
      source
    )
    expect(tenantOrgManagementAdapter.updateTenantProfile).toHaveBeenCalledWith(
      {
        code: 'alpha-new',
        name: 'Alpha Tenant New',
        tenantId: 'tenant-1'
      },
      source
    )
    expect(tenantOrgManagementAdapter.suspendTenant).toHaveBeenCalledWith(
      {
        reason: 'Manual review',
        tenantId: 'tenant-1'
      },
      source
    )
    expect(tenantOrgManagementAdapter.reactivateTenant).toHaveBeenCalledWith(
      {
        tenantId: 'tenant-1'
      },
      source
    )
    expect(tenantOrgManagementAdapter.archiveTenant).toHaveBeenCalledWith(
      {
        reason: 'Duplicate tenant',
        tenantId: 'tenant-1'
      },
      source
    )
  })
})

// Verifies the org management gateway service keeps org tree operations scope-aware while reusing tenant-org-service contracts.
describe('OrgManagementService', () => {
  const tenantOrgQueryAdapter = {
    getOrgTreeByTenantId: jest.fn(),
    getOrgUnitById: jest.fn(),
    getTenantById: jest.fn()
  }
  const partyQueryAdapter = {
    getPartyById: jest.fn()
  }
  const tenantOrgManagementAdapter = {
    archiveOrgUnit: jest.fn(),
    createOrgUnit: jest.fn(),
    updateOrgUnit: jest.fn()
  }

  const service = new OrgManagementService(
    tenantOrgQueryAdapter as any,
    partyQueryAdapter as any,
    tenantOrgManagementAdapter as any
  )

  beforeEach(() => {
    tenantOrgQueryAdapter.getOrgTreeByTenantId.mockReset()
    tenantOrgQueryAdapter.getOrgUnitById.mockReset()
    tenantOrgQueryAdapter.getTenantById.mockReset()
    partyQueryAdapter.getPartyById.mockReset()
    tenantOrgManagementAdapter.archiveOrgUnit.mockReset()
    tenantOrgManagementAdapter.createOrgUnit.mockReset()
    tenantOrgManagementAdapter.updateOrgUnit.mockReset()
  })

  it('lets tenant-scoped operators manage only their own tenant org tree', async () => {
    const tenantSource = {
      requestId: 'req-1',
      traceId: 'trace-1',
      user: { aid: 'account-1', scopeLevel: 'TENANT', tid: 'tenant-1' }
    }
    tenantOrgQueryAdapter.getOrgTreeByTenantId.mockResolvedValue({
      roots: [
        {
          children: [],
          orgUnit: {
            id: 'org-root-1',
            tenantId: 'tenant-1',
            parentOrgId: undefined,
            name: 'Alpha Root',
            type: 'ROOT',
            status: 'ACTIVE',
            path: '/org-root-1',
            sortOrder: 0
          }
        }
      ]
    })
    tenantOrgQueryAdapter.getOrgUnitById.mockResolvedValue({
      orgUnit: {
        id: 'org-root-1',
        tenantId: 'tenant-1',
        parentOrgId: undefined,
        name: 'Alpha Root',
        type: 'ROOT',
        status: 'ACTIVE',
        path: '/org-root-1',
        sortOrder: 0
      }
    })
    tenantOrgManagementAdapter.createOrgUnit.mockResolvedValue({
      orgUnit: {
        id: 'org-child-1',
        tenantId: 'tenant-1',
        parentOrgId: 'org-root-1',
        name: 'Manufacturing',
        type: 'DEPARTMENT',
        status: 'ACTIVE',
        path: '/org-root-1/org-child-1',
        sortOrder: 10
      }
    })

    await expect(service.getOrgTree('tenant-1', tenantSource as any)).resolves.toEqual({
      scope: 'TENANT',
      tenant: undefined,
      roots: [
        {
          children: [],
          orgUnit: {
            depth: 0,
            id: 'org-root-1',
            name: 'Alpha Root',
            organizationParty: null,
            organizationPartyId: null,
            parentOrgId: undefined,
            path: '/org-root-1',
            sortOrder: 0,
            status: 'ACTIVE',
            tenantId: 'tenant-1',
            type: 'ROOT'
          }
        }
      ]
    })

    await expect(service.getOrgUnitDetail('tenant-1', 'org-root-1', tenantSource as any)).resolves.toEqual({
      orgUnit: {
        depth: 0,
        id: 'org-root-1',
        name: 'Alpha Root',
        organizationParty: null,
        organizationPartyId: null,
        parentOrgId: undefined,
        path: '/org-root-1',
        sortOrder: 0,
        status: 'ACTIVE',
        tenantId: 'tenant-1',
        type: 'ROOT'
      }
    })

    await expect(
      service.createOrgUnit(
        'tenant-1',
        {
          name: 'Manufacturing',
          parentOrgId: 'org-root-1',
          sortOrder: 10,
          type: 'DEPARTMENT'
        },
        tenantSource as any
      )
    ).resolves.toEqual({
      orgUnit: {
        depth: 0,
        id: 'org-child-1',
        name: 'Manufacturing',
        organizationParty: null,
        organizationPartyId: null,
        parentOrgId: 'org-root-1',
        path: '/org-root-1/org-child-1',
        sortOrder: 10,
        status: 'ACTIVE',
        tenantId: 'tenant-1',
        type: 'DEPARTMENT'
      }
    })

    expect(tenantOrgQueryAdapter.getTenantById).not.toHaveBeenCalled()
    expect(tenantOrgQueryAdapter.getOrgTreeByTenantId).toHaveBeenCalledWith('tenant-1', tenantSource)
    expect(tenantOrgManagementAdapter.createOrgUnit).toHaveBeenCalledWith(
      {
        name: 'Manufacturing',
        parentOrgId: 'org-root-1',
        sortOrder: 10,
        tenantId: 'tenant-1',
        type: 'DEPARTMENT'
      },
      tenantSource
    )
  })

  it('rejects tenant-scoped access to another tenant org tree', async () => {
    const tenantSource = {
      requestId: 'req-1',
      traceId: 'trace-1',
      user: { aid: 'account-1', scopeLevel: 'TENANT', tid: 'tenant-1' }
    }

    await expect(service.getOrgTree('tenant-2', tenantSource as any)).rejects.toBeInstanceOf(
      ForbiddenException
    )
    await expect(
      service.archiveOrgUnit('tenant-2', 'org-2', tenantSource as any)
    ).rejects.toBeInstanceOf(ForbiddenException)

    expect(tenantOrgQueryAdapter.getOrgTreeByTenantId).not.toHaveBeenCalled()
    expect(tenantOrgManagementAdapter.archiveOrgUnit).not.toHaveBeenCalled()
  })

  it('hydrates selected tenant metadata for system-scope org management', async () => {
    const systemSource = {
      requestId: 'req-1',
      traceId: 'trace-1',
      user: { aid: 'account-1', scopeLevel: 'SYSTEM' }
    }
    tenantOrgQueryAdapter.getTenantById.mockResolvedValue({
      tenant: {
        id: 'tenant-9',
        code: 'tenant.nine',
        name: 'Tenant Nine',
        rootOrgId: 'org-root-9',
        status: 'ACTIVE'
      }
    })
    tenantOrgQueryAdapter.getOrgTreeByTenantId.mockResolvedValue({ roots: [] })

    await expect(service.getOrgTree('tenant-9', systemSource as any)).resolves.toEqual({
      scope: 'SYSTEM',
      tenant: {
        code: 'tenant.nine',
        id: 'tenant-9',
        name: 'Tenant Nine',
        rootOrgId: 'org-root-9',
        status: 'ACTIVE'
      },
      roots: []
    })

    expect(tenantOrgQueryAdapter.getTenantById).toHaveBeenCalledWith('tenant-9', systemSource)
  })

  it('updates and archives org units through the dedicated management adapter', async () => {
    const source = {
      requestId: 'req-1',
      traceId: 'trace-1',
      user: { aid: 'account-1', scopeLevel: 'SYSTEM' }
    }
    tenantOrgManagementAdapter.updateOrgUnit.mockResolvedValue({
      orgUnit: {
        id: 'org-child-1',
        tenantId: 'tenant-1',
        parentOrgId: 'org-root-1',
        name: 'Manufacturing Updated',
        type: 'DEPARTMENT',
        status: 'ACTIVE',
        path: '/org-root-1/org-child-1',
        sortOrder: 11
      }
    })
    tenantOrgManagementAdapter.archiveOrgUnit.mockResolvedValue({
      orgUnit: {
        id: 'org-child-1',
        tenantId: 'tenant-1',
        parentOrgId: 'org-root-1',
        name: 'Manufacturing Updated',
        type: 'DEPARTMENT',
        status: 'ARCHIVED',
        path: '/org-root-1/org-child-1',
        sortOrder: 11
      }
    })

    await expect(
      service.updateOrgUnit(
        'tenant-1',
        'org-child-1',
        {
          name: 'Manufacturing Updated',
          sortOrder: 11,
          type: 'DEPARTMENT'
        },
        source as any
      )
    ).resolves.toEqual({
      orgUnit: {
        depth: 0,
        id: 'org-child-1',
        name: 'Manufacturing Updated',
        organizationParty: null,
        organizationPartyId: null,
        parentOrgId: 'org-root-1',
        path: '/org-root-1/org-child-1',
        sortOrder: 11,
        status: 'ACTIVE',
        tenantId: 'tenant-1',
        type: 'DEPARTMENT'
      }
    })

    await expect(service.archiveOrgUnit('tenant-1', 'org-child-1', source as any)).resolves.toEqual({
      orgUnit: {
        depth: 0,
        id: 'org-child-1',
        name: 'Manufacturing Updated',
        organizationParty: null,
        organizationPartyId: null,
        parentOrgId: 'org-root-1',
        path: '/org-root-1/org-child-1',
        sortOrder: 11,
        status: 'ARCHIVED',
        tenantId: 'tenant-1',
        type: 'DEPARTMENT'
      }
    })

    expect(tenantOrgManagementAdapter.updateOrgUnit).toHaveBeenCalledWith(
      {
        name: 'Manufacturing Updated',
        orgUnitId: 'org-child-1',
        sortOrder: 11,
        tenantId: 'tenant-1',
        type: 'DEPARTMENT'
      },
      source
    )
    expect(tenantOrgManagementAdapter.archiveOrgUnit).toHaveBeenCalledWith(
      {
        orgUnitId: 'org-child-1',
        tenantId: 'tenant-1'
      },
      source
    )
  })
})
