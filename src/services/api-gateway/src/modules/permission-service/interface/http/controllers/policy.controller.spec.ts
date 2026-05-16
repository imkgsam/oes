import { Reflector } from '@nestjs/core'
import { REQUIRE_PERMISSIONS_METADATA_KEY } from '@oes/common/authorization'
import { PolicyController } from './policy.controller'

// Verifies readonly policy governance endpoints stay guarded by one coarse-grained policy read permission.
describe('PolicyController', () => {
  const permissionService = {
    getPolicyById: jest.fn(),
    listPermissionPolicies: jest.fn(),
    listPolicies: jest.fn()
  }

  const controller = new PolicyController(permissionService as any)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('declares the expected permissions on readonly policy governance endpoints', () => {
    const reflector = new Reflector()

    expect(
      reflector.get(REQUIRE_PERMISSIONS_METADATA_KEY, PolicyController.prototype.listPolicies)
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(REQUIRE_PERMISSIONS_METADATA_KEY, PolicyController.prototype.getPolicyById)
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        PolicyController.prototype.listPoliciesByPermission
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
  })

  it('forwards normalized readonly list filters to the proxy service', async () => {
    const source = { requestId: 'req-1', traceId: 'trace-1' }
    permissionService.listPolicies.mockResolvedValue({
      page: 2,
      pageSize: 50,
      policies: [],
      total: 0
    })

    await expect(
      controller.listPolicies(
        {
          isEnabled: false,
          keyword: 'deny',
          page: 2,
          pageSize: 50,
          permissionCode: 'permission.role_instance.update',
          tenantId: 'tenant-1'
        } as any,
        source as any
      )
    ).resolves.toEqual({
      page: 2,
      pageSize: 50,
      policies: [],
      total: 0
    })

    expect(permissionService.listPolicies).toHaveBeenCalledWith(
      {
        hasIsEnabledFilter: true,
        isEnabled: false,
        keyword: 'deny',
        page: 2,
        pageSize: 50,
        permissionCode: 'permission.role_instance.update',
        tenantId: 'tenant-1'
      },
      source
    )
  })

  it('forwards policy detail and permission-linked policy queries to the proxy service', async () => {
    const source = { requestId: 'req-1', traceId: 'trace-1' }
    permissionService.getPolicyById.mockResolvedValue({ id: 'policy-1' })
    permissionService.listPermissionPolicies.mockResolvedValue({ policies: [] })

    await expect(controller.getPolicyById('policy-1', source as any)).resolves.toEqual({
      id: 'policy-1'
    })
    await expect(
      controller.listPoliciesByPermission(
        'permission.role_instance.update',
        { tenantId: 'tenant-1' } as any,
        source as any
      )
    ).resolves.toEqual({ policies: [] })

    expect(permissionService.getPolicyById).toHaveBeenCalledWith({ id: 'policy-1' }, source)
    expect(permissionService.listPermissionPolicies).toHaveBeenCalledWith(
      {
        permissionCode: 'permission.role_instance.update',
        tenantId: 'tenant-1'
      },
      source
    )
  })
})
