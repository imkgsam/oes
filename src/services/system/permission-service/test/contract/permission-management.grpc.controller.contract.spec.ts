import { PermissionManagementGrpcController } from '../../src/interfaces/grpc/permission-management.grpc.controller'
import { CreatePermissionCommand } from '../../src/application/commands/permission/create-permission.command'
import { GetPermissionByIdQuery } from '../../src/application/queries/permission/get-permission-by-id.query'
import { ListPermissionsPagedQuery } from '../../src/application/queries/permission/list-permissions-paged.query'
import { Permission } from '../../src/domain/aggregates/permission.aggregate'
import { Role } from '../../src/domain/aggregates/role.aggregate'
import { PermissionModule } from '../../src/domain/enums/permission-module.enum'
import { RoleKind } from '../../src/domain/enums/role-kind.enum'
import { RoleKindProto } from '@oes/common/generated/permission_service'

describe('PermissionManagementGrpcController Contract', () => {
  const createBuses = () => ({
    commandBus: {
      execute: jest.fn()
    },
    queryBus: {
      execute: jest.fn()
    }
  })

  it('gRPC 创建权限 / 当请求合法时 / 应映射为 CreatePermissionCommand 并返回 PermissionResponse', async () => {
    const buses = createBuses()
    const controller = new PermissionManagementGrpcController(
      buses.commandBus as any,
      buses.queryBus as any
    )
    const permission = new Permission(
      'permission-id',
      'permission.create',
      PermissionModule.PERMISSION_SERVICE,
      'create permission'
    )

    buses.commandBus.execute.mockResolvedValue(permission)

    const result = await controller.createPermission({
      code: 'permission.create',
      module: 'PERMISSION_SERVICE',
      description: 'create permission'
    } as any)

    expect(buses.commandBus.execute).toHaveBeenCalledWith(
      expect.objectContaining<CreatePermissionCommand>({
        code: 'permission.create',
        module: PermissionModule.PERMISSION_SERVICE,
        description: 'create permission'
      })
    )
    expect(result).toEqual({
      id: 'permission-id',
      code: 'permission.create',
      module: PermissionModule.PERMISSION_SERVICE,
      description: 'create permission',
      allowedScopeLevels: []
    })
  })

  it('gRPC 查询权限 / 当按 id 查询时 / 应映射为 GetPermissionByIdQuery 并返回 PermissionResponse', async () => {
    const buses = createBuses()
    const controller = new PermissionManagementGrpcController(
      buses.commandBus as any,
      buses.queryBus as any
    )
    const permission = new Permission(
      'permission-id',
      'permission.read',
      PermissionModule.PERMISSION_SERVICE,
      undefined
    )

    buses.queryBus.execute.mockResolvedValue(permission)

    const result = await controller.getPermissionById({ id: 'permission-id' } as any)

    expect(buses.queryBus.execute).toHaveBeenCalledWith(
      expect.objectContaining<GetPermissionByIdQuery>({
        id: 'permission-id'
      })
    )
    expect(result).toEqual({
      id: 'permission-id',
      code: 'permission.read',
      module: PermissionModule.PERMISSION_SERVICE,
      description: '',
      allowedScopeLevels: []
    })
  })

  it('gRPC 分页查询权限 / 当请求包含 module 和 keyword 时 / 应映射为 ListPermissionsPagedQuery 并返回分页结构', async () => {
    const buses = createBuses()
    const controller = new PermissionManagementGrpcController(
      buses.commandBus as any,
      buses.queryBus as any
    )

    buses.queryBus.execute.mockResolvedValue({
      permissions: [
        new Permission('permission-id', 'permission.read', PermissionModule.PERMISSION_SERVICE)
      ],
      total: 1,
      page: 2,
      pageSize: 5
    })

    const result = await controller.listPermissionsPaged({
      page: 2,
      pageSize: 5,
      module: 'PERMISSION_SERVICE',
      keyword: 'read'
    } as any)

    expect(buses.queryBus.execute).toHaveBeenCalledWith(
      expect.objectContaining<ListPermissionsPagedQuery>({
        page: 2,
        pageSize: 5,
        module: PermissionModule.PERMISSION_SERVICE,
        keyword: 'read'
      })
    )
    expect(result).toEqual({
      permissions: [
        {
          id: 'permission-id',
          code: 'permission.read',
          module: PermissionModule.PERMISSION_SERVICE,
          description: '',
          allowedScopeLevels: []
        }
      ],
      total: 1,
      page: 2,
      pageSize: 5
    })
  })

  it('gRPC 查询角色列表 / 当返回 Role 聚合时 / 应映射为 proto RoleResponse', async () => {
    const buses = createBuses()
    const controller = new PermissionManagementGrpcController(
      buses.commandBus as any,
      buses.queryBus as any
    )
    const role = new Role(
      'role-id',
      'Admin',
      'ADMIN',
      null,
      RoleKind.SYSTEM_TEMPLATE,
      true,
      undefined,
      null,
      []
    )

    buses.queryBus.execute.mockResolvedValue([role])

    const result = await controller.listPermissionRoles({ permissionId: 'permission-id' } as any)

    expect(result).toEqual({
      roles: [
        {
          id: 'role-id',
          name: 'Admin',
          code: 'ADMIN',
          tenantId: '',
          isSystem: true,
          isEnabled: true,
          description: '',
          roleKind: RoleKindProto.ROLE_KIND_PROTO_SYSTEM_TEMPLATE,
          templateRoleId: ''
        }
      ]
    })
  })
})
