import { Controller, UseFilters } from '@nestjs/common'
import { Metadata } from '@grpc/grpc-js'
import {
  PermissionManagementServiceController,
  PermissionManagementServiceControllerMethods,
  CreatePermissionRequest,
  DeletePermissionRequest,
  GetPermissionByIdRequest,
  GetPermissionByCodeRequest,
  ListPermissionsRequest,
  ListPermissionsByModuleRequest,
  PermissionResponse,
  ListPermissionsResponse,
  CreateRoleRequest,
  DeleteRoleRequest,
  GetRoleByIdRequest,
  ListRolesRequest,
  RoleResponse,
  ListRolesResponse,
  AssignRolePermissionRequest,
  RevokeRolePermissionRequest,
  AssignAccountRoleRequest,
  RevokeAccountRoleRequest,
  ListAccountRolesRequest
} from '@oes/common/generated/permission_service/permission_management'
import { ValidatingCommandBus } from '@oes/common/cqrs/validating-command-bus'
import { ValidatingQueryBus } from '@oes/common/cqrs/validating-query-bus'
import { GrpcExceptionFilter } from '@oes/common/core/filters/grpc-exception.filter'
import { OtelExceptionFilter } from '@oes/common/core/filters/otel-exception.filter'

import { CreatePermissionCommand } from 'src/application/commands/permission/create-permission.command'
import { DeletePermissionCommand } from 'src/application/commands/permission/delete-permission.command'
import { GetPermissionByIdQuery } from 'src/application/queries/permission/get-permission-by-id.query'
import { GetPermissionByCodeQuery } from 'src/application/queries/permission/get-permission-by-code.query'
import { ListPermissionsQuery } from 'src/application/queries/permission/list-permissions.query'
import { ListPermissionsByModuleQuery } from 'src/application/queries/permission/list-permissions-by-module.query'
import { CreateRoleCommand } from 'src/application/commands/role/create-role.command'
import { DeleteRoleCommand } from 'src/application/commands/role/delete-role.command'
import { AssignRolePermissionCommand } from 'src/application/commands/role/assign-role-permission.command'
import { RevokeRolePermissionCommand } from 'src/application/commands/role/revoke-role-permission.command'
import { AssignAccountRoleCommand } from 'src/application/commands/role/assign-account-role.command'
import { RevokeAccountRoleCommand } from 'src/application/commands/role/revoke-account-role.command'
import { GetRoleByIdQuery } from 'src/application/queries/role/get-role-by-id.query'
import { ListRolesQuery } from 'src/application/queries/role/list-roles.query'
import { ListAccountRolesQuery } from 'src/application/queries/role/list-account-roles.query'
import { AccountType } from 'src/domain/enums/account-type.enum'
import { PermissionModule } from 'src/domain/enums/permission-module.enum'
import { Permission } from 'src/domain/aggregates/permission.aggregate'
import { Role } from 'src/domain/aggregates/role.aggregate'

@Controller()
@UseFilters(OtelExceptionFilter, GrpcExceptionFilter)
@PermissionManagementServiceControllerMethods()
export class PermissionManagementGrpcController implements PermissionManagementServiceController {
  constructor(
    private readonly commandBus: ValidatingCommandBus,
    private readonly queryBus: ValidatingQueryBus
  ) {}

  // ---- Permission CRUD ----

  async createPermission(
    request: CreatePermissionRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<PermissionResponse> {
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
    request: DeletePermissionRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<void> {
    await this.commandBus.execute(new DeletePermissionCommand(request.id!))
  }

  async getPermissionById(
    request: GetPermissionByIdRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<PermissionResponse> {
    const p: Permission = await this.queryBus.execute(new GetPermissionByIdQuery(request.id!))
    return this.toPermissionResponse(p)
  }

  async getPermissionByCode(
    request: GetPermissionByCodeRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<PermissionResponse> {
    const p: Permission = await this.queryBus.execute(new GetPermissionByCodeQuery(request.code!))
    return this.toPermissionResponse(p)
  }

  async listPermissions(
    request: ListPermissionsRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<ListPermissionsResponse> {
    const list: Permission[] = await this.queryBus.execute(new ListPermissionsQuery())
    return { permissions: list.map((p) => this.toPermissionResponse(p)) }
  }

  async listPermissionsByModule(
    request: ListPermissionsByModuleRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<ListPermissionsResponse> {
    const list: Permission[] = await this.queryBus.execute(
      new ListPermissionsByModuleQuery(PermissionModule.from(request.module!))
    )
    return { permissions: list.map((p) => this.toPermissionResponse(p)) }
  }

  // ---- Role CRUD ----

  async createRole(
    request: CreateRoleRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<RoleResponse> {
    const r: Role = await this.commandBus.execute(
      new CreateRoleCommand({
        name: request.name!,
        code: request.code!,
        createdBy: request.createdBy!,
        tenantId: request.tenantId || undefined,
        isSystem: request.isSystem,
        description: request.description
      })
    )
    return this.toRoleResponse(r)
  }

  async deleteRole(request: DeleteRoleRequest, metadata?: Metadata, ...rest: any): Promise<void> {
    await this.commandBus.execute(new DeleteRoleCommand(request.id!))
  }

  async getRoleById(
    request: GetRoleByIdRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<RoleResponse> {
    const r: Role = await this.queryBus.execute(new GetRoleByIdQuery(request.id!))
    return this.toRoleResponse(r)
  }

  async listRoles(
    request: ListRolesRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<ListRolesResponse> {
    const list: Role[] = await this.queryBus.execute(new ListRolesQuery())
    return { roles: list.map((r) => this.toRoleResponse(r)) }
  }

  // ---- Role-Permission binding ----

  async assignRolePermission(
    request: AssignRolePermissionRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<void> {
    await this.commandBus.execute(
      new AssignRolePermissionCommand(request.roleId!, request.permissionId!, request.createdBy!)
    )
  }

  async revokeRolePermission(
    request: RevokeRolePermissionRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<void> {
    await this.commandBus.execute(
      new RevokeRolePermissionCommand(request.roleId!, request.permissionId!)
    )
  }

  // ---- Account-Role binding ----

  async assignAccountRole(
    request: AssignAccountRoleRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<void> {
    await this.commandBus.execute(
      new AssignAccountRoleCommand({
        accountId: request.accountId!,
        accountType: request.accountType! as AccountType,
        roleId: request.roleId!,
        tenantId: request.tenantId!,
        createdBy: request.createdBy!
      })
    )
  }

  async revokeAccountRole(
    request: RevokeAccountRoleRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<void> {
    await this.commandBus.execute(new RevokeAccountRoleCommand(request.accountId!, request.roleId!))
  }

  async listAccountRoles(
    request: ListAccountRolesRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<ListRolesResponse> {
    const list: Role[] = await this.queryBus.execute(
      new ListAccountRolesQuery(request.accountId!, request.tenantId!)
    )
    return { roles: list.map((r) => this.toRoleResponse(r)) }
  }

  // ---- Mapping helpers ----

  private toPermissionResponse(p: Permission): PermissionResponse {
    return { id: p.id, code: p.code, module: p.module, description: p.description ?? '' }
  }

  private toRoleResponse(r: Role): RoleResponse {
    return {
      id: r.id,
      name: r.name,
      code: r.code,
      tenantId: r.tenantId ?? '',
      isSystem: r.isSystem,
      isEnabled: r.isEnabled,
      description: r.description ?? ''
    }
  }
}
