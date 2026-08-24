import { Reflector } from '@nestjs/core'
import { REQUIRE_PERMISSIONS_METADATA_KEY } from '@oes/common/authorization'
import { VerifiedTenantTarget } from '../../../../../common/tenant-target'
import { TenantManagementController } from './tenant-management.controller'

// Verifies the tenant-management gateway controller keeps tenant admin routes system-scoped and contract-aligned.
describe('TenantManagementController', () => {
  const tenantManagementService = {
    createTenant: jest.fn(),
    getTenantById: jest.fn(),
    listTenants: jest.fn(),
    searchFirstAdminExistingUsers: jest.fn(),
    updateTenantProfile: jest.fn(),
    updateTenantStatus: jest.fn()
  }

  const controller = new TenantManagementController(tenantManagementService as any)
  const tenantTarget = 'tenant-1' as VerifiedTenantTarget

  it('declares the expected coarse-grained permissions on tenant management endpoints', () => {
    const reflector = new Reflector()

    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        TenantManagementController.prototype.listTenants
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        TenantManagementController.prototype.getTenantById
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        TenantManagementController.prototype.createTenant
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        TenantManagementController.prototype.searchFirstAdminExistingUsers
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        TenantManagementController.prototype.updateTenantProfile
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        TenantManagementController.prototype.updateTenantStatus
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
  })

  it('forwards list and detail reads to the tenant management service', async () => {
    const source = { requestId: 'req-1', traceId: 'trace-1', user: { scopeLevel: 'SYSTEM' } }
    tenantManagementService.listTenants.mockResolvedValue({
      items: [{ id: 'tenant-1', code: 'alpha', name: 'Alpha Tenant', status: 'ACTIVE' }],
      page: 2,
      pageSize: 20,
      total: 1
    })
    tenantManagementService.getTenantById.mockResolvedValue({
      tenant: {
        id: 'tenant-1',
        code: 'alpha',
        name: 'Alpha Tenant',
        rootOrgId: 'org-root-1',
        rootOrgName: 'Alpha Tenant',
        status: 'ACTIVE'
      }
    })

    await expect(
      controller.listTenants(
        {
          keyword: 'alpha',
          page: 2,
          pageSize: 20,
          status: 'ACTIVE'
        } as any,
        source as any
      )
    ).resolves.toEqual({
      items: [{ id: 'tenant-1', code: 'alpha', name: 'Alpha Tenant', status: 'ACTIVE' }],
      page: 2,
      pageSize: 20,
      total: 1
    })

    await expect(controller.getTenantById(tenantTarget, source as any)).resolves.toEqual({
      tenant: {
        id: 'tenant-1',
        code: 'alpha',
        name: 'Alpha Tenant',
        rootOrgId: 'org-root-1',
        rootOrgName: 'Alpha Tenant',
        status: 'ACTIVE'
      }
    })

    expect(tenantManagementService.listTenants).toHaveBeenCalledWith(
      {
        keyword: 'alpha',
        page: 2,
        pageSize: 20,
        status: 'ACTIVE'
      },
      source
    )
    expect(tenantManagementService.getTenantById).toHaveBeenCalledWith('tenant-1', source)
  })

  it('forwards create, profile update, and status mutation requests to the tenant management service', async () => {
    const source = { requestId: 'req-1', traceId: 'trace-1', user: { scopeLevel: 'SYSTEM' } }
    tenantManagementService.createTenant.mockResolvedValue({
      tenant: { id: 'tenant-1', code: 'alpha', name: 'Alpha Tenant', status: 'ACTIVE' }
    })
    tenantManagementService.updateTenantProfile.mockResolvedValue({
      tenant: { id: 'tenant-1', code: 'alpha-new', name: 'Alpha Tenant New', status: 'ACTIVE' }
    })
    tenantManagementService.updateTenantStatus.mockResolvedValue({
      tenant: { id: 'tenant-1', code: 'alpha', name: 'Alpha Tenant', status: 'SUSPENDED' }
    })

    await expect(
      controller.createTenant(
        {
          code: 'alpha',
          name: 'Alpha Tenant',
          rootOrgName: 'Alpha Root'
        } as any,
        source as any
      )
    ).resolves.toEqual({
      tenant: { id: 'tenant-1', code: 'alpha', name: 'Alpha Tenant', status: 'ACTIVE' }
    })

    await expect(
      controller.updateTenantProfile(
        tenantTarget,
        {
          code: 'alpha-new',
          name: 'Alpha Tenant New'
        } as any,
        source as any
      )
    ).resolves.toEqual({
      tenant: { id: 'tenant-1', code: 'alpha-new', name: 'Alpha Tenant New', status: 'ACTIVE' }
    })

    await expect(
      controller.updateTenantStatus(
        tenantTarget,
        {
          reason: 'Manual review',
          status: 'SUSPENDED'
        } as any,
        source as any
      )
    ).resolves.toEqual({
      tenant: { id: 'tenant-1', code: 'alpha', name: 'Alpha Tenant', status: 'SUSPENDED' }
    })

    expect(tenantManagementService.createTenant).toHaveBeenCalledWith(
      {
        code: 'alpha',
        name: 'Alpha Tenant',
        rootOrgName: 'Alpha Root'
      },
      source
    )
    expect(tenantManagementService.updateTenantProfile).toHaveBeenCalledWith(
      'tenant-1',
      {
        code: 'alpha-new',
        name: 'Alpha Tenant New'
      },
      source
    )
    expect(tenantManagementService.updateTenantStatus).toHaveBeenCalledWith(
      'tenant-1',
      {
        reason: 'Manual review',
        status: 'SUSPENDED'
      },
      source
    )
  })
})
