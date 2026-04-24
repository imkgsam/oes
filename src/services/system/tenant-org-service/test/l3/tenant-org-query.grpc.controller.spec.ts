import { TenantOrgQueryService } from '../../src/application/services'
import { TenantOrgQueryGrpcController } from '../../src/interfaces/grpc/tenant-org-query.grpc.controller'

/** createTenantOrgQueryServiceMock builds the application service double for query controller mapping tests. */
function createTenantOrgQueryServiceMock() {
  return {
    getTenantById: jest.fn(),
    listTenants: jest.fn(),
    getOrgTreeByTenantId: jest.fn(),
    getOrgUnitById: jest.fn(),
    validateOrgReference: jest.fn(),
    getOrgReferenceSummary: jest.fn(),
    listAncestorOrgUnits: jest.fn(),
    listDescendantOrgUnits: jest.fn()
  }
}

describe('TenantOrgQueryGrpcController L3', () => {
  it('getTenantById / should map application tenant summary to proto response', async () => {
    const service = createTenantOrgQueryServiceMock()
    const controller = new TenantOrgQueryGrpcController(service as unknown as TenantOrgQueryService)
    service.getTenantById.mockResolvedValue({
      id: 'tenant-1',
      code: 'acme',
      name: 'Acme',
      status: 'ACTIVE',
      rootOrgId: 'root-1'
    })

    const result = await controller.getTenantById({ tenantId: 'tenant-1' } as any)

    expect(service.getTenantById).toHaveBeenCalledWith('tenant-1')
    expect(result).toEqual({
      tenant: {
        id: 'tenant-1',
        code: 'acme',
        name: 'Acme',
        status: 'ACTIVE',
        rootOrgId: 'root-1'
      }
    })
  })

  it('getOrgTreeByTenantId / should map nested org tree to proto response', async () => {
    const service = createTenantOrgQueryServiceMock()
    const controller = new TenantOrgQueryGrpcController(service as unknown as TenantOrgQueryService)
    service.getOrgTreeByTenantId.mockResolvedValue([
      {
        orgUnit: {
          id: 'root-1',
          tenantId: 'tenant-1',
          parentOrgId: null,
          name: 'Acme',
          type: 'ROOT',
          status: 'ACTIVE',
          path: '/root-1',
          depth: 0,
          sortOrder: 0,
          organizationPartyId: null
        },
        children: [
          {
            orgUnit: {
              id: 'dept-1',
              tenantId: 'tenant-1',
              parentOrgId: 'root-1',
              name: 'Sales',
              type: 'DEPARTMENT',
              status: 'ACTIVE',
              path: '/root-1/dept-1',
              depth: 1,
              sortOrder: 10,
              organizationPartyId: null
            },
            children: []
          }
        ]
      }
    ])

    const result = await controller.getOrgTreeByTenantId({ tenantId: 'tenant-1' } as any)

    expect(result.roots?.[0]?.children?.[0]?.orgUnit?.id).toBe('dept-1')
  })
})
