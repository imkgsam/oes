import { Reflector } from '@nestjs/core'
import { PERMISSION_CHECK_KEY } from '@oes/common/authorization'
import { PermissionController } from './permission.controller'

// Verifies the permission gateway controller exposes the unified permission list route and expected guards.
describe('PermissionController', () => {
  const permissionService = {
    listPermissions: jest.fn(),
    createPermission: jest.fn(),
    updatePermission: jest.fn(),
    getPermissionById: jest.fn(),
    getPermissionByCode: jest.fn(),
    listPermissionRoles: jest.fn(),
    deletePermission: jest.fn()
  }

  const controller = new PermissionController(permissionService as any)

  it('declares the expected coarse-grained permissions on permission endpoints', () => {
    const reflector = new Reflector()

    expect(reflector.get(PERMISSION_CHECK_KEY, PermissionController.prototype.listPermissions)).toEqual({
      type: 'ALL',
      permissions: ['permission.list']
    })
    expect(reflector.get(PERMISSION_CHECK_KEY, PermissionController.prototype.createPermission)).toEqual({
      type: 'ALL',
      permissions: ['permission.create']
    })
    expect(reflector.get(PERMISSION_CHECK_KEY, PermissionController.prototype.findById)).toEqual({
      type: 'ALL',
      permissions: ['permission.get_by_id']
    })
    expect(reflector.get(PERMISSION_CHECK_KEY, PermissionController.prototype.updatePermission)).toEqual({
      type: 'ALL',
      permissions: ['permission.update']
    })
    expect(reflector.get(PERMISSION_CHECK_KEY, PermissionController.prototype.listPermissionRoles)).toEqual({
      type: 'ALL',
      permissions: ['permission.role.list']
    })
    expect(reflector.get(PERMISSION_CHECK_KEY, PermissionController.prototype.findByCode)).toEqual({
      type: 'ALL',
      permissions: ['permission.get_by_code']
    })
    expect(reflector.get(PERMISSION_CHECK_KEY, PermissionController.prototype.delete)).toEqual({
      type: 'ALL',
      permissions: ['permission.delete']
    })
  })

  it('forwards the unified list filters to the proxy service', async () => {
    permissionService.listPermissions.mockResolvedValue({
      permissions: [],
      total: 0,
      page: 2,
      pageSize: 50
    })
    const source = { requestId: 'req-1', traceId: 'trace-1' }

    await expect(
      controller.listPermissions(
        {
          module: 'auth',
          keyword: 'login',
          page: 2,
          pageSize: 50
        } as any,
        source as any
      )
    ).resolves.toEqual({ permissions: [], total: 0, page: 2, pageSize: 50 })

    expect(permissionService.listPermissions).toHaveBeenCalledWith(
      {
        module: 'auth',
        keyword: 'login',
        page: 2,
        pageSize: 50
      },
      source
    )
  })

  it('forwards permission detail and mutation routes to the proxy service', async () => {
    const source = { requestId: 'req-1', traceId: 'trace-1' }
    permissionService.getPermissionById.mockResolvedValue({ id: 'permission-id' })
    permissionService.updatePermission.mockResolvedValue({ id: 'permission-id' })
    permissionService.listPermissionRoles.mockResolvedValue({ roles: [] })

    await expect(controller.findById('permission-id', source as any)).resolves.toEqual({
      id: 'permission-id'
    })
    await expect(
      controller.updatePermission(
        'permission-id',
        { module: 'AUTH_SERVICE', description: 'Updated' },
        source as any
      )
    ).resolves.toEqual({ id: 'permission-id' })
    await expect(controller.listPermissionRoles('permission-id', source as any)).resolves.toEqual({
      roles: []
    })

    expect(permissionService.getPermissionById).toHaveBeenCalledWith({ id: 'permission-id' }, source)
    expect(permissionService.updatePermission).toHaveBeenCalledWith(
      {
        id: 'permission-id',
        module: 'AUTH_SERVICE',
        description: 'Updated'
      },
      source
    )
    expect(permissionService.listPermissionRoles).toHaveBeenCalledWith(
      { permissionId: 'permission-id' },
      source
    )
  })
})
