import { Controller, UseFilters, UseGuards } from '@nestjs/common'
import { Metadata } from '@grpc/grpc-js'
import { ValidatingCommandBus, ValidatingQueryBus } from '@oes/common/cqrs'
import { GrpcExceptionFilter, OtelExceptionFilter } from '@oes/common/filters'
import {
  AuthenticatedOperatorGuard,
  InternalServiceGuard,
  getAuthenticatedGrpcRequestContext,
  OperatorContextPayload,
  RequireAuthenticatedOperator
} from '@oes/common/security'
import {
  PermissionManagementServiceController,
  PermissionManagementServiceControllerMethods,
  AssignAccountRoleRequest,
  AssignRolePermissionRequest,
  AssignRoleTemplatePermissionRequest,
  BatchCreatePermissionsRequest,
  CreatePermissionRequest,
  CreateRoleInstanceFromTemplateRequest,
  CreateRoleInstanceRequest,
  CreateRoleTemplateRequest,
  DeletePermissionRequest,
  DeleteRoleRequest,
  DeleteRoleTemplateRequest,
  GetAccountRoleSelectionRequest,
  GetPermissionByCodeRequest,
  GetPermissionByIdRequest,
  GetRoleByIdRequest,
  GetRoleTemplateByIdRequest,
  ListAccountRolesRequest,
  ListPermissionRolesRequest,
  ListPermissionsPagedRequest,
  ListPermissionsResponse,
  ListRoleAccountsRequest,
  ListRoleAccountsResponse,
  ListRoleInstancesRequest,
  ListRolePermissionsRequest,
  ListRoleTemplatePermissionsRequest,
  ListRoleTemplatesRequest,
  ListRolesResponse,
  PagedPermissionsResponse,
  PagedRolesResponse,
  PermissionResponse,
  RevokeAccountRoleRequest,
  RevokeRolePermissionRequest,
  RevokeRoleTemplatePermissionRequest,
  RoleResponse,
  SetAccountRolesRequest,
  SetRoleEnabledRequest,
  SetRoleTemplateEnabledRequest,
  UpdatePermissionRequest,
  UpdateRoleRequest,
  UpdateRoleTemplateRequest,
  AccountRoleSelectionResponse
} from '@oes/common/generated/permission_service'
import { ManagementAuthorizationGuard } from '../guards'
import { RequireManagementPermission } from '../decorators'
import { MANAGEMENT_PERMISSION_CODES } from '../../common/constants/authorization'
import { CreatePermissionCommand } from '../../application/commands/permission/create-permission.command'
import {
  BatchCreatePermissionItemInput,
  BatchCreatePermissionsCommand
} from '../../application/commands/permission/batch-create-permissions.command'
import { UpdatePermissionCommand } from '../../application/commands/permission/update-permission.command'
import { DeletePermissionCommand } from '../../application/commands/permission/delete-permission.command'
import { GetPermissionByIdQuery } from '../../application/queries/permission/get-permission-by-id.query'
import { GetPermissionByCodeQuery } from '../../application/queries/permission/get-permission-by-code.query'
import { ListPermissionsPagedQuery } from '../../application/queries/permission/list-permissions-paged.query'
import { ListPermissionRolesQuery } from '../../application/queries/permission/list-permission-roles.query'
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
import { SetAccountRolesCommand } from '../../application/commands/role/set-account-roles.command'
import { GetRoleByIdQuery } from '../../application/queries/role/get-role-by-id.query'
import { GetRoleTemplateByIdQuery } from '../../application/queries/role/get-role-template-by-id.query'
import { ListRoleInstancesQuery } from '../../application/queries/role/list-role-instances.query'
import { ListRoleTemplatesQuery } from '../../application/queries/role/list-role-templates.query'
import { ListAccountRolesQuery } from '../../application/queries/role/list-account-roles.query'
import { ListRolePermissionsQuery } from '../../application/queries/role/list-role-permissions.query'
import { ListRoleTemplatePermissionsQuery } from '../../application/queries/role/list-role-template-permissions.query'
import { ListRoleAccountsQuery } from '../../application/queries/role/list-role-accounts.query'
import { GetAccountRoleSelectionQuery } from '../../application/queries/role/get-account-role-selection.query'
import { AccountRoleSelectionResult } from '../../application/queries/role/get-account-role-selection.handler'
import { resolveOperatorScope } from '../../application/queries/role/operator-scope'
import { PermissionModule } from '../../domain/enums/permission-module.enum'
import { AccountType } from '../../domain/enums/account-type.enum'
import { Permission } from '../../domain/aggregates/permission.aggregate'
import { Role } from '../../domain/aggregates/role.aggregate'
import { AccountRole } from '../../domain/vo/account-role.value-object'
import {
  toAccountRoleBindingResponse,
  toPermissionResponse,
  toRoleResponse
} from './permission-management.grpc.presenter'

@Controller()
@UseFilters(OtelExceptionFilter, GrpcExceptionFilter)
@RequireAuthenticatedOperator()
@UseGuards(InternalServiceGuard, AuthenticatedOperatorGuard, ManagementAuthorizationGuard)
@PermissionManagementServiceControllerMethods()
export class PermissionManagementGrpcController implements PermissionManagementServiceController {
  constructor(
    private readonly commandBus: ValidatingCommandBus,
    private readonly queryBus: ValidatingQueryBus
  ) {}

  @RequireManagementPermission(MANAGEMENT_PERMISSION_CODES.CREATE_PERMISSION)
  async createPermission(
    request: CreatePermissionRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<PermissionResponse> {
    const permission: Permission = await this.commandBus.execute(
      new CreatePermissionCommand(
        request.code!,
        request.module! as PermissionModule,
        request.description
      )
    )
    return toPermissionResponse(permission)
  }

  @RequireManagementPermission(MANAGEMENT_PERMISSION_CODES.CREATE_PERMISSION)
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
    return { permissions: created.map(toPermissionResponse) }
  }

  @RequireManagementPermission(MANAGEMENT_PERMISSION_CODES.UPDATE_PERMISSION)
  async updatePermission(
    request: UpdatePermissionRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<PermissionResponse> {
    const permission: Permission = await this.commandBus.execute(
      new UpdatePermissionCommand({
        id: request.id!,
        module: request.module! as PermissionModule,
        description: Object.prototype.hasOwnProperty.call(request, 'description')
          ? request.description
          : undefined
      })
    )
    return toPermissionResponse(permission)
  }

  @RequireManagementPermission(MANAGEMENT_PERMISSION_CODES.DELETE_PERMISSION)
  async deletePermission(
    request: DeletePermissionRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<void> {
    await this.commandBus.execute(new DeletePermissionCommand(request.id!))
  }

  @RequireManagementPermission(MANAGEMENT_PERMISSION_CODES.VIEW_PERMISSION_DETAIL)
  async getPermissionById(
    request: GetPermissionByIdRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<PermissionResponse> {
    const permission: Permission = await this.queryBus.execute(new GetPermissionByIdQuery(request.id!))
    return toPermissionResponse(permission)
  }

  @RequireManagementPermission(MANAGEMENT_PERMISSION_CODES.VIEW_PERMISSION_DETAIL_BY_CODE)
  async getPermissionByCode(
    request: GetPermissionByCodeRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<PermissionResponse> {
    const permission: Permission = await this.queryBus.execute(
      new GetPermissionByCodeQuery(request.code!)
    )
    return toPermissionResponse(permission)
  }

  @RequireManagementPermission(MANAGEMENT_PERMISSION_CODES.VIEW_PERMISSION)
  async listPermissionsPaged(
    request: ListPermissionsPagedRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<PagedPermissionsResponse> {
    const result: { permissions: Permission[]; total: number; page: number; pageSize: number } =
      await this.queryBus.execute(
        new ListPermissionsPagedQuery({
          page: request.page || 1,
          pageSize: request.pageSize || 20,
          module: request.module ? PermissionModule.from(request.module) : undefined,
          keyword: request.keyword || undefined
        })
      )

    return {
      permissions: result.permissions.map(toPermissionResponse),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize
    }
  }

  @RequireManagementPermission(MANAGEMENT_PERMISSION_CODES.VIEW_ROLE)
  async listPermissionRoles(
    request: ListPermissionRolesRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<ListRolesResponse> {
    const roles: Role[] = await this.queryBus.execute(new ListPermissionRolesQuery(request.permissionId!))
    return { roles: roles.map(toRoleResponse) }
  }

  @RequireManagementPermission(MANAGEMENT_PERMISSION_CODES.CREATE_ROLE)
  async createRoleTemplate(
    request: CreateRoleTemplateRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<RoleResponse> {
    const role: Role = await this.commandBus.execute(
      new CreateRoleTemplateCommand({
        name: request.name!,
        code: request.code!,
        description: request.description || undefined
      })
    )
    return toRoleResponse(role)
  }

  @RequireManagementPermission(MANAGEMENT_PERMISSION_CODES.CREATE_ROLE)
  async createRoleInstance(
    request: CreateRoleInstanceRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<RoleResponse> {
    const role: Role = await this.commandBus.execute(
      new CreateRoleInstanceCommand({
        name: request.name!,
        code: request.code!,
        tenantId: request.tenantId!,
        description: request.description || undefined,
        templateRoleId: request.templateRoleId || undefined
      })
    )
    return toRoleResponse(role)
  }

  @RequireManagementPermission(MANAGEMENT_PERMISSION_CODES.VIEW_ROLE_DETAIL)
  async getRoleTemplateById(
    request: GetRoleTemplateByIdRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<RoleResponse> {
    const role: Role = await this.queryBus.execute(
      new GetRoleTemplateByIdQuery(request.id!, this.getOperatorScope(request))
    )
    return toRoleResponse(role)
  }

  @RequireManagementPermission(MANAGEMENT_PERMISSION_CODES.UPDATE_ROLE)
  async updateRoleTemplate(
    request: UpdateRoleTemplateRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<RoleResponse> {
    const role: Role = await this.commandBus.execute(
      new UpdateRoleTemplateCommand({
        id: request.id!,
        name: Object.prototype.hasOwnProperty.call(request, 'name') ? request.name : undefined,
        description: Object.prototype.hasOwnProperty.call(request, 'description')
          ? request.description
          : undefined
      })
    )
    return toRoleResponse(role)
  }

  @RequireManagementPermission(MANAGEMENT_PERMISSION_CODES.DELETE_ROLE)
  async deleteRoleTemplate(
    request: DeleteRoleTemplateRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<void> {
    await this.commandBus.execute(new DeleteRoleTemplateCommand(request.id!))
  }

  @RequireManagementPermission(MANAGEMENT_PERMISSION_CODES.UPDATE_ROLE)
  async setRoleTemplateEnabled(
    request: SetRoleTemplateEnabledRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<RoleResponse> {
    const role: Role = await this.commandBus.execute(
      new SetRoleTemplateEnabledCommand(request.id!, request.isEnabled!)
    )
    return toRoleResponse(role)
  }

  @RequireManagementPermission(MANAGEMENT_PERMISSION_CODES.UPDATE_ROLE)
  async updateRole(
    request: UpdateRoleRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<RoleResponse> {
    const role: Role = await this.commandBus.execute(
      new UpdateRoleCommand({
        id: request.id!,
        name: Object.prototype.hasOwnProperty.call(request, 'name') ? request.name : undefined,
        description: Object.prototype.hasOwnProperty.call(request, 'description')
          ? request.description
          : undefined
      })
    )
    return toRoleResponse(role)
  }

  @RequireManagementPermission(MANAGEMENT_PERMISSION_CODES.UPDATE_ROLE)
  async setRoleEnabled(
    request: SetRoleEnabledRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<RoleResponse> {
    const role: Role = await this.commandBus.execute(
      new SetRoleEnabledCommand(request.id!, request.isEnabled!)
    )
    return toRoleResponse(role)
  }

  @RequireManagementPermission(MANAGEMENT_PERMISSION_CODES.DELETE_ROLE)
  async deleteRole(request: DeleteRoleRequest, metadata?: Metadata, ...rest: any): Promise<void> {
    await this.commandBus.execute(new DeleteRoleCommand(request.id!))
  }

  @RequireManagementPermission(MANAGEMENT_PERMISSION_CODES.VIEW_ROLE_DETAIL)
  async getRoleById(
    request: GetRoleByIdRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<RoleResponse> {
    const role: Role = await this.queryBus.execute(
      new GetRoleByIdQuery(request.id!, this.getOperatorScope(request))
    )
    return toRoleResponse(role)
  }

  @RequireManagementPermission(MANAGEMENT_PERMISSION_CODES.VIEW_ROLE)
  async listRoleInstances(
    request: ListRoleInstancesRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<PagedRolesResponse> {
    const result: { roles: Role[]; total: number; page: number; pageSize: number } =
      await this.queryBus.execute(
        new ListRoleInstancesQuery({
          page: request.page || 1,
          pageSize: request.pageSize || 20,
          tenantId: request.tenantId || undefined,
          keyword: request.keyword || undefined,
          operatorScope: this.getOperatorScope(request)
        })
      )

    return {
      roles: result.roles.map(toRoleResponse),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize
    }
  }

  @RequireManagementPermission(MANAGEMENT_PERMISSION_CODES.VIEW_ROLE)
  async listRoleTemplates(
    request: ListRoleTemplatesRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<PagedRolesResponse> {
    const result: { roles: Role[]; total: number; page: number; pageSize: number } =
      await this.queryBus.execute(
        new ListRoleTemplatesQuery({
          page: request.page || 1,
          pageSize: request.pageSize || 20,
          keyword: request.keyword || undefined,
          operatorScope: this.getOperatorScope(request)
        })
      )

    return {
      roles: result.roles.map(toRoleResponse),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize
    }
  }

  @RequireManagementPermission(MANAGEMENT_PERMISSION_CODES.VIEW_ROLE_DETAIL)
  async listRolePermissions(
    request: ListRolePermissionsRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<ListPermissionsResponse> {
    const permissions: Permission[] = await this.queryBus.execute(
      new ListRolePermissionsQuery(request.roleId!)
    )
    return { permissions: permissions.map(toPermissionResponse) }
  }

  @RequireManagementPermission(MANAGEMENT_PERMISSION_CODES.VIEW_ROLE_DETAIL)
  async listRoleTemplatePermissions(
    request: ListRoleTemplatePermissionsRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<ListPermissionsResponse> {
    const permissions: Permission[] = await this.queryBus.execute(
      new ListRoleTemplatePermissionsQuery(request.roleTemplateId!)
    )
    return { permissions: permissions.map(toPermissionResponse) }
  }

  @RequireManagementPermission(MANAGEMENT_PERMISSION_CODES.ASSIGN_ROLE_PERMISSION)
  async assignRolePermission(
    request: AssignRolePermissionRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<void> {
    await this.commandBus.execute(
      new AssignRolePermissionCommand(request.roleId!, request.permissionId!)
    )
  }

  @RequireManagementPermission(MANAGEMENT_PERMISSION_CODES.ASSIGN_ROLE_PERMISSION)
  async assignRoleTemplatePermission(
    request: AssignRoleTemplatePermissionRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<void> {
    await this.commandBus.execute(
      new AssignRoleTemplatePermissionCommand(request.roleTemplateId!, request.permissionId!)
    )
  }

  @RequireManagementPermission(MANAGEMENT_PERMISSION_CODES.REVOKE_ROLE_PERMISSION)
  async revokeRoleTemplatePermission(
    request: RevokeRoleTemplatePermissionRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<void> {
    await this.commandBus.execute(
      new RevokeRoleTemplatePermissionCommand(request.roleTemplateId!, request.permissionId!)
    )
  }

  @RequireManagementPermission(MANAGEMENT_PERMISSION_CODES.CREATE_ROLE)
  async createRoleInstanceFromTemplate(
    request: CreateRoleInstanceFromTemplateRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<RoleResponse> {
    const role: Role = await this.commandBus.execute(
      new CreateRoleInstanceFromTemplateCommand({
        templateRoleId: request.templateRoleId!,
        tenantId: request.tenantId!,
        name: request.name || undefined,
        code: request.code || undefined,
        description: request.description || undefined
      })
    )
    return toRoleResponse(role)
  }

  @RequireManagementPermission(MANAGEMENT_PERMISSION_CODES.REVOKE_ROLE_PERMISSION)
  async revokeRolePermission(
    request: RevokeRolePermissionRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<void> {
    await this.commandBus.execute(
      new RevokeRolePermissionCommand(request.roleId!, request.permissionId!)
    )
  }

  @RequireManagementPermission(MANAGEMENT_PERMISSION_CODES.ASSIGN_ACCOUNT_ROLE)
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

  @RequireManagementPermission(MANAGEMENT_PERMISSION_CODES.REVOKE_ACCOUNT_ROLE)
  async revokeAccountRole(
    request: RevokeAccountRoleRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<void> {
    await this.commandBus.execute(new RevokeAccountRoleCommand(request.accountId!, request.roleId!))
  }

  @RequireManagementPermission(MANAGEMENT_PERMISSION_CODES.VIEW_ACCOUNT_ROLE)
  async listAccountRoles(
    request: ListAccountRolesRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<ListRolesResponse> {
    const roles: Role[] = await this.queryBus.execute(
      new ListAccountRolesQuery(request.accountId!, request.tenantId!)
    )
    return { roles: roles.map(toRoleResponse) }
  }

  @RequireManagementPermission(MANAGEMENT_PERMISSION_CODES.VIEW_ACCOUNT_ROLE)
  async listRoleAccounts(
    request: ListRoleAccountsRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<ListRoleAccountsResponse> {
    const accounts: AccountRole[] = await this.queryBus.execute(
      new ListRoleAccountsQuery(request.roleId!)
    )
    return { accounts: accounts.map(toAccountRoleBindingResponse) }
  }

  @RequireManagementPermission(MANAGEMENT_PERMISSION_CODES.VIEW_ACCOUNT_ROLE)
  async getAccountRoleSelection(
    request: GetAccountRoleSelectionRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<AccountRoleSelectionResponse> {
    const selection: AccountRoleSelectionResult = await this.queryBus.execute(
      new GetAccountRoleSelectionQuery(request.accountId!, request.tenantId!)
    )
    return {
      availableRoles: selection.availableRoles.map(toRoleResponse),
      selectedRoleIds: selection.selectedRoleIds
    }
  }

  @RequireManagementPermission(MANAGEMENT_PERMISSION_CODES.SET_ACCOUNT_ROLES)
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
    return { roles: roles.map(toRoleResponse) }
  }

  private getOperatorScope(rpcData: unknown) {
    const operatorContext = getAuthenticatedGrpcRequestContext(rpcData)?.operatorContext as
      | OperatorContextPayload
      | undefined
    return resolveOperatorScope(operatorContext)
  }
}
