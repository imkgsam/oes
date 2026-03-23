import { PermissionManagementGrpcController } from '../../src/interfaces/grpc/permission-management.grpc.controller'
import { Permission } from '../../src/domain/aggregates/permission.aggregate'
import { Role } from '../../src/domain/aggregates/role.aggregate'
import { PermissionModule } from '../../src/domain/enums/permission-module.enum'
import { RoleKind } from '../../src/domain/enums/role-kind.enum'
import { AccountType } from '../../src/domain/enums/account-type.enum'
import { AccountRole } from '../../src/domain/vo/account-role.value-object'

describe('PermissionManagementGrpcController Additional L3', () => {
  const createBuses = () => ({
    commandBus: {
      execute: jest.fn()
    },
    queryBus: {
      execute: jest.fn()
    }
  })

  const createPermission = (id: string, code: string) =>
    new Permission(id, code, PermissionModule.PERMISSION_SERVICE, `${code} description`)

  const createRole = (id: string, code: string, tenantId: string | null = null, kind = RoleKind.SYSTEM_TEMPLATE) =>
    new Role(id, `${code} name`, code, tenantId, kind, true, `${code} description`, null, [])

  it('gRPC 批量创建权限 / 当请求合法时 / 应映射输入数组并返回 ListPermissionsResponse', async () => {
    const buses = createBuses()
    const controller = new PermissionManagementGrpcController(buses.commandBus as any, buses.queryBus as any)
    buses.commandBus.execute.mockResolvedValue([
      createPermission('p1', 'permission.one'),
      createPermission('p2', 'permission.two')
    ])

    const result = await controller.batchCreatePermissions({
      permissions: [
        { code: 'permission.one', module: 'PERMISSION_SERVICE', description: 'one' },
        { code: 'permission.two', module: 'AUTH_SERVICE', description: 'two' }
      ]
    } as any)

    const command = buses.commandBus.execute.mock.calls[0][0]
    expect(command.constructor.name).toBe('BatchCreatePermissionsCommand')
    expect(command.permissions).toHaveLength(2)
    expect(result.permissions).toHaveLength(2)
  })

  it('gRPC 更新权限 / 当请求合法时 / 应映射为 UpdatePermissionCommand', async () => {
    const buses = createBuses()
    const controller = new PermissionManagementGrpcController(buses.commandBus as any, buses.queryBus as any)
    buses.commandBus.execute.mockResolvedValue(
      new Permission('permission-id', 'permission.update', PermissionModule.AUTH_SERVICE, 'updated')
    )

    const result = await controller.updatePermission({
      id: 'permission-id',
      module: 'AUTH_SERVICE',
      description: 'updated'
    } as any)

    const command = buses.commandBus.execute.mock.calls[0][0]
    expect(command.constructor.name).toBe('UpdatePermissionCommand')
    expect(command.id).toBe('permission-id')
    expect(command.module).toBe(PermissionModule.AUTH_SERVICE)
    expect(result.module).toBe(PermissionModule.AUTH_SERVICE)
  })

  it('gRPC 删除权限 / 当请求合法时 / 应映射为 DeletePermissionCommand', async () => {
    const buses = createBuses()
    const controller = new PermissionManagementGrpcController(buses.commandBus as any, buses.queryBus as any)

    await controller.deletePermission({ id: 'permission-id' } as any)

    const command = buses.commandBus.execute.mock.calls[0][0]
    expect(command.constructor.name).toBe('DeletePermissionCommand')
    expect(command.id).toBe('permission-id')
  })

  it('gRPC 按 code 查询权限 / 当请求合法时 / 应映射为 GetPermissionByCodeQuery', async () => {
    const buses = createBuses()
    const controller = new PermissionManagementGrpcController(buses.commandBus as any, buses.queryBus as any)
    buses.queryBus.execute.mockResolvedValue(createPermission('permission-id', 'permission.code'))

    const result = await controller.getPermissionByCode({ code: 'permission.code' } as any)

    const query = buses.queryBus.execute.mock.calls[0][0]
    expect(query.constructor.name).toBe('GetPermissionByCodeQuery')
    expect(query.code).toBe('permission.code')
    expect(result.code).toBe('permission.code')
  })

  it('gRPC 创建角色模板 / 当请求合法时 / 应映射为 CreateRoleTemplateCommand 并返回 RoleResponse', async () => {
    const buses = createBuses()
    const controller = new PermissionManagementGrpcController(buses.commandBus as any, buses.queryBus as any)
    buses.commandBus.execute.mockResolvedValue(createRole('role-id', 'ROLE_TEMPLATE'))

    const result = await controller.createRoleTemplate({
      name: 'Role Template',
      code: 'ROLE_TEMPLATE',
      description: 'template'
    } as any)

    const command = buses.commandBus.execute.mock.calls[0][0]
    expect(command.constructor.name).toBe('CreateRoleTemplateCommand')
    expect(command.name).toBe('Role Template')
    expect(result.code).toBe('ROLE_TEMPLATE')
  })

  it('gRPC 创建角色实例 / 当请求合法时 / 应映射为 CreateRoleInstanceCommand', async () => {
    const buses = createBuses()
    const controller = new PermissionManagementGrpcController(buses.commandBus as any, buses.queryBus as any)
    buses.commandBus.execute.mockResolvedValue(
      createRole('role-id', 'ROLE_INSTANCE', 'tenant-1', RoleKind.TENANT_INSTANCE)
    )

    await controller.createRoleInstance({
      name: 'Role Instance',
      code: 'ROLE_INSTANCE',
      tenantId: 'tenant-1',
      description: 'instance'
    } as any)

    const command = buses.commandBus.execute.mock.calls[0][0]
    expect(command.constructor.name).toBe('CreateRoleInstanceCommand')
    expect(command.tenantId).toBe('tenant-1')
  })

  it('gRPC 查询角色模板 / 当按 id 查询时 / 应映射为 GetRoleTemplateByIdQuery', async () => {
    const buses = createBuses()
    const controller = new PermissionManagementGrpcController(buses.commandBus as any, buses.queryBus as any)
    buses.queryBus.execute.mockResolvedValue(createRole('role-id', 'ROLE_TEMPLATE'))

    await controller.getRoleTemplateById({ id: 'role-id' } as any)

    const query = buses.queryBus.execute.mock.calls[0][0]
    expect(query.constructor.name).toBe('GetRoleTemplateByIdQuery')
    expect(query.id).toBe('role-id')
  })

  it('gRPC 更新角色模板 / 当请求合法时 / 应映射为 UpdateRoleTemplateCommand', async () => {
    const buses = createBuses()
    const controller = new PermissionManagementGrpcController(buses.commandBus as any, buses.queryBus as any)
    buses.commandBus.execute.mockResolvedValue(createRole('role-id', 'ROLE_TEMPLATE'))

    await controller.updateRoleTemplate({ id: 'role-id', name: 'Updated Name' } as any)

    const command = buses.commandBus.execute.mock.calls[0][0]
    expect(command.constructor.name).toBe('UpdateRoleTemplateCommand')
    expect(command.id).toBe('role-id')
    expect(command.name).toBe('Updated Name')
  })

  it('gRPC 删除角色模板 / 当请求合法时 / 应映射为 DeleteRoleTemplateCommand', async () => {
    const buses = createBuses()
    const controller = new PermissionManagementGrpcController(buses.commandBus as any, buses.queryBus as any)

    await controller.deleteRoleTemplate({ id: 'role-id' } as any)

    const command = buses.commandBus.execute.mock.calls[0][0]
    expect(command.constructor.name).toBe('DeleteRoleTemplateCommand')
    expect(command.id).toBe('role-id')
  })

  it('gRPC 启停角色模板 / 当请求合法时 / 应映射为 SetRoleTemplateEnabledCommand', async () => {
    const buses = createBuses()
    const controller = new PermissionManagementGrpcController(buses.commandBus as any, buses.queryBus as any)
    buses.commandBus.execute.mockResolvedValue(createRole('role-id', 'ROLE_TEMPLATE'))

    await controller.setRoleTemplateEnabled({ id: 'role-id', isEnabled: false } as any)

    const command = buses.commandBus.execute.mock.calls[0][0]
    expect(command.constructor.name).toBe('SetRoleTemplateEnabledCommand')
    expect(command.isEnabled).toBe(false)
  })

  it('gRPC 角色模板权限列表 / 当请求合法时 / 应返回权限列表', async () => {
    const buses = createBuses()
    const controller = new PermissionManagementGrpcController(buses.commandBus as any, buses.queryBus as any)
    buses.queryBus.execute.mockResolvedValue([createPermission('permission-id', 'permission.template')])

    const result = await controller.listRoleTemplatePermissions({ roleTemplateId: 'role-id' } as any)

    const query = buses.queryBus.execute.mock.calls[0][0]
    expect(query.constructor.name).toBe('ListRoleTemplatePermissionsQuery')
    expect(result.permissions).toHaveLength(1)
  })

  it('gRPC 绑定和解绑角色模板权限 / 当请求合法时 / 应映射为对应命令', async () => {
    const buses = createBuses()
    const controller = new PermissionManagementGrpcController(buses.commandBus as any, buses.queryBus as any)

    await controller.assignRoleTemplatePermission({ roleTemplateId: 'role-id', permissionId: 'permission-id' } as any)
    await controller.revokeRoleTemplatePermission({ roleTemplateId: 'role-id', permissionId: 'permission-id' } as any)

    expect(buses.commandBus.execute.mock.calls[0][0].constructor.name).toBe('AssignRoleTemplatePermissionCommand')
    expect(buses.commandBus.execute.mock.calls[1][0].constructor.name).toBe('RevokeRoleTemplatePermissionCommand')
  })

  it('gRPC 从模板创建角色实例 / 当请求合法时 / 应映射为 CreateRoleInstanceFromTemplateCommand', async () => {
    const buses = createBuses()
    const controller = new PermissionManagementGrpcController(buses.commandBus as any, buses.queryBus as any)
    buses.commandBus.execute.mockResolvedValue(
      createRole('role-id', 'ROLE_INSTANCE', 'tenant-1', RoleKind.TENANT_INSTANCE)
    )

    await controller.createRoleInstanceFromTemplate({
      templateRoleId: 'template-id',
      tenantId: 'tenant-1',
      name: 'Role Instance'
    } as any)

    const command = buses.commandBus.execute.mock.calls[0][0]
    expect(command.constructor.name).toBe('CreateRoleInstanceFromTemplateCommand')
    expect(command.templateRoleId).toBe('template-id')
  })

  it('gRPC 更新和启停角色 / 当请求合法时 / 应映射为对应命令', async () => {
    const buses = createBuses()
    const controller = new PermissionManagementGrpcController(buses.commandBus as any, buses.queryBus as any)
    buses.commandBus.execute
      .mockResolvedValueOnce(createRole('role-id', 'ROLE_INSTANCE'))
      .mockResolvedValueOnce(createRole('role-id', 'ROLE_INSTANCE'))

    await controller.updateRole({ id: 'role-id', name: 'Updated Role' } as any)
    await controller.setRoleEnabled({ id: 'role-id', isEnabled: true } as any)

    expect(buses.commandBus.execute.mock.calls[0][0].constructor.name).toBe('UpdateRoleCommand')
    expect(buses.commandBus.execute.mock.calls[1][0].constructor.name).toBe('SetRoleEnabledCommand')
  })

  it('gRPC 删除和查询角色 / 当请求合法时 / 应映射为 DeleteRoleCommand 与 GetRoleByIdQuery', async () => {
    const buses = createBuses()
    const controller = new PermissionManagementGrpcController(buses.commandBus as any, buses.queryBus as any)
    buses.queryBus.execute.mockResolvedValue(createRole('role-id', 'ROLE_INSTANCE'))

    await controller.deleteRole({ id: 'role-id' } as any)
    await controller.getRoleById({ id: 'role-id' } as any)

    expect(buses.commandBus.execute.mock.calls[0][0].constructor.name).toBe('DeleteRoleCommand')
    expect(buses.queryBus.execute.mock.calls[0][0].constructor.name).toBe('GetRoleByIdQuery')
  })

  it('gRPC 角色实例和模板分页查询 / 当请求合法时 / 应返回分页角色结构', async () => {
    const buses = createBuses()
    const controller = new PermissionManagementGrpcController(buses.commandBus as any, buses.queryBus as any)
    buses.queryBus.execute
      .mockResolvedValueOnce({
        roles: [createRole('role-id-1', 'ROLE_INSTANCE', 'tenant-1', RoleKind.TENANT_INSTANCE)],
        total: 1,
        page: 1,
        pageSize: 10
      })
      .mockResolvedValueOnce({
        roles: [createRole('role-id-2', 'ROLE_TEMPLATE')],
        total: 1,
        page: 1,
        pageSize: 10
      })

    const instances = await controller.listRoleInstances({ page: 1, pageSize: 10, tenantId: 'tenant-1' } as any)
    const templates = await controller.listRoleTemplates({ page: 1, pageSize: 10 } as any)

    expect(buses.queryBus.execute.mock.calls[0][0].constructor.name).toBe('ListRoleInstancesQuery')
    expect(buses.queryBus.execute.mock.calls[1][0].constructor.name).toBe('ListRoleTemplatesQuery')
    expect(instances.roles).toHaveLength(1)
    expect(templates.roles).toHaveLength(1)
  })

  it('gRPC 角色权限列表与绑定操作 / 当请求合法时 / 应映射为对应 query 和 command', async () => {
    const buses = createBuses()
    const controller = new PermissionManagementGrpcController(buses.commandBus as any, buses.queryBus as any)
    buses.queryBus.execute.mockResolvedValue([createPermission('permission-id', 'permission.role')])

    const list = await controller.listRolePermissions({ roleId: 'role-id' } as any)
    await controller.assignRolePermission({ roleId: 'role-id', permissionId: 'permission-id' } as any)
    await controller.revokeRolePermission({ roleId: 'role-id', permissionId: 'permission-id' } as any)

    expect(buses.queryBus.execute.mock.calls[0][0].constructor.name).toBe('ListRolePermissionsQuery')
    expect(buses.commandBus.execute.mock.calls[0][0].constructor.name).toBe('AssignRolePermissionCommand')
    expect(buses.commandBus.execute.mock.calls[1][0].constructor.name).toBe('RevokeRolePermissionCommand')
    expect(list.permissions).toHaveLength(1)
  })

  it('gRPC 账号角色绑定操作 / 当请求合法时 / 应映射为 AssignAccountRoleCommand 与 RevokeAccountRoleCommand', async () => {
    const buses = createBuses()
    const controller = new PermissionManagementGrpcController(buses.commandBus as any, buses.queryBus as any)

    await controller.assignAccountRole({
      accountId: 'account-id',
      accountType: AccountType.USER,
      roleId: 'role-id',
      tenantId: 'tenant-1'
    } as any)
    await controller.revokeAccountRole({ accountId: 'account-id', roleId: 'role-id' } as any)

    expect(buses.commandBus.execute.mock.calls[0][0].constructor.name).toBe('AssignAccountRoleCommand')
    expect(buses.commandBus.execute.mock.calls[1][0].constructor.name).toBe('RevokeAccountRoleCommand')
  })

  it('gRPC 账号和角色关联查询 / 当请求合法时 / 应返回 roles 与 account bindings', async () => {
    const buses = createBuses()
    const controller = new PermissionManagementGrpcController(buses.commandBus as any, buses.queryBus as any)
    buses.queryBus.execute
      .mockResolvedValueOnce([createRole('role-id', 'ROLE_ACCOUNT', 'tenant-1', RoleKind.TENANT_INSTANCE)])
      .mockResolvedValueOnce([
        new AccountRole(AccountType.USER, 'account-id', 'role-id', 'tenant-1')
      ])
      .mockResolvedValueOnce({
        availableRoles: [createRole('role-id', 'ROLE_SELECT', 'tenant-1', RoleKind.TENANT_INSTANCE)],
        selectedRoleIds: ['role-id']
      })

    const roles = await controller.listAccountRoles({ accountId: 'account-id', tenantId: 'tenant-1' } as any)
    const accounts = await controller.listRoleAccounts({ roleId: 'role-id' } as any)
    const selection = await controller.getAccountRoleSelection({ accountId: 'account-id', tenantId: 'tenant-1' } as any)

    expect(buses.queryBus.execute.mock.calls[0][0].constructor.name).toBe('ListAccountRolesQuery')
    expect(buses.queryBus.execute.mock.calls[1][0].constructor.name).toBe('ListRoleAccountsQuery')
    expect(buses.queryBus.execute.mock.calls[2][0].constructor.name).toBe('GetAccountRoleSelectionQuery')
    expect(roles.roles).toHaveLength(1)
    expect(accounts.accounts).toEqual([
      {
        accountId: 'account-id',
        accountType: AccountType.USER,
        roleId: 'role-id',
        tenantId: 'tenant-1'
      }
    ])
    expect(selection.selectedRoleIds).toEqual(['role-id'])
  })

  it('gRPC 批量设置账号角色 / 当请求合法时 / 应映射为 SetAccountRolesCommand 并返回角色列表', async () => {
    const buses = createBuses()
    const controller = new PermissionManagementGrpcController(buses.commandBus as any, buses.queryBus as any)
    buses.commandBus.execute.mockResolvedValue([
      createRole('role-id', 'ROLE_SET', 'tenant-1', RoleKind.TENANT_INSTANCE)
    ])

    const result = await controller.setAccountRoles({
      accountId: 'account-id',
      accountType: AccountType.USER,
      tenantId: 'tenant-1',
      roleIds: ['role-id']
    } as any)

    const command = buses.commandBus.execute.mock.calls[0][0]
    expect(command.constructor.name).toBe('SetAccountRolesCommand')
    expect(command.roleIds).toEqual(['role-id'])
    expect(result.roles).toHaveLength(1)
  })
})
