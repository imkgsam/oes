import { Controller, UseFilters } from '@nestjs/common'
import { Metadata } from '@grpc/grpc-js'
import { ValidatingCommandBus } from '@oes/common/cqrs'
import { ValidatingQueryBus } from '@oes/common/cqrs'
import { GrpcExceptionFilter } from '@oes/common/filters'
import { OtelExceptionFilter } from '@oes/common/filters'
import { CreatePermissionCommand } from '../../application/commands/permission/create-permission.command'
import { DeletePermissionCommand } from '../../application/commands/permission/delete-permission.command'
import { GetPermissionByIdQuery } from '../../application/queries/permission/get-permission-by-id.query'
import { GetPermissionByCodeQuery } from '../../application/queries/permission/get-permission-by-code.query'
import { ListPermissionsQuery } from '../../application/queries/permission/list-permissions.query'
import { ListPermissionsByModuleQuery } from '../../application/queries/permission/list-permissions-by-module.query'
import { CreateRoleCommand } from '../../application/commands/role/create-role.command'
import { DeleteRoleCommand } from '../../application/commands/role/delete-role.command'
import { AssignRolePermissionCommand } from '../../application/commands/role/assign-role-permission.command'
import { RevokeRolePermissionCommand } from '../../application/commands/role/revoke-role-permission.command'
import { AssignAccountRoleCommand } from '../../application/commands/role/assign-account-role.command'
import { RevokeAccountRoleCommand } from '../../application/commands/role/revoke-account-role.command'
import { GetRoleByIdQuery } from '../../application/queries/role/get-role-by-id.query'
import { ListRolesQuery } from '../../application/queries/role/list-roles.query'
import { ListAccountRolesQuery } from '../../application/queries/role/list-account-roles.query'
import { AccountType } from '../../domain/enums/account-type.enum'
import { PermissionModule } from '../../domain/enums/permission-module.enum'
import { RoleKind } from '../../domain/enums/role-kind.enum'
import { Permission } from '../../domain/aggregates/permission.aggregate'
import { Role } from '../../domain/aggregates/role.aggregate'
import { permission_service } from '@oes/common/generated'

@Controller()
@UseFilters(OtelExceptionFilter, GrpcExceptionFilter)
@permission_service.PermissionManagementServiceControllerMethods()
export class PermissionManagementGrpcController
  implements permission_service.PermissionManagementServiceController
{
  constructor(
    private readonly commandBus: ValidatingCommandBus,
    private readonly queryBus: ValidatingQueryBus
  ) {}

  // ---- Permission CRUD ----

  async createPermission(
    request: permission_service.CreatePermissionRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<permission_service.PermissionResponse> {
    const p: Permission = await this.commandBus.execute(
      new CreatePermissionCommand(
        request.code!,
        PermissionModule.from(request.module!),
        request.description
      )
    )
    return this.toPermissionResponse(p)
  }

  async deletePermission(
    request: permission_service.DeletePermissionRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<void> {
    await this.commandBus.execute(new DeletePermissionCommand(request.id!))
  }

  async getPermissionById(
    request: permission_service.GetPermissionByIdRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<permission_service.PermissionResponse> {
    const p: Permission = await this.queryBus.execute(new GetPermissionByIdQuery(request.id!))
    return this.toPermissionResponse(p)
  }

  async getPermissionByCode(
    request: permission_service.GetPermissionByCodeRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<permission_service.PermissionResponse> {
    const p: Permission = await this.queryBus.execute(new GetPermissionByCodeQuery(request.code!))
    return this.toPermissionResponse(p)
  }

  async listPermissions(
    request: permission_service.ListPermissionsRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<permission_service.ListPermissionsResponse> {
    const list: Permission[] = await this.queryBus.execute(new ListPermissionsQuery())
    return { permissions: list.map((p) => this.toPermissionResponse(p)) }
  }

  async listPermissionsByModule(
    request: permission_service.ListPermissionsByModuleRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<permission_service.ListPermissionsResponse> {
    const list: Permission[] = await this.queryBus.execute(
      new ListPermissionsByModuleQuery(PermissionModule.from(request.module!))
    )
    return { permissions: list.map((p) => this.toPermissionResponse(p)) }
  }

  // ---- Role CRUD ----

  async createRole(
    request: permission_service.CreateRoleRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<permission_service.RoleResponse> {
    const r: Role = await this.commandBus.execute(
      new CreateRoleCommand({
        name: request.name!,
        code: request.code!,
        tenantId: request.tenantId || undefined,
        isSystem: request.isSystem,
        roleKind:
          request.roleKind === 1
            ? RoleKind.SYSTEM_TEMPLATE
            : request.roleKind === 2
              ? RoleKind.TENANT_INSTANCE
              : undefined,
        templateRoleId: request.templateRoleId || undefined,
        description: request.description
      })
    )
    return this.toRoleResponse(r)
  }

  async deleteRole(
    request: permission_service.DeleteRoleRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<void> {
    await this.commandBus.execute(new DeleteRoleCommand(request.id!))
  }

  async getRoleById(
    request: permission_service.GetRoleByIdRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<permission_service.RoleResponse> {
    const r: Role = await this.queryBus.execute(new GetRoleByIdQuery(request.id!))
    return this.toRoleResponse(r)
  }

  async listRoles(
    request: permission_service.ListRolesRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<permission_service.ListRolesResponse> {
    const list: Role[] = await this.queryBus.execute(new ListRolesQuery())
    return { roles: list.map((r) => this.toRoleResponse(r)) }
  }

  // ---- Role-Permission binding ----

  async assignRolePermission(
    request: permission_service.AssignRolePermissionRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<void> {
    await this.commandBus.execute(
      new AssignRolePermissionCommand(request.roleId!, request.permissionId!)
    )
  }

  async revokeRolePermission(
    request: permission_service.RevokeRolePermissionRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<void> {
    await this.commandBus.execute(
      new RevokeRolePermissionCommand(request.roleId!, request.permissionId!)
    )
  }

  // ---- Account-Role binding ----

  async assignAccountRole(
    request: permission_service.AssignAccountRoleRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<void> {
    await this.commandBus.execute(
      new AssignAccountRoleCommand({
        accountId: request.accountId!,
        accountType: request.accountType! as AccountType,
        roleId: request.roleId!,
        tenantId: request.tenantId!
      })
    )
  }

  async revokeAccountRole(
    request: permission_service.RevokeAccountRoleRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<void> {
    await this.commandBus.execute(new RevokeAccountRoleCommand(request.accountId!, request.roleId!))
  }

  async listAccountRoles(
    request: permission_service.ListAccountRolesRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<permission_service.ListRolesResponse> {
    const list: Role[] = await this.queryBus.execute(
      new ListAccountRolesQuery(request.accountId!, request.tenantId!)
    )
    return { roles: list.map((r) => this.toRoleResponse(r)) }
  }

  // ---- Mapping helpers ----

  private toPermissionResponse(p: Permission): permission_service.PermissionResponse {
    return { id: p.id, code: p.code, module: p.module, description: p.description ?? '' }
  }

  private toRoleResponse(r: Role): permission_service.RoleResponse {
    return {
      id: r.id,
      name: r.name,
      code: r.code,
      tenantId: r.tenantId ?? '',
      isSystem: r.isSystem,
      isEnabled: r.isEnabled,
      description: r.description ?? '',
      roleKind: r.kind as any,
      templateRoleId: r.templateRoleId ?? ''
    }
  }
}
