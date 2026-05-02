import { Reflector } from '@nestjs/core'
import { PERMISSION_CHECK_KEY } from '@oes/common/authorization'
import { RoleTemplateController } from './role-template.controller'

// Verifies the role template gateway controller exposes the role template routes and expected guards.
describe('RoleTemplateController', () => {
  const permissionService = {
    listRoleTemplates: jest.fn(),
    createRoleTemplate: jest.fn(),
    getRoleTemplateById: jest.fn(),
    updateRoleTemplate: jest.fn(),
    setRoleTemplateEnabled: jest.fn(),
    listRoleTemplatePermissions: jest.fn(),
    assignRoleTemplatePermission: jest.fn(),
    revokeRoleTemplatePermission: jest.fn(),
    createRoleFromTemplate: jest.fn(),
    deleteRoleTemplate: jest.fn()
  }

  const controller = new RoleTemplateController(permissionService as any)

  it('declares the expected coarse-grained permissions on role template endpoints', () => {
    const reflector = new Reflector()

    expect(reflector.get(PERMISSION_CHECK_KEY, RoleTemplateController.prototype.listRoleTemplates)).toEqual({
      type: 'ALL',
      permissions: ['permission.role_template.list']
    })
    expect(reflector.get(PERMISSION_CHECK_KEY, RoleTemplateController.prototype.createRoleTemplate)).toEqual({
      type: 'ALL',
      permissions: ['permission.role_template.create']
    })
    expect(reflector.get(PERMISSION_CHECK_KEY, RoleTemplateController.prototype.findById)).toEqual({
      type: 'ALL',
      permissions: ['permission.role_template.get_by_id']
    })
    expect(reflector.get(PERMISSION_CHECK_KEY, RoleTemplateController.prototype.updateRoleTemplate)).toEqual({
      type: 'ALL',
      permissions: ['permission.role_template.update']
    })
    expect(reflector.get(PERMISSION_CHECK_KEY, RoleTemplateController.prototype.setRoleTemplateEnabled)).toEqual({
      type: 'ALL',
      permissions: ['permission.role_template.update']
    })
    expect(reflector.get(PERMISSION_CHECK_KEY, RoleTemplateController.prototype.listRoleTemplatePermissions)).toEqual({
      type: 'ALL',
      permissions: ['permission.role_template.get_by_id']
    })
    expect(reflector.get(PERMISSION_CHECK_KEY, RoleTemplateController.prototype.assignRoleTemplatePermission)).toEqual({
      type: 'ALL',
      permissions: ['permission.role_template.permission.assign']
    })
    expect(reflector.get(PERMISSION_CHECK_KEY, RoleTemplateController.prototype.revokeRoleTemplatePermission)).toEqual({
      type: 'ALL',
      permissions: ['permission.role_template.permission.revoke']
    })
    expect(reflector.get(PERMISSION_CHECK_KEY, RoleTemplateController.prototype.createRoleFromTemplate)).toEqual({
      type: 'ALL',
      permissions: ['permission.role_instance.create_from_template']
    })
    expect(reflector.get(PERMISSION_CHECK_KEY, RoleTemplateController.prototype.deleteRoleTemplate)).toEqual({
      type: 'ALL',
      permissions: ['permission.role_template.delete_by_id']
    })
  })

  it('forwards role template list filters to the proxy service', async () => {
    permissionService.listRoleTemplates.mockResolvedValue({
      roles: [],
      total: 0,
      page: 2,
      pageSize: 25
    })
    const source = { requestId: 'req-1', traceId: 'trace-1' }

    await expect(
      controller.listRoleTemplates(
        {
          page: 2,
          pageSize: 25,
          keyword: 'admin'
        } as any,
        source as any
      )
    ).resolves.toEqual({ roles: [], total: 0, page: 2, pageSize: 25 })

    expect(permissionService.listRoleTemplates).toHaveBeenCalledWith(
      {
        page: 2,
        pageSize: 25,
        keyword: 'admin'
      },
      source
    )
  })

  it('forwards role template mutation and detail routes to the proxy service', async () => {
    const source = { requestId: 'req-1', traceId: 'trace-1' }
    permissionService.createRoleTemplate.mockResolvedValue({ id: 'template-id' })
    permissionService.updateRoleTemplate.mockResolvedValue({ id: 'template-id' })
    permissionService.setRoleTemplateEnabled.mockResolvedValue({ id: 'template-id', isEnabled: false })
    permissionService.listRoleTemplatePermissions.mockResolvedValue({ permissions: [] })
    permissionService.assignRoleTemplatePermission.mockResolvedValue(undefined)
    permissionService.revokeRoleTemplatePermission.mockResolvedValue(undefined)
    permissionService.createRoleFromTemplate.mockResolvedValue({ id: 'role-id' })
    permissionService.deleteRoleTemplate.mockResolvedValue(undefined)

    await expect(
      controller.createRoleTemplate(
        {
          name: 'Tenant Admin Template',
          code: 'TENANT_ADMIN_TEMPLATE',
          description: 'Template'
        },
        source as any
      )
    ).resolves.toEqual({ id: 'template-id' })
    await expect(
      controller.updateRoleTemplate('template-id', { name: 'Updated', description: 'Updated desc' }, source as any)
    ).resolves.toEqual({ id: 'template-id' })
    await expect(
      controller.setRoleTemplateEnabled('template-id', { isEnabled: false }, source as any)
    ).resolves.toEqual({ id: 'template-id', isEnabled: false })
    await expect(controller.listRoleTemplatePermissions('template-id', source as any)).resolves.toEqual({
      permissions: []
    })
    await expect(
      controller.assignRoleTemplatePermission('template-id', { permissionId: 'permission-id' }, source as any)
    ).resolves.toBeUndefined()
    await expect(
      controller.revokeRoleTemplatePermission('template-id', 'permission-id', source as any)
    ).resolves.toBeUndefined()
    await expect(
      controller.createRoleFromTemplate(
        'template-id',
        { tenantId: 'tenant-id', name: 'Tenant Admin', description: 'Role' },
        source as any
      )
    ).resolves.toEqual({ id: 'role-id' })
    await expect(controller.deleteRoleTemplate('template-id', source as any)).resolves.toBeUndefined()

    expect(permissionService.createRoleTemplate).toHaveBeenCalledWith(
      {
        name: 'Tenant Admin Template',
        code: 'TENANT_ADMIN_TEMPLATE',
        description: 'Template'
      },
      source
    )
    expect(permissionService.updateRoleTemplate).toHaveBeenCalledWith(
      {
        id: 'template-id',
        name: 'Updated',
        description: 'Updated desc'
      },
      source
    )
    expect(permissionService.setRoleTemplateEnabled).toHaveBeenCalledWith(
      {
        id: 'template-id',
        isEnabled: false
      },
      source
    )
    expect(permissionService.listRoleTemplatePermissions).toHaveBeenCalledWith(
      { roleTemplateId: 'template-id' },
      source
    )
    expect(permissionService.assignRoleTemplatePermission).toHaveBeenCalledWith(
      {
        roleTemplateId: 'template-id',
        permissionId: 'permission-id'
      },
      source
    )
    expect(permissionService.revokeRoleTemplatePermission).toHaveBeenCalledWith(
      {
        roleTemplateId: 'template-id',
        permissionId: 'permission-id'
      },
      source
    )
    expect(permissionService.createRoleFromTemplate).toHaveBeenCalledWith(
      {
        templateRoleId: 'template-id',
        tenantId: 'tenant-id',
        name: 'Tenant Admin',
        description: 'Role'
      },
      source
    )
    expect(permissionService.deleteRoleTemplate).toHaveBeenCalledWith({ id: 'template-id' }, source)
  })
})
