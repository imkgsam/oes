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
import { UpdateRoleCommand } from '../../application/commands/role/update-role.command'
import { SetRoleEnabledCommand } from '../../application/commands/role/set-role-enabled.command'
import { DeleteRoleCommand } from '../../application/commands/role/delete-role.command'
import { AssignRolePermissionCommand } from '../../application/commands/role/assign-role-permission.command'
import { RevokeRolePermissionCommand } from '../../application/commands/role/revoke-role-permission.command'
import { AssignAccountRoleCommand } from '../../application/commands/role/assign-account-role.command'
import { RevokeAccountRoleCommand } from '../../application/commands/role/revoke-account-role.command'
import { GetRoleByIdQuery } from '../../application/queries/role/get-role-by-id.query'
import { ListRolesQuery } from '../../application/queries/role/list-roles.query'
import { ListAccountRolesQuery } from '../../application/queries/role/list-account-roles.query'
import { ListRolePermissionsQuery } from '../../application/queries/role/list-role-permissions.query'
import { ListRoleAccountsQuery } from '../../application/queries/role/list-role-accounts.query'
import { GetAccountRoleSelectionQuery } from '../../application/queries/role/get-account-role-selection.query'
import { AccountRoleSelectionResult } from '../../application/queries/role/get-account-role-selection.handler'
import { SetAccountRolesCommand } from '../../application/commands/role/set-account-roles.command'
import { AccountType } from '../../domain/enums/account-type.enum'
import { PermissionModule } from '../../domain/enums/permission-module.enum'
import { RoleKind } from '../../domain/enums/role-kind.enum'
import { Permission } from '../../domain/aggregates/permission.aggregate'
import { Role } from '../../domain/aggregates/role.aggregate'
import { AccountRole } from '../../domain/vo/account-role.value-object'
import {
  PermissionManagementServiceControllerMethods,
  PermissionManagementServiceController,
  CreatePermissionRequest,
  PermissionResponse,
  DeletePermissionRequest,
  GetPermissionByIdRequest,
  GetPermissionByCodeRequest,
  ListPermissionsRequest,
  ListPermissionsResponse,
  ListPermissionsByModuleRequest,
  CreateRoleRequest,
  UpdateRoleRequest,
  SetRoleEnabledRequest,
  RoleResponse,
  DeleteRoleRequest,
  GetRoleByIdRequest,
  ListRolesRequest,
  ListRolesResponse,
  ListRolePermissionsRequest,
  AssignRolePermissionRequest,
  RevokeRolePermissionRequest,
  AssignAccountRoleRequest,
  RevokeAccountRoleRequest,
  ListAccountRolesRequest,
  ListRoleAccountsRequest,
  ListRoleAccountsResponse,
  AccountRoleBindingResponse,
  GetAccountRoleSelectionRequest,
  AccountRoleSelectionResponse,
  SetAccountRolesRequest
} from '@oes/common/generated/permission_service'

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

  async updateRole(
    request: UpdateRoleRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<RoleResponse> {
    const r: Role = await this.commandBus.execute(
      new UpdateRoleCommand({
        id: request.id!,
        name: Object.prototype.hasOwnProperty.call(request, 'name') ? request.name : undefined,
        description: Object.prototype.hasOwnProperty.call(request, 'description')
          ? request.description
          : undefined
      })
    )
    return this.toRoleResponse(r)
  }

  async setRoleEnabled(
    request: SetRoleEnabledRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<RoleResponse> {
    const r: Role = await this.commandBus.execute(
      new SetRoleEnabledCommand(request.id!, request.isEnabled!)
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

  async listRolePermissions(
    request: ListRolePermissionsRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<ListPermissionsResponse> {
    const list: Permission[] = await this.queryBus.execute(
      new ListRolePermissionsQuery(request.roleId!)
    )
    return { permissions: list.map((p) => this.toPermissionResponse(p)) }
  }

  // ---- Role-Permission binding ----

  async assignRolePermission(
    request: AssignRolePermissionRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<void> {
    await this.commandBus.execute(
      new AssignRolePermissionCommand(request.roleId!, request.permissionId!)
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
        tenantId: request.tenantId!
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

  async listRoleAccounts(
    request: ListRoleAccountsRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<ListRoleAccountsResponse> {
    const list: AccountRole[] = await this.queryBus.execute(
      new ListRoleAccountsQuery(request.roleId!)
    )
    return { accounts: list.map((accountRole) => this.toAccountRoleBindingResponse(accountRole)) }
  }

  async getAccountRoleSelection(
    request: GetAccountRoleSelectionRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<AccountRoleSelectionResponse> {
    const selection: AccountRoleSelectionResult = await this.queryBus.execute(
      new GetAccountRoleSelectionQuery(request.accountId!, request.tenantId!)
    )

    return {
      availableRoles: selection.availableRoles.map((role) => this.toRoleResponse(role)),
      selectedRoleIds: selection.selectedRoleIds
    }
  }

  async setAccountRoles(
    request: SetAccountRolesRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<ListRolesResponse> {
    const roles: Role[] = await this.commandBus.execute(
      new SetAccountRolesCommand({
        accountId: request.accountId!,
        accountType: request.accountType! as AccountType,
        tenantId: request.tenantId!,
        roleIds: request.roleIds ?? []
      })
    )

    return { roles: roles.map((role) => this.toRoleResponse(role)) }
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
      description: r.description ?? '',
      roleKind: r.kind as any,
      templateRoleId: r.templateRoleId ?? ''
    }
  }

  private toAccountRoleBindingResponse(accountRole: AccountRole): AccountRoleBindingResponse {
    return {
      accountId: accountRole.accountId,
      accountType: accountRole.accountType,
      roleId: accountRole.roleId,
      tenantId: accountRole.tenantId
    }
  }
}
