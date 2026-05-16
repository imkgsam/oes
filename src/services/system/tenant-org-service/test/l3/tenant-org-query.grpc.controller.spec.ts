import { GUARDS_METADATA } from '@nestjs/common/constants'
import {
  AuthenticatedOperatorGuard,
  InternalServiceGuard,
  PermissionGuard,
  REQUIRE_PERMISSIONS_METADATA_KEY,
  TENANT_ORG_MANAGEMENT_PERMISSION_CODES
} from '@oes/common/authorization'
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
  it('declares RBAC guards for human-facing tenant/org query APIs', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, TenantOrgQueryGrpcController) ?? []

    expect(guards).toEqual(
      expect.arrayContaining([InternalServiceGuard, AuthenticatedOperatorGuard, PermissionGuard])
    )
    expectPermission('listTenants', TENANT_ORG_MANAGEMENT_PERMISSION_CODES.LIST_TENANT)
    expectPermission('getOrgTreeByTenantId', TENANT_ORG_MANAGEMENT_PERMISSION_CODES.LIST_ORG_TREE)
    expectPermission('getOrgUnitById', TENANT_ORG_MANAGEMENT_PERMISSION_CODES.VIEW_ORG_UNIT_DETAIL)
    expectPermission('listAncestorOrgUnits', TENANT_ORG_MANAGEMENT_PERMISSION_CODES.LIST_ORG_TREE)
    expectPermission('listDescendantOrgUnits', TENANT_ORG_MANAGEMENT_PERMISSION_CODES.LIST_ORG_TREE)
    expect(
      Reflect.getMetadata(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        TenantOrgQueryGrpcController.prototype.getTenantById
      )
    ).toBeUndefined()
    expectNoPermission('validateOrgReference')
    expectNoPermission('getOrgReferenceSummary')
  })

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

/** expectPermission verifies the controller method requires one tenant-org RBAC code. */
function expectPermission(methodName: keyof TenantOrgQueryGrpcController, permissionCode: string) {
  expect(
    Reflect.getMetadata(
      REQUIRE_PERMISSIONS_METADATA_KEY,
      TenantOrgQueryGrpcController.prototype[methodName]
    )
  ).toEqual({ all: [permissionCode] })
}

/** expectNoPermission verifies internal reference helpers do not require human-facing RBAC. */
function expectNoPermission(methodName: keyof TenantOrgQueryGrpcController) {
  expect(
    Reflect.getMetadata(
      REQUIRE_PERMISSIONS_METADATA_KEY,
      TenantOrgQueryGrpcController.prototype[methodName]
    )
  ).toBeUndefined()
}
