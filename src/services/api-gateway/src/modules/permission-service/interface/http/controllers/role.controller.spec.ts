import { Reflector } from '@nestjs/core'
import { PERMISSION_CHECK_KEY } from '@oes/common/authorization'
import { RoleController } from './role.controller'

// Verifies the role gateway controller exposes the role management routes and expected guards.
describe('RoleController', () => {
  const permissionService = {
    listRoles: jest.fn(),
    createRole: jest.fn(),
    getRoleById: jest.fn(),
    updateRole: jest.fn(),
    setRoleEnabled: jest.fn(),
    listRolePermissions: jest.fn(),
    assignRolePermission: jest.fn(),
    revokeRolePermission: jest.fn(),
    deleteRole: jest.fn()
  }

  const controller = new RoleController(permissionService as any)

  it('declares the expected coarse-grained permissions on role endpoints', () => {
    const reflector = new Reflector()

    expect(reflector.get(PERMISSION_CHECK_KEY, RoleController.prototype.listRoles)).toEqual({
      type: 'ALL',
      permissions: ['permission.role.list']
    })
    expect(reflector.get(PERMISSION_CHECK_KEY, RoleController.prototype.createRole)).toEqual({
      type: 'ALL',
      permissions: ['permission.role.create']
    })
    expect(reflector.get(PERMISSION_CHECK_KEY, RoleController.prototype.findById)).toEqual({
      type: 'ALL',
      permissions: ['permission.role.get_by_id']
    })
    expect(reflector.get(PERMISSION_CHECK_KEY, RoleController.prototype.updateRole)).toEqual({
      type: 'ALL',
      permissions: ['permission.role.update']
    })
    expect(reflector.get(PERMISSION_CHECK_KEY, RoleController.prototype.setRoleEnabled)).toEqual({
      type: 'ALL',
      permissions: ['permission.role.update']
    })
    expect(reflector.get(PERMISSION_CHECK_KEY, RoleController.prototype.listRolePermissions)).toEqual({
      type: 'ALL',
      permissions: ['permission.role.get_by_id']
    })
    expect(reflector.get(PERMISSION_CHECK_KEY, RoleController.prototype.assignRolePermission)).toEqual({
      type: 'ALL',
      permissions: ['permission.role.update']
    })
    expect(reflector.get(PERMISSION_CHECK_KEY, RoleController.prototype.revokeRolePermission)).toEqual({
      type: 'ALL',
      permissions: ['permission.role.update']
    })
    expect(reflector.get(PERMISSION_CHECK_KEY, RoleController.prototype.deleteRole)).toEqual({
      type: 'ALL',
      permissions: ['permission.role.delete_by_id']
    })
  })

  it('forwards role list filters to the proxy service', async () => {
    permissionService.listRoles.mockResolvedValue({
      roles: [],
      total: 0,
      page: 2,
      pageSize: 25
    })
    const source = { requestId: 'req-1', traceId: 'trace-1' }

    await expect(
      controller.listRoles(
        {
          page: 2,
          pageSize: 25,
          tenantId: 'tenant-id',
          scopeLevel: 'TENANT',
          keyword: 'admin'
        } as any,
        source as any
      )
    ).resolves.toEqual({ roles: [], total: 0, page: 2, pageSize: 25 })

    expect(permissionService.listRoles).toHaveBeenCalledWith(
      {
        page: 2,
        pageSize: 25,
        tenantId: 'tenant-id',
        scopeLevel: 'TENANT',
        keyword: 'admin'
      },
      source
    )
  })

  it('forwards role mutation and detail routes to the proxy service', async () => {
    const source = { requestId: 'req-1', traceId: 'trace-1' }
    permissionService.createRole.mockResolvedValue({ id: 'role-id' })
    permissionService.updateRole.mockResolvedValue({ id: 'role-id' })
    permissionService.setRoleEnabled.mockResolvedValue({ id: 'role-id', isEnabled: false })
    permissionService.listRolePermissions.mockResolvedValue({ permissions: [] })
    permissionService.assignRolePermission.mockResolvedValue(undefined)
    permissionService.revokeRolePermission.mockResolvedValue(undefined)

    await expect(
      controller.createRole(
        {
          name: 'System Auditor',
          code: 'SYSTEM_AUDITOR',
          scopeLevel: 'SYSTEM',
          description: 'Audits platform state'
        },
        source as any
      )
    ).resolves.toEqual({ id: 'role-id' })
    await expect(
      controller.updateRole('role-id', { name: 'Updated', description: 'Updated desc' }, source as any)
    ).resolves.toEqual({ id: 'role-id' })
    await expect(
      controller.setRoleEnabled('role-id', { isEnabled: false }, source as any)
    ).resolves.toEqual({ id: 'role-id', isEnabled: false })
    await expect(controller.listRolePermissions('role-id', source as any)).resolves.toEqual({
      permissions: []
    })
    await expect(
      controller.assignRolePermission('role-id', { permissionId: 'permission-id' }, source as any)
    ).resolves.toBeUndefined()
    await expect(
      controller.revokeRolePermission('role-id', 'permission-id', source as any)
    ).resolves.toBeUndefined()

    expect(permissionService.createRole).toHaveBeenCalledWith(
      {
        name: 'System Auditor',
        code: 'SYSTEM_AUDITOR',
        tenantId: undefined,
        scopeLevel: 'SYSTEM',
        description: 'Audits platform state',
        templateRoleId: undefined
      },
      source
    )
    expect(permissionService.updateRole).toHaveBeenCalledWith(
      {
        id: 'role-id',
        name: 'Updated',
        description: 'Updated desc'
      },
      source
    )
    expect(permissionService.setRoleEnabled).toHaveBeenCalledWith(
      {
        id: 'role-id',
        isEnabled: false
      },
      source
    )
    expect(permissionService.listRolePermissions).toHaveBeenCalledWith({ roleId: 'role-id' }, source)
    expect(permissionService.assignRolePermission).toHaveBeenCalledWith(
      {
        roleId: 'role-id',
        permissionId: 'permission-id'
      },
      source
    )
    expect(permissionService.revokeRolePermission).toHaveBeenCalledWith(
      {
        roleId: 'role-id',
        permissionId: 'permission-id'
      },
      source
    )
  })
})
