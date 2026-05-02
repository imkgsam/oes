import { Reflector } from '@nestjs/core'
import { PERMISSION_CHECK_KEY } from '@oes/common/authorization'
import { RoleController } from './role.controller'

// Verifies the role gateway controller exposes the role management routes and expected guards.
describe('RoleController', () => {
  const permissionService = {
    createRole: jest.fn(),
    updateRole: jest.fn(),
    setRoleEnabled: jest.fn(),
    listRolePermissions: jest.fn(),
    assignRolePermission: jest.fn(),
    revokeRolePermission: jest.fn(),
    deleteRole: jest.fn()
  }
  const roleManagementReadService = {
    listTenantOptions: jest.fn(),
    listRoles: jest.fn(),
    getRoleById: jest.fn()
  }

  const controller = new RoleController(
    permissionService as any,
    roleManagementReadService as any
  )

  it('declares the expected coarse-grained permissions on role endpoints', () => {
    const reflector = new Reflector()

    expect(reflector.get(PERMISSION_CHECK_KEY, RoleController.prototype.listRoles)).toEqual({
      type: 'ALL',
      permissions: ['permission.role_instance.list']
    })
    expect(reflector.get(PERMISSION_CHECK_KEY, RoleController.prototype.listTenantOptions)).toEqual({
      type: 'ALL',
      permissions: ['permission.role_instance.create']
    })
    expect(reflector.get(PERMISSION_CHECK_KEY, RoleController.prototype.createRole)).toEqual({
      type: 'ALL',
      permissions: ['permission.role_instance.create']
    })
    expect(reflector.get(PERMISSION_CHECK_KEY, RoleController.prototype.findById)).toEqual({
      type: 'ALL',
      permissions: ['permission.role_instance.get_by_id']
    })
    expect(reflector.get(PERMISSION_CHECK_KEY, RoleController.prototype.updateRole)).toEqual({
      type: 'ALL',
      permissions: ['permission.role_instance.update']
    })
    expect(reflector.get(PERMISSION_CHECK_KEY, RoleController.prototype.setRoleEnabled)).toEqual({
      type: 'ALL',
      permissions: ['permission.role_instance.update']
    })
    expect(reflector.get(PERMISSION_CHECK_KEY, RoleController.prototype.listRolePermissions)).toEqual({
      type: 'ALL',
      permissions: ['permission.role_instance.get_by_id']
    })
    expect(reflector.get(PERMISSION_CHECK_KEY, RoleController.prototype.assignRolePermission)).toEqual({
      type: 'ALL',
      permissions: ['permission.role_instance.permission.assign']
    })
    expect(reflector.get(PERMISSION_CHECK_KEY, RoleController.prototype.revokeRolePermission)).toEqual({
      type: 'ALL',
      permissions: ['permission.role_instance.permission.revoke']
    })
    expect(reflector.get(PERMISSION_CHECK_KEY, RoleController.prototype.deleteRole)).toEqual({
      type: 'ALL',
      permissions: ['permission.role_instance.delete_by_id']
    })
  })

  it('forwards role list filters to the proxy service', async () => {
    roleManagementReadService.listRoles.mockResolvedValue({
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

    expect(roleManagementReadService.listRoles).toHaveBeenCalledWith(
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

  it('forwards tenant selector queries to the role read-model service', async () => {
    roleManagementReadService.listTenantOptions.mockResolvedValue({
      tenants: [{ id: 'tenant-1', name: 'Alpha Tenant', code: 'tenant.alpha', isActive: true }]
    })
    const source = { requestId: 'req-1', traceId: 'trace-1' }

    await expect(
      controller.listTenantOptions(
        {
          keyword: 'alpha',
          pageSize: 10
        } as any,
        source as any
      )
    ).resolves.toEqual({
      tenants: [{ id: 'tenant-1', name: 'Alpha Tenant', code: 'tenant.alpha', isActive: true }]
    })

    expect(roleManagementReadService.listTenantOptions).toHaveBeenCalledWith(
      {
        keyword: 'alpha',
        pageSize: 10
      },
      source
    )
  })

  it('forwards role mutation routes to the proxy service', async () => {
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

  it('delegates role detail reads to the role read-model service', async () => {
    const source = { requestId: 'req-1', traceId: 'trace-1' }
    roleManagementReadService.getRoleById.mockResolvedValue({
      id: 'role-id',
      tenantName: 'Tenant One'
    })

    await expect(controller.findById('role-id', source as any)).resolves.toEqual({
      id: 'role-id',
      tenantName: 'Tenant One'
    })

    expect(roleManagementReadService.getRoleById).toHaveBeenCalledWith({ id: 'role-id' }, source)
  })
})
