import { Controller, UseFilters, UseGuards } from '@nestjs/common'
import { Metadata } from '@grpc/grpc-js'
import { ValidatingCommandBus, ValidatingQueryBus } from '@oes/common/cqrs'
import {
  GrpcExceptionFilter
} from '../../../../../../common/dist/core/filters'
import {
  AuthenticatedOperatorGuard,
  InternalServiceGuard,
  getAuthenticatedGrpcRequestContext,
  OperatorContextPayload,
  RequireAuthenticatedOperator
} from '@oes/common/authorization'
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
  ListAuditEventsRequest,
  ListAuditEventsResponse,
  ListAccountRolesRequest,
  ListNavigationEntriesRequest,
  ListNavigationEntriesResponse,
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
  NavigationEntryResponse,
  CreateNavigationEntryRequest,
  GetNavigationEntryRequest,
  GetRoleNavigationRequest,
  ResolveNavigationPreviewRequest,
  ResolveNavigationPreviewResponse,
  RoleNavigationResponse,
  SetRoleLandingPoliciesRequest,
  SyncRoleNavigationFromTemplateRequest,
  SetRoleNavigationVisibilityRequest,
  UpdateNavigationEntryRequest,
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
import { SyncRoleNavigationFromTemplateCommand } from '../../application/commands/role/sync-role-navigation-from-template.command'
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
import { ListAuditEventsQuery } from '../../application/queries/audit/list-audit-events.query'
import { CreateNavigationEntryCommand } from '../../application/commands/navigation/create-navigation-entry.command'
import {
  RoleLandingPolicyInputCommand,
  SetRoleLandingPoliciesCommand
} from '../../application/commands/navigation/set-role-landing-policies.command'
import {
  RoleNavigationVisibilityInputCommand,
  SetRoleNavigationVisibilityCommand
} from '../../application/commands/navigation/set-role-navigation-visibility.command'
import { UpdateNavigationEntryCommand } from '../../application/commands/navigation/update-navigation-entry.command'
import { GetNavigationEntryQuery } from '../../application/queries/navigation/get-navigation-entry.query'
import { GetRoleNavigationQuery } from '../../application/queries/navigation/get-role-navigation.query'
import { ListNavigationEntriesQuery } from '../../application/queries/navigation/list-navigation-entries.query'
import { ResolveNavigationPreviewQuery } from '../../application/queries/navigation/resolve-navigation-preview.query'
import {
  NavigationEntryPageResult,
  NavigationPreviewResult,
  RoleNavigationQueryResult
} from '../../application/queries/navigation'
import { resolveOperatorScope } from '../../application/authorization/operator-scope'
import { PermissionModule } from '../../domain/enums/permission-module.enum'
import { AccountType } from '../../domain/enums/account-type.enum'
import { ScopeLevel } from '../../domain/enums/scope-level.enum'
import { Permission } from '../../domain/aggregates/permission.aggregate'
import { Role } from '../../domain/aggregates/role.aggregate'
import { AccountRole } from '../../domain/vo/account-role.value-object'
import {
  toAccountRoleBindingResponse,
  toNavigationEntryResponse,
  toPermissionAuditEventRecord,
  toPermissionResponse,
  toResolveNavigationPreviewResponse,
  toRoleNavigationResponse,
  toRoleResponse
} from './permission-management.grpc.presenter'
import { PermissionAuditService } from '../../application/services/permission-audit.service'

@Controller()
@UseFilters(GrpcExceptionFilter)
@RequireAuthenticatedOperator()
@UseGuards(InternalServiceGuard, AuthenticatedOperatorGuard, ManagementAuthorizationGuard)
@PermissionManagementServiceControllerMethods()
export class PermissionManagementGrpcController implements PermissionManagementServiceController {
  constructor(
    private readonly commandBus: ValidatingCommandBus,
    private readonly queryBus: ValidatingQueryBus,
    private readonly permissionAuditService: PermissionAuditService
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
    const response = toPermissionResponse(permission)
    this.recordMutation(
      request,
      'PERMISSION_CREATED',
      'PERMISSION',
      permission.id,
      permission.code,
      response as unknown as Record<string, unknown>
    )
    return response
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
    for (const permission of created) {
      this.recordMutation(
        request,
        'PERMISSION_CREATED',
        'PERMISSION',
        permission.id,
        permission.code,
        toPermissionResponse(permission) as unknown as Record<string, unknown>
      )
    }
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
    const response = toPermissionResponse(permission)
    this.recordMutation(
      request,
      'PERMISSION_UPDATED',
      'PERMISSION',
      permission.id,
      permission.code,
      response as unknown as Record<string, unknown>
    )
    return response
  }

  @RequireManagementPermission(MANAGEMENT_PERMISSION_CODES.DELETE_PERMISSION)
  async deletePermission(
    request: DeletePermissionRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<void> {
    await this.commandBus.execute(new DeletePermissionCommand(request.id!))
    this.recordMutation(request, 'PERMISSION_DELETED', 'PERMISSION', request.id!)
  }

  @RequireManagementPermission(MANAGEMENT_PERMISSION_CODES.VIEW_PERMISSION_DETAIL)
  async getPermissionById(
    request: GetPermissionByIdRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<PermissionResponse> {
    const permission: Permission = await this.queryBus.execute(
      new GetPermissionByIdQuery(request.id!)
    )
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
    const roles: Role[] = await this.queryBus.execute(
      new ListPermissionRolesQuery(request.permissionId!)
    )
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
        description: request.description || undefined,
        operatorScope: this.getOperatorScope(request)
      })
    )
    const response = toRoleResponse(role)
    this.recordMutation(
      request,
      'ROLE_TEMPLATE_CREATED',
      'ROLE',
      role.id,
      role.code,
      response as unknown as Record<string, unknown>
    )
    return response
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
        scopeLevel: normalizeScopeLevel(request.scopeLevel),
        description: request.description || undefined,
        templateRoleId: request.templateRoleId || undefined,
        operatorScope: this.getOperatorScope(request)
      })
    )
    const response = toRoleResponse(role)
    this.recordMutation(
      request,
      'ROLE_INSTANCE_CREATED',
      'ROLE',
      role.id,
      role.code,
      response as unknown as Record<string, unknown>
    )
    return response
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
          : undefined,
        operatorScope: this.getOperatorScope(request)
      })
    )
    const response = toRoleResponse(role)
    this.recordMutation(
      request,
      'ROLE_TEMPLATE_UPDATED',
      'ROLE',
      role.id,
      role.code,
      response as unknown as Record<string, unknown>
    )
    return response
  }

  @RequireManagementPermission(MANAGEMENT_PERMISSION_CODES.DELETE_ROLE)
  async deleteRoleTemplate(
    request: DeleteRoleTemplateRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<void> {
    await this.commandBus.execute(
      new DeleteRoleTemplateCommand(request.id!, this.getOperatorScope(request))
    )
    this.recordMutation(request, 'ROLE_TEMPLATE_DELETED', 'ROLE', request.id!)
  }

  @RequireManagementPermission(MANAGEMENT_PERMISSION_CODES.UPDATE_ROLE)
  async setRoleTemplateEnabled(
    request: SetRoleTemplateEnabledRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<RoleResponse> {
    const role: Role = await this.commandBus.execute(
      new SetRoleTemplateEnabledCommand(request.id!, request.isEnabled!, this.getOperatorScope(request))
    )
    const response = toRoleResponse(role)
    this.recordMutation(
      request,
      request.isEnabled ? 'ROLE_TEMPLATE_ENABLED' : 'ROLE_TEMPLATE_DISABLED',
      'ROLE',
      role.id,
      role.code,
      response as unknown as Record<string, unknown>
    )
    return response
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
          : undefined,
        operatorScope: this.getOperatorScope(request)
      })
    )
    const response = toRoleResponse(role)
    this.recordMutation(
      request,
      'ROLE_UPDATED',
      'ROLE',
      role.id,
      role.code,
      response as unknown as Record<string, unknown>
    )
    return response
  }

  @RequireManagementPermission(MANAGEMENT_PERMISSION_CODES.UPDATE_ROLE)
  async setRoleEnabled(
    request: SetRoleEnabledRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<RoleResponse> {
    const role: Role = await this.commandBus.execute(
      new SetRoleEnabledCommand(request.id!, request.isEnabled!, this.getOperatorScope(request))
    )
    const response = toRoleResponse(role)
    this.recordMutation(
      request,
      request.isEnabled ? 'ROLE_ENABLED' : 'ROLE_DISABLED',
      'ROLE',
      role.id,
      role.code,
      response as unknown as Record<string, unknown>
    )
    return response
  }

  @RequireManagementPermission(MANAGEMENT_PERMISSION_CODES.DELETE_ROLE)
  async deleteRole(request: DeleteRoleRequest, metadata?: Metadata, ...rest: any): Promise<void> {
    await this.commandBus.execute(new DeleteRoleCommand(request.id!, this.getOperatorScope(request)))
    this.recordMutation(request, 'ROLE_DELETED', 'ROLE', request.id!)
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
          scopeLevel: normalizeOptionalScopeLevel(request.scopeLevel),
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
      new ListRolePermissionsQuery(request.roleId!, this.getOperatorScope(request))
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
      new ListRoleTemplatePermissionsQuery(request.roleTemplateId!, this.getOperatorScope(request))
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
      new AssignRolePermissionCommand(request.roleId!, request.permissionId!, this.getOperatorScope(request))
    )
    this.recordMutation(
      request,
      'ROLE_PERMISSION_ASSIGNED',
      'ROLE_PERMISSION',
      `${request.roleId!}:${request.permissionId!}`
    )
  }

  @RequireManagementPermission(MANAGEMENT_PERMISSION_CODES.ASSIGN_ROLE_PERMISSION)
  async assignRoleTemplatePermission(
    request: AssignRoleTemplatePermissionRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<void> {
    await this.commandBus.execute(
      new AssignRoleTemplatePermissionCommand(
        request.roleTemplateId!,
        request.permissionId!,
        this.getOperatorScope(request)
      )
    )
    this.recordMutation(
      request,
      'ROLE_TEMPLATE_PERMISSION_ASSIGNED',
      'ROLE_PERMISSION',
      `${request.roleTemplateId!}:${request.permissionId!}`
    )
  }

  @RequireManagementPermission(MANAGEMENT_PERMISSION_CODES.REVOKE_ROLE_PERMISSION)
  async revokeRoleTemplatePermission(
    request: RevokeRoleTemplatePermissionRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<void> {
    await this.commandBus.execute(
      new RevokeRoleTemplatePermissionCommand(
        request.roleTemplateId!,
        request.permissionId!,
        this.getOperatorScope(request)
      )
    )
    this.recordMutation(
      request,
      'ROLE_TEMPLATE_PERMISSION_REVOKED',
      'ROLE_PERMISSION',
      `${request.roleTemplateId!}:${request.permissionId!}`
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
        description: request.description || undefined,
        operatorScope: this.getOperatorScope(request)
      })
    )
    const response = toRoleResponse(role)
    this.recordMutation(
      request,
      'ROLE_INSTANCE_CREATED_FROM_TEMPLATE',
      'ROLE',
      role.id,
      role.code,
      response as unknown as Record<string, unknown>
    )
    return response
  }

  @RequireManagementPermission(MANAGEMENT_PERMISSION_CODES.REVOKE_ROLE_PERMISSION)
  async revokeRolePermission(
    request: RevokeRolePermissionRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<void> {
    await this.commandBus.execute(
      new RevokeRolePermissionCommand(request.roleId!, request.permissionId!, this.getOperatorScope(request))
    )
    this.recordMutation(
      request,
      'ROLE_PERMISSION_REVOKED',
      'ROLE_PERMISSION',
      `${request.roleId!}:${request.permissionId!}`
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
        scopeLevel: normalizeScopeLevel(request.scopeLevel),
        effectiveAt: request.effectiveAt || undefined,
        expiresAt: request.expiresAt || undefined,
        operatorScope: this.getOperatorScope(request)
      })
    )
    this.recordMutation(
      request,
      'ACCOUNT_ROLE_ASSIGNED',
      'ACCOUNT_ROLE',
      `${request.accountId!}:${request.roleId!}`,
      undefined,
      {
        accountId: request.accountId!,
        accountType: request.accountType!,
        roleId: request.roleId!,
        tenantId: request.tenantId!,
        scopeLevel: normalizeScopeLevel(request.scopeLevel),
        effectiveAt: request.effectiveAt || '',
        expiresAt: request.expiresAt || ''
      }
    )
  }

  @RequireManagementPermission(MANAGEMENT_PERMISSION_CODES.REVOKE_ACCOUNT_ROLE)
  async revokeAccountRole(
    request: RevokeAccountRoleRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<void> {
    await this.commandBus.execute(
      new RevokeAccountRoleCommand(request.accountId!, request.roleId!, this.getOperatorScope(request))
    )
    this.recordMutation(
      request,
      'ACCOUNT_ROLE_REVOKED',
      'ACCOUNT_ROLE',
      `${request.accountId!}:${request.roleId!}`
    )
  }

  @RequireManagementPermission(MANAGEMENT_PERMISSION_CODES.VIEW_ACCOUNT_ROLE)
  async listAccountRoles(
    request: ListAccountRolesRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<ListRolesResponse> {
    const roles: Role[] = await this.queryBus.execute(
      new ListAccountRolesQuery(
        request.accountId!,
        request.tenantId || undefined,
        this.getOperatorScope(request),
        normalizeScopeLevel(request.scopeLevel)
      )
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
      new ListRoleAccountsQuery(request.roleId!, this.getOperatorScope(request))
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
      new GetAccountRoleSelectionQuery(
        request.accountId!,
        request.tenantId || undefined,
        this.getOperatorScope(request),
        normalizeScopeLevel(request.scopeLevel)
      )
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
        scopeLevel: normalizeScopeLevel(request.scopeLevel),
        roleIds: request.roleIds ?? [],
        operatorScope: this.getOperatorScope(request)
      })
    )
    this.recordMutation(
      request,
      'ACCOUNT_ROLES_SET',
      'ACCOUNT_ROLE',
      request.accountId!,
      undefined,
      {
        accountId: request.accountId!,
        tenantId: request.tenantId!,
        scopeLevel: normalizeScopeLevel(request.scopeLevel),
        roleIds: request.roleIds ?? [],
        resolvedRoles: roles.map((role) => toRoleResponse(role))
      }
    )
    return { roles: roles.map(toRoleResponse) }
  }

  @RequireManagementPermission(MANAGEMENT_PERMISSION_CODES.VIEW_AUDIT_EVENT)
  // This method exposes permission management audit records through the management gRPC surface.
  async listAuditEvents(
    request: ListAuditEventsRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<ListAuditEventsResponse> {
    const result = await this.queryBus.execute(
      new ListAuditEventsQuery({
        service: request.service || undefined,
        module: request.module || undefined,
        eventType: request.eventType || undefined,
        result: request.result || undefined,
        operatorId: request.operatorId || undefined,
        tenantId: request.tenantId || undefined,
        orgId: request.orgId || undefined,
        resourceType: request.resourceType || undefined,
        resourceId: request.resourceId || undefined,
        occurredAtFrom: request.occurredAtFrom || undefined,
        occurredAtTo: request.occurredAtTo || undefined,
        cursor: request.cursor || undefined,
        pageSize: request.pageSize || undefined
      })
    )

    return {
      items: result.items.map(toPermissionAuditEventRecord),
      nextCursor: result.nextCursor ?? ''
    }
  }

  @RequireManagementPermission(MANAGEMENT_PERMISSION_CODES.VIEW_NAVIGATION_ENTRY)
  // This method exposes the managed navigation entry registry.
  async listNavigationEntries(
    request: ListNavigationEntriesRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<ListNavigationEntriesResponse> {
    const result: NavigationEntryPageResult = await this.queryBus.execute(
      new ListNavigationEntriesQuery({
        page: request.page || 1,
        pageSize: request.pageSize || 20,
        keyword: request.keyword || undefined,
        featureKey: request.featureKey || undefined,
        terminal: request.terminal || undefined,
        enabled: request.hasEnabledFilter ? request.enabled ?? false : undefined
      })
    )

    return {
      entries: result.entries.map(toNavigationEntryResponse),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize
    }
  }

  @RequireManagementPermission(MANAGEMENT_PERMISSION_CODES.VIEW_NAVIGATION_ENTRY_DETAIL)
  // This method returns one managed navigation entry by stable entry key.
  async getNavigationEntry(
    request: GetNavigationEntryRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<NavigationEntryResponse> {
    const entry = await this.queryBus.execute(new GetNavigationEntryQuery(request.entryKey!))
    return toNavigationEntryResponse(entry)
  }

  @RequireManagementPermission(MANAGEMENT_PERMISSION_CODES.CREATE_NAVIGATION_ENTRY)
  // This method creates one managed navigation entry registry item.
  async createNavigationEntry(
    request: CreateNavigationEntryRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<NavigationEntryResponse> {
    const entry = await this.commandBus.execute(
      new CreateNavigationEntryCommand({
        entryKey: request.entryKey!,
        name: request.name!,
        description: request.description || null,
        featureKey: request.featureKey || null,
        supportedTerminals: request.supportedTerminals ?? [],
        registryPriority: request.registryPriority ?? 0,
        enabled: request.enabled ?? true,
        entryType: request.entryType!
      })
    )
    const response = toNavigationEntryResponse(entry)
    this.recordMutation(
      request,
      'NAVIGATION_ENTRY_CREATED',
      'NAVIGATION_ENTRY',
      entry.entryKey,
      entry.entryKey,
      response as unknown as Record<string, unknown>
    )
    return response
  }

  @RequireManagementPermission(MANAGEMENT_PERMISSION_CODES.UPDATE_NAVIGATION_ENTRY)
  // This method updates mutable metadata for a managed navigation entry.
  async updateNavigationEntry(
    request: UpdateNavigationEntryRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<NavigationEntryResponse> {
    const entry = await this.commandBus.execute(
      new UpdateNavigationEntryCommand({
        entryKey: request.entryKey!,
        name: request.name || undefined,
        description: Object.prototype.hasOwnProperty.call(request, 'description')
          ? request.description ?? null
          : undefined,
        featureKey: Object.prototype.hasOwnProperty.call(request, 'featureKey')
          ? request.featureKey ?? null
          : undefined,
        supportedTerminals: request.supportedTerminals,
        registryPriority: request.registryPriority,
        enabled: request.enabled,
        entryType: request.entryType || undefined
      })
    )
    const response = toNavigationEntryResponse(entry)
    this.recordMutation(
      request,
      'NAVIGATION_ENTRY_UPDATED',
      'NAVIGATION_ENTRY',
      entry.entryKey,
      entry.entryKey,
      response as unknown as Record<string, unknown>
    )
    return response
  }

  @RequireManagementPermission(MANAGEMENT_PERMISSION_CODES.VIEW_ROLE_DETAIL)
  // This method returns the role-scoped navigation visibility and landing config.
  async getRoleNavigation(
    request: GetRoleNavigationRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<RoleNavigationResponse> {
    const config: RoleNavigationQueryResult = await this.queryBus.execute(
      new GetRoleNavigationQuery(request.roleId!)
    )
    return toRoleNavigationResponse(config)
  }

  @RequireManagementPermission(MANAGEMENT_PERMISSION_CODES.UPDATE_ROLE)
  // This method replaces a role's navigation visibility config as a full set.
  async setRoleNavigationVisibility(
    request: SetRoleNavigationVisibilityRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<RoleNavigationResponse> {
    const config: RoleNavigationQueryResult = await this.commandBus.execute(
      new SetRoleNavigationVisibilityCommand({
        roleId: request.roleId!,
        visibility: (request.visibility ?? []).map((item) =>
          Object.assign(new RoleNavigationVisibilityInputCommand(), {
            entryKey: item.entryKey!,
            terminal: item.terminal!,
            enabled: item.enabled ?? false
          })
        )
      })
    )
    const response = toRoleNavigationResponse(config)
    this.recordMutation(
      request,
      'ROLE_NAVIGATION_VISIBILITY_SET',
      'ROLE_NAVIGATION',
      request.roleId!,
      undefined,
      response as unknown as Record<string, unknown>
    )
    return response
  }

  @RequireManagementPermission(MANAGEMENT_PERMISSION_CODES.UPDATE_ROLE)
  // This method replaces a role's landing policy config as a full set.
  async setRoleLandingPolicies(
    request: SetRoleLandingPoliciesRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<RoleNavigationResponse> {
    const config: RoleNavigationQueryResult = await this.commandBus.execute(
      new SetRoleLandingPoliciesCommand({
        roleId: request.roleId!,
        landingPolicies: (request.landingPolicies ?? []).map((item) =>
          Object.assign(new RoleLandingPolicyInputCommand(), {
            terminal: item.terminal!,
            defaultEntryKey: item.defaultEntryKey!,
            priority: item.priority ?? 0,
            enabled: item.enabled ?? false
          })
        )
      })
    )
    const response = toRoleNavigationResponse(config)
    this.recordMutation(
      request,
      'ROLE_NAVIGATION_LANDING_POLICIES_SET',
      'ROLE_NAVIGATION',
      request.roleId!,
      undefined,
      response as unknown as Record<string, unknown>
    )
    return response
  }

  @RequireManagementPermission(MANAGEMENT_PERMISSION_CODES.UPDATE_ROLE)
  // This method resets one role instance navigation to the linked template snapshot.
  async syncRoleNavigationFromTemplate(
    request: SyncRoleNavigationFromTemplateRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<RoleNavigationResponse> {
    const config: RoleNavigationQueryResult = await this.commandBus.execute(
      new SyncRoleNavigationFromTemplateCommand({
        roleId: request.roleId!,
        operatorScope: this.getOperatorScope(request)
      })
    )
    const response = toRoleNavigationResponse(config)
    this.recordMutation(
      request,
      'ROLE_NAVIGATION_SYNCED_FROM_TEMPLATE',
      'ROLE_NAVIGATION',
      request.roleId!,
      undefined,
      response as unknown as Record<string, unknown>
    )
    return response
  }

  @RequireManagementPermission(MANAGEMENT_PERMISSION_CODES.RESOLVE_NAVIGATION_PREVIEW)
  // This method previews visible entries and default landing entry for one or more roles.
  async resolveNavigationPreview(
    request: ResolveNavigationPreviewRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<ResolveNavigationPreviewResponse> {
    const result: NavigationPreviewResult = await this.queryBus.execute(
      new ResolveNavigationPreviewQuery({
        roleIds: request.roleIds ?? [],
        scopeLevel: request.scopeLevel!,
        terminal: request.terminal!
      })
    )
    return toResolveNavigationPreviewResponse(result)
  }

  private recordMutation(
    rpcData: unknown,
    action: string,
    targetType: 'ROLE' | 'PERMISSION' | 'ACCOUNT_ROLE' | 'ROLE_PERMISSION' | 'NAVIGATION_ENTRY' | 'ROLE_NAVIGATION',
    targetId: string,
    targetCode?: string,
    afterData?: Record<string, unknown>
  ): void {
    const operatorContext = getAuthenticatedGrpcRequestContext(rpcData)?.operatorContext as
      | OperatorContextPayload
      | undefined
    const operatorId = operatorContext?.operator_id

    if (!operatorId) {
      return
    }

    this.permissionAuditService.emitManagementMutation({
      actorId: operatorId,
      tenantId: operatorContext?.tenant_id || undefined,
      action,
      targetType,
      targetId,
      targetCode,
      afterData,
      metadata: {
        request: (rpcData as Record<string, unknown>) ?? {}
      }
    })
  }

  private getOperatorScope(rpcData: unknown) {
    const operatorContext = getAuthenticatedGrpcRequestContext(rpcData)?.operatorContext as
      | OperatorContextPayload
      | undefined
    return resolveOperatorScope(operatorContext)
  }
}

// Normalizes role/account scope strings from gRPC requests while preserving tenant behavior for old callers.
function normalizeScopeLevel(scopeLevel?: string): ScopeLevel {
  return scopeLevel === ScopeLevel.SYSTEM ? ScopeLevel.SYSTEM : ScopeLevel.TENANT
}

// Preserves optional scope filters so legacy role list callers can keep their tenant-instance behavior.
function normalizeOptionalScopeLevel(scopeLevel?: string): ScopeLevel | undefined {
  return scopeLevel === ScopeLevel.SYSTEM || scopeLevel === ScopeLevel.TENANT
    ? scopeLevel
    : undefined
}
