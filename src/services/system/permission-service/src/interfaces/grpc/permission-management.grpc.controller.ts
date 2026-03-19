import { Controller, UseFilters } from '@nestjs/common'
import { Metadata } from '@grpc/grpc-js'
import { ValidatingCommandBus } from '@oes/common/cqrs'
import { ValidatingQueryBus } from '@oes/common/cqrs'
import { GrpcExceptionFilter } from '@oes/common/filters'
import { OtelExceptionFilter } from '@oes/common/filters'
import { CreatePermissionCommand } from '../../application/commands/permission/create-permission.command'
import {
  BatchCreatePermissionItemInput,
  BatchCreatePermissionsCommand
} from '../../application/commands/permission/batch-create-permissions.command'
import { UpdatePermissionCommand } from '../../application/commands/permission/update-permission.command'
import { DeletePermissionCommand } from '../../application/commands/permission/delete-permission.command'
import { GetPermissionByIdQuery } from '../../application/queries/permission/get-permission-by-id.query'
import { GetPermissionByCodeQuery } from '../../application/queries/permission/get-permission-by-code.query'
import { ListPermissionsQuery } from '../../application/queries/permission/list-permissions.query'
import { ListPermissionsByModuleQuery } from '../../application/queries/permission/list-permissions-by-module.query'
import { ListPermissionsPagedQuery } from '../../application/queries/permission/list-permissions-paged.query'
import { ListPermissionRolesQuery } from '../../application/queries/permission/list-permission-roles.query'
import { CreateRoleCommand } from '../../application/commands/role/create-role.command'
import { CreateRoleTemplateCommand } from '../../application/commands/role/create-role-template.command'
import { CreateRoleInstanceCommand } from '../../application/commands/role/create-role-instance.command'
import { UpdateRoleTemplateCommand } from '../../application/commands/role/update-role-template.command'
import { DeleteRoleTemplateCommand } from '../../application/commands/role/delete-role-template.command'
import { SetRoleTemplateEnabledCommand } from '../../application/commands/role/set-role-template-enabled.command'
import { AssignRoleTemplatePermissionCommand } from '../../application/commands/role/assign-role-template-permission.command'
import { RevokeRoleTemplatePermissionCommand } from '../../application/commands/role/revoke-role-template-permission.command'
import { CreateRoleInstanceFromTemplateCommand } from '../../application/commands/role/create-role-instance-from-template.command'
import { UpdateRoleCommand } from '../../application/commands/role/update-role.command'
import { SetRoleEnabledCommand } from '../../application/commands/role/set-role-enabled.command'
import { DeleteRoleCommand } from '../../application/commands/role/delete-role.command'
import { AssignRolePermissionCommand } from '../../application/commands/role/assign-role-permission.command'
import { RevokeRolePermissionCommand } from '../../application/commands/role/revoke-role-permission.command'
import { AssignAccountRoleCommand } from '../../application/commands/role/assign-account-role.command'
import { RevokeAccountRoleCommand } from '../../application/commands/role/revoke-account-role.command'
import { GetRoleByIdQuery } from '../../application/queries/role/get-role-by-id.query'
import { GetRoleTemplateByIdQuery } from '../../application/queries/role/get-role-template-by-id.query'
import { ListRolesQuery } from '../../application/queries/role/list-roles.query'
import { ListRoleInstancesQuery } from '../../application/queries/role/list-role-instances.query'
import { ListRoleTemplatesQuery } from '../../application/queries/role/list-role-templates.query'
import { ListAccountRolesQuery } from '../../application/queries/role/list-account-roles.query'
import { ListRolePermissionsQuery } from '../../application/queries/role/list-role-permissions.query'
import { ListRoleTemplatePermissionsQuery } from '../../application/queries/role/list-role-template-permissions.query'
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
  BatchCreatePermissionsRequest,
  UpdatePermissionRequest,
  PermissionResponse,
  DeletePermissionRequest,
  GetPermissionByIdRequest,
  GetPermissionByCodeRequest,
  ListPermissionRolesRequest,
  ListPermissionsRequest,
  ListPermissionsResponse,
  ListPermissionsByModuleRequest,
  ListPermissionsPagedRequest,
  PagedPermissionsResponse,
  CreateRoleRequest,
  CreateRoleTemplateRequest,
  CreateRoleInstanceRequest,
  GetRoleTemplateByIdRequest,
  UpdateRoleTemplateRequest,
  DeleteRoleTemplateRequest,
  SetRoleTemplateEnabledRequest,
  ListRoleTemplatePermissionsRequest,
  AssignRoleTemplatePermissionRequest,
  RevokeRoleTemplatePermissionRequest,
  CreateRoleInstanceFromTemplateRequest,
  UpdateRoleRequest,
  SetRoleEnabledRequest,
  RoleResponse,
  DeleteRoleRequest,
  GetRoleByIdRequest,
  ListRolesRequest,
  ListRolesResponse,
  ListRoleInstancesRequest,
  ListRoleTemplatesRequest,
  PagedRolesResponse,
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
        request.module! as PermissionModule,
        request.description
      )
    )
    return this.toPermissionResponse(p)
  }

  async batchCreatePermissions(
    request: BatchCreatePermissionsRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<ListPermissionsResponse> {
    const created: Permission[] = await this.commandBus.execute(
      new BatchCreatePermissionsCommand({
        permissions: (request.permissions ?? []).map(
          (permission) =>
            new BatchCreatePermissionItemInput({
              code: permission.code!,
              module: permission.module! as PermissionModule,
              description: permission.description || undefined
            })
        )
      })
    )

    return { permissions: created.map((permission) => this.toPermissionResponse(permission)) }
  }

  async updatePermission(
    request: UpdatePermissionRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<PermissionResponse> {
    const p: Permission = await this.commandBus.execute(
      new UpdatePermissionCommand({
        id: request.id!,
        module: request.module! as PermissionModule,
        description: Object.prototype.hasOwnProperty.call(request, 'description')
          ? request.description
          : undefined
      })
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




  async listPermissionsPaged(
    request: ListPermissionsPagedRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<PagedPermissionsResponse> {
    const result: {
      permissions: Permission[]
      total: number
      page: number
      pageSize: number
    } = await this.queryBus.execute(
      new ListPermissionsPagedQuery({
        page: request.page || 1,
        pageSize: request.pageSize || 20,
        module: request.module ? PermissionModule.from(request.module) : undefined,
        keyword: request.keyword || undefined
      })
    )

    return {
      permissions: result.permissions.map((permission) => this.toPermissionResponse(permission)),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize
    }
  }

  async listPermissionRoles(
    request: ListPermissionRolesRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<ListRolesResponse> {
    const list: Role[] = await this.queryBus.execute(
      new ListPermissionRolesQuery(request.permissionId!)
    )
    return { roles: list.map((role) => this.toRoleResponse(role)) }
  }

  // ---- Role CRUD ----


  async createRoleTemplate(
    request: CreateRoleTemplateRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<RoleResponse> {
    const r: Role = await this.commandBus.execute(
      new CreateRoleTemplateCommand({
        name: request.name!,
        code: request.code!,
        description: request.description || undefined
      })
    )
    return this.toRoleResponse(r)
  }

  async createRoleInstance(
    request: CreateRoleInstanceRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<RoleResponse> {
    const r: Role = await this.commandBus.execute(
      new CreateRoleInstanceCommand({
        name: request.name!,
        code: request.code!,
        tenantId: request.tenantId!,
        description: request.description || undefined,
        templateRoleId: request.templateRoleId || undefined
      })
    )
    return this.toRoleResponse(r)
  }

  async getRoleTemplateById(
    request: GetRoleTemplateByIdRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<RoleResponse> {
    const r: Role = await this.queryBus.execute(new GetRoleTemplateByIdQuery(request.id!))
    return this.toRoleResponse(r)
  }

  async updateRoleTemplate(
    request: UpdateRoleTemplateRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<RoleResponse> {
    const r: Role = await this.commandBus.execute(
      new UpdateRoleTemplateCommand({
        id: request.id!,
        name: Object.prototype.hasOwnProperty.call(request, 'name') ? request.name : undefined,
        description: Object.prototype.hasOwnProperty.call(request, 'description')
          ? request.description
          : undefined
      })
    )
    return this.toRoleResponse(r)
  }

  async deleteRoleTemplate(
    request: DeleteRoleTemplateRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<void> {
    await this.commandBus.execute(new DeleteRoleTemplateCommand(request.id!))
  }

  async setRoleTemplateEnabled(
    request: SetRoleTemplateEnabledRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<RoleResponse> {
    const r: Role = await this.commandBus.execute(
      new SetRoleTemplateEnabledCommand(request.id!, request.isEnabled!)
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

  async listRoleInstances(
    request: ListRoleInstancesRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<PagedRolesResponse> {
    const result: {
      roles: Role[]
      total: number
      page: number
      pageSize: number
    } = await this.queryBus.execute(
      new ListRoleInstancesQuery({
        page: request.page || 1,
        pageSize: request.pageSize || 20,
        tenantId: request.tenantId || undefined,
        keyword: request.keyword || undefined
      })
    )

    return {
      roles: result.roles.map((role) => this.toRoleResponse(role)),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize
    }
  }

  async listRoleTemplates(
    request: ListRoleTemplatesRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<PagedRolesResponse> {
    const result: {
      roles: Role[]
      total: number
      page: number
      pageSize: number
    } = await this.queryBus.execute(
      new ListRoleTemplatesQuery({
        page: request.page || 1,
        pageSize: request.pageSize || 20,
        keyword: request.keyword || undefined
      })
    )

    return {
      roles: result.roles.map((role) => this.toRoleResponse(role)),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize
    }
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

  async listRoleTemplatePermissions(
    request: ListRoleTemplatePermissionsRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<ListPermissionsResponse> {
    const list: Permission[] = await this.queryBus.execute(
      new ListRoleTemplatePermissionsQuery(request.roleTemplateId!)
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

  async assignRoleTemplatePermission(
    request: AssignRoleTemplatePermissionRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<void> {
    await this.commandBus.execute(
      new AssignRoleTemplatePermissionCommand(request.roleTemplateId!, request.permissionId!)
    )
  }

  async revokeRoleTemplatePermission(
    request: RevokeRoleTemplatePermissionRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<void> {
    await this.commandBus.execute(
      new RevokeRoleTemplatePermissionCommand(request.roleTemplateId!, request.permissionId!)
    )
  }

  async createRoleInstanceFromTemplate(
    request: CreateRoleInstanceFromTemplateRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<RoleResponse> {
    const r: Role = await this.commandBus.execute(
      new CreateRoleInstanceFromTemplateCommand({
        templateRoleId: request.templateRoleId!,
        tenantId: request.tenantId!,
        name: request.name || undefined,
        code: request.code || undefined,
        description: request.description || undefined
      })
    )
    return this.toRoleResponse(r)
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
        effectiveAt: request.effectiveAt || undefined,
        expiresAt: request.expiresAt || undefined
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
