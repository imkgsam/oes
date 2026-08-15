import { HttpException, HttpStatus, Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { SERVICE_NAMES } from '@oes/common/constants'
import { InjectGrpcClient } from '@oes/common/transport'
import { safeGrpcCall, SafeGrpcCallOptions } from '@oes/common/transport'
import {
  AccountRoleSelectionResponse,
  AssignAccountRoleRequest,
  PermissionManagementServiceClient,
  AssignRolePermissionRequest,
  AssignRoleTemplatePermissionRequest,
  CreateNavigationEntryRequest,
  CreateRoleInstanceRequest,
  CreateRoleInstanceFromTemplateRequest,
  CreateRoleTemplateRequest,
  CreatePermissionRequest,
  DeleteAccountTerminalAccessOverrideRequest,
  DeletePermissionRequest,
  DeleteAccountTerminalAccessOverrideResponse,
  GetAccountRoleSelectionRequest,
  GetAccountTerminalAccessRequest,
  GetAccountTerminalAccessResponse,
  GetNavigationEntryRequest,
  GetPermissionByCodeRequest,
  GetPermissionByIdRequest,
  GetRoleNavigationRequest,
  GetRoleTerminalAccessRequest,
  GetRoleTerminalAccessResponse,
  GetRoleTemplateByIdRequest,
  ListAccountRolesRequest,
  ListNavigationEntriesRequest,
  ListNavigationEntriesResponse,
  ListPermissionRolesRequest,
  ListPermissionsResponse,
  ListPermissionsPagedRequest,
  ListRoleAccountsRequest,
  ListRoleAccountsResponse,
  ListRoleTemplatePermissionsRequest,
  ListRoleTemplatesRequest,
  PermissionResponse,
  RevokeAccountRoleRequest,
  RevokeRolePermissionRequest,
  RevokeRoleTemplatePermissionRequest,
  ReplaceAccountTerminalAccessOverrideRequest,
  ReplaceAccountTerminalAccessOverrideResponse,
  SetAccountRolesRequest,
  SetRoleEnabledRequest,
  SetRoleTerminalAccessRequest,
  SetRoleTerminalAccessResponse,
  SetRoleTemplateEnabledRequest,
  UpdatePermissionRequest,
  DeleteRoleRequest,
  DeleteRoleTemplateRequest,
  GetRoleByIdRequest,
  ListRolePermissionsRequest,
  ListRolesResponse,
  ListRoleInstancesRequest,
  PagedPermissionsResponse,
  PagedRolesResponse,
  RoleResponse,
  NavigationEntryResponse,
  ResolveNavigationPreviewRequest,
  ResolveNavigationPreviewResponse,
  RoleNavigationResponse,
  SyncRoleNavigationFromTemplateRequest,
  UpdateRoleRequest,
  UpdateRoleTemplateRequest,
  SetRoleLandingPoliciesRequest,
  SetRoleNavigationVisibilityRequest,
  UpdateNavigationEntryRequest,
  PERMISSION_MANAGEMENT_SERVICE_NAME
} from '@oes/common/generated/permission_service'
import { DownstreamRequestSource } from '../../../common/grpc/gateway-downstream-source.mapper'
import { PERMISSION_TARGET_AUDIENCE, TrustedPermissionGrpcClient } from '../../../infrastructure/grpc/trusted-permission.grpc.client'
import { GatewayFoundationTrustedGrpcExecutionProducer } from '../../../infrastructure/grpc/trusted-auth.grpc.client'

const CALLER = 'api-gateway'

// Bridges gateway permission management requests onto the downstream permission-service gRPC contract.
@Injectable()
export class PermissionManagementGrpcAdapter implements OnModuleInit {
  private svc!: PermissionManagementServiceClient

  constructor(
    private readonly client: TrustedPermissionGrpcClient,
    private readonly trusted: GatewayFoundationTrustedGrpcExecutionProducer
  ) {}

  onModuleInit() {
    this.svc = this.client.getClient().getService<PermissionManagementServiceClient>(
      PERMISSION_MANAGEMENT_SERVICE_NAME
    )
  }

  // Permission methods

  async createPermission(
    req: CreatePermissionRequest,
    source: DownstreamRequestSource
  ): Promise<PermissionResponse> {
    return this.call('createPermission', async () =>
      this.svc.createPermission(req, await this.trusted.forBusinessCall(source, PERMISSION_TARGET_AUDIENCE, ['permission.create']))
    )
  }

  async deletePermission(
    req: DeletePermissionRequest,
    source: DownstreamRequestSource
  ): Promise<void> {
    await this.call('deletePermission', async () =>
      this.svc.deletePermission(req, await this.trusted.forBusinessCall(source, PERMISSION_TARGET_AUDIENCE, ['permission.delete']))
    )
  }

  // Forwards permission dictionary updates to the downstream management gRPC contract.
  async updatePermission(
    req: UpdatePermissionRequest,
    source: DownstreamRequestSource
  ): Promise<PermissionResponse> {
    return this.call('updatePermission', async () =>
      this.svc.updatePermission(
        req,
        await this.trusted.forBusinessCall(source, PERMISSION_TARGET_AUDIENCE, ['permission.update'])
      )
    )
  }

  // Loads one permission dictionary item by its stable id through permission-service.
  async getPermissionById(
    req: GetPermissionByIdRequest,
    source: DownstreamRequestSource
  ): Promise<PermissionResponse> {
    return this.call('getPermissionById', async () =>
      this.svc.getPermissionById(
        req,
        await this.trusted.forBusinessCall(source, PERMISSION_TARGET_AUDIENCE, ['permission.get_by_id'])
      )
    )
  }

  // Loads one permission dictionary item by its stable code through permission-service.
  async getPermissionByCode(
    req: GetPermissionByCodeRequest,
    source: DownstreamRequestSource
  ): Promise<PermissionResponse> {
    return this.call('getPermissionByCode', async () =>
      this.svc.getPermissionByCode(req, await this.trusted.forBusinessCall(source, PERMISSION_TARGET_AUDIENCE, ['permission.get_by_code']))
    )
  }

  // Forwards paged permission list queries while preserving downstream pagination metadata.
  async listPermissions(
    req: ListPermissionsPagedRequest,
    source: DownstreamRequestSource
  ): Promise<PagedPermissionsResponse> {
    return this.call<PagedPermissionsResponse>('listPermissionsPaged', async () =>
      this.svc.listPermissionsPaged(
        {
          page: req.page || 1,
          pageSize: req.pageSize || 100,
          module: req.module || undefined,
          keyword: req.keyword || undefined
        } as ListPermissionsPagedRequest,
        await this.trusted.forBusinessCall(source, PERMISSION_TARGET_AUDIENCE, ['permission.list'])
      )
    )
  }

  // Lists role summaries that currently include the selected permission.
  async listPermissionRoles(
    req: ListPermissionRolesRequest,
    source: DownstreamRequestSource
  ): Promise<ListRolesResponse> {
    return this.call('listPermissionRoles', async () =>
      this.svc.listPermissionRoles(
        req,
        await this.trusted.forBusinessCall(source, PERMISSION_TARGET_AUDIENCE, ['permission.role_instance.list'])
      )
    )
  }

  // Role methods

  // Creates a role template through the downstream role management contract.
  async createRoleTemplate(
    req: CreateRoleTemplateRequest,
    source: DownstreamRequestSource
  ): Promise<RoleResponse> {
    return this.call('createRoleTemplate', async () =>
      this.svc.createRoleTemplate(
        req,
        await this.trusted.forBusinessCall(source, PERMISSION_TARGET_AUDIENCE, ['permission.role_template.create'])
      )
    )
  }

  // Creates a role instance through the downstream role management contract.
  async createRole(
    req: CreateRoleInstanceRequest,
    source: DownstreamRequestSource
  ): Promise<RoleResponse> {
    return this.call('createRoleInstance', async () =>
      this.svc.createRoleInstance(
        req,
        await this.trusted.forBusinessCall(source, PERMISSION_TARGET_AUDIENCE, ['permission.role_instance.create'])
      )
    )
  }

  async deleteRole(req: DeleteRoleRequest, source: DownstreamRequestSource): Promise<void> {
    await this.call('deleteRole', async () =>
      this.svc.deleteRole(req, await this.trusted.forBusinessCall(source, PERMISSION_TARGET_AUDIENCE, ['permission.role_instance.delete']))
    )
  }

  // Deletes one role template through permission-service.
  async deleteRoleTemplate(
    req: DeleteRoleTemplateRequest,
    source: DownstreamRequestSource
  ): Promise<void> {
    await this.call('deleteRoleTemplate', async () =>
      this.svc.deleteRoleTemplate(
        req,
        await this.trusted.forBusinessCall(source, PERMISSION_TARGET_AUDIENCE, ['permission.role_template.delete'])
      )
    )
  }

  // Updates mutable fields on one role instance.
  async updateRole(
    req: UpdateRoleRequest,
    source: DownstreamRequestSource
  ): Promise<RoleResponse> {
    return this.call('updateRole', async () =>
      this.svc.updateRole(
        req,
        await this.trusted.forBusinessCall(source, PERMISSION_TARGET_AUDIENCE, ['permission.role_instance.update'])
      )
    )
  }

  // Enables or disables one role instance through permission-service.
  async setRoleEnabled(
    req: SetRoleEnabledRequest,
    source: DownstreamRequestSource
  ): Promise<RoleResponse> {
    return this.call('setRoleEnabled', async () =>
      this.svc.setRoleEnabled(
        req,
        await this.trusted.forBusinessCall(source, PERMISSION_TARGET_AUDIENCE, ['permission.role_instance.update'])
      )
    )
  }

  async getRoleById(
    req: GetRoleByIdRequest,
    source: DownstreamRequestSource
  ): Promise<RoleResponse> {
    return this.call('getRoleById', async () =>
      this.svc.getRoleById(req, await this.trusted.forBusinessCall(source, PERMISSION_TARGET_AUDIENCE, ['permission.role_instance.get_by_id']))
    )
  }

  // Reads one role template by id through permission-service.
  async getRoleTemplateById(
    req: GetRoleTemplateByIdRequest,
    source: DownstreamRequestSource
  ): Promise<RoleResponse> {
    return this.call('getRoleTemplateById', async () =>
      this.svc.getRoleTemplateById(
        req,
        await this.trusted.forBusinessCall(source, PERMISSION_TARGET_AUDIENCE, ['permission.role_template.get_by_id'])
      )
    )
  }

  // Forwards paged role instance queries while preserving downstream pagination metadata.
  async listRoles(
    req: ListRoleInstancesRequest,
    source: DownstreamRequestSource
  ): Promise<PagedRolesResponse> {
    return this.call<PagedRolesResponse>('listRoleInstances', async () =>
      this.svc.listRoleInstances(
        {
          page: req.page || 1,
          pageSize: req.pageSize || 20,
          tenantId: req.tenantId || undefined,
          scopeLevel: req.scopeLevel || undefined,
          keyword: req.keyword || undefined
        } as ListRoleInstancesRequest,
        await this.trusted.forBusinessCall(source, PERMISSION_TARGET_AUDIENCE, ['permission.role_instance.list'])
      )
    )
  }

  // Forwards paged role template queries while preserving downstream pagination metadata.
  async listRoleTemplates(
    req: ListRoleTemplatesRequest,
    source: DownstreamRequestSource
  ): Promise<PagedRolesResponse> {
    return this.call<PagedRolesResponse>('listRoleTemplates', async () =>
      this.svc.listRoleTemplates(
        {
          page: req.page || 1,
          pageSize: req.pageSize || 20,
          keyword: req.keyword || undefined
        } as ListRoleTemplatesRequest,
        await this.trusted.forBusinessCall(source, PERMISSION_TARGET_AUDIENCE, ['permission.role_template.list'])
      )
    )
  }

  // Lists permissions assigned to one role instance.
  async listRolePermissions(
    req: ListRolePermissionsRequest,
    source: DownstreamRequestSource
  ): Promise<ListPermissionsResponse> {
    return this.call('listRolePermissions', async () =>
      this.svc.listRolePermissions(
        req,
        await this.trusted.forBusinessCall(source, PERMISSION_TARGET_AUDIENCE, ['permission.role_instance.get_by_id'])
      )
    )
  }

  // Lists permissions assigned to one role template.
  async listRoleTemplatePermissions(
    req: ListRoleTemplatePermissionsRequest,
    source: DownstreamRequestSource
  ): Promise<ListPermissionsResponse> {
    return this.call('listRoleTemplatePermissions', async () =>
      this.svc.listRoleTemplatePermissions(
        req,
        await this.trusted.forBusinessCall(source, PERMISSION_TARGET_AUDIENCE, ['permission.role_template.get_by_id'])
      )
    )
  }

  // Assigns one permission to one role instance.
  async assignRolePermission(
    req: AssignRolePermissionRequest,
    source: DownstreamRequestSource
  ): Promise<void> {
    await this.call('assignRolePermission', async () =>
      this.svc.assignRolePermission(
        req,
        await this.trusted.forBusinessCall(source, PERMISSION_TARGET_AUDIENCE, ['permission.role_instance.assign_permissions'])
      )
    )
  }

  // Assigns one permission to one role template.
  async assignRoleTemplatePermission(
    req: AssignRoleTemplatePermissionRequest,
    source: DownstreamRequestSource
  ): Promise<void> {
    await this.call('assignRoleTemplatePermission', async () =>
      this.svc.assignRoleTemplatePermission(
        req,
        await this.trusted.forBusinessCall(source, PERMISSION_TARGET_AUDIENCE, ['permission.role_template.assign_permissions'])
      )
    )
  }

  // Revokes one permission from one role instance.
  async revokeRolePermission(
    req: RevokeRolePermissionRequest,
    source: DownstreamRequestSource
  ): Promise<void> {
    await this.call('revokeRolePermission', async () =>
      this.svc.revokeRolePermission(
        req,
        await this.trusted.forBusinessCall(source, PERMISSION_TARGET_AUDIENCE, ['permission.role_instance.assign_permissions'])
      )
    )
  }

  // Revokes one permission from one role template.
  async revokeRoleTemplatePermission(
    req: RevokeRoleTemplatePermissionRequest,
    source: DownstreamRequestSource
  ): Promise<void> {
    await this.call('revokeRoleTemplatePermission', async () =>
      this.svc.revokeRoleTemplatePermission(
        req,
        await this.trusted.forBusinessCall(source, PERMISSION_TARGET_AUDIENCE, ['permission.role_template.assign_permissions'])
      )
    )
  }

  // Updates mutable fields on one role template.
  async updateRoleTemplate(
    req: UpdateRoleTemplateRequest,
    source: DownstreamRequestSource
  ): Promise<RoleResponse> {
    return this.call('updateRoleTemplate', async () =>
      this.svc.updateRoleTemplate(
        req,
        await this.trusted.forBusinessCall(source, PERMISSION_TARGET_AUDIENCE, ['permission.role_template.update'])
      )
    )
  }

  // Enables or disables one role template through permission-service.
  async setRoleTemplateEnabled(
    req: SetRoleTemplateEnabledRequest,
    source: DownstreamRequestSource
  ): Promise<RoleResponse> {
    return this.call('setRoleTemplateEnabled', async () =>
      this.svc.setRoleTemplateEnabled(
        req,
        await this.trusted.forBusinessCall(source, PERMISSION_TARGET_AUDIENCE, ['permission.role_template.update'])
      )
    )
  }

  // Creates a tenant role instance from one role template.
  async createRoleFromTemplate(
    req: CreateRoleInstanceFromTemplateRequest,
    source: DownstreamRequestSource
  ): Promise<RoleResponse> {
    return this.call('createRoleInstanceFromTemplate', async () =>
      this.svc.createRoleInstanceFromTemplate(
        req,
        await this.trusted.forBusinessCall(source, PERMISSION_TARGET_AUDIENCE, ['permission.role_instance.create_from_template'])
      )
    )
  }

  // Lists the effective role bindings currently assigned to one account.
  async listAccountRoles(
    req: ListAccountRolesRequest,
    source: DownstreamRequestSource
  ): Promise<ListRolesResponse> {
    return this.call('listAccountRoles', async () =>
      this.svc.listAccountRoles(
        {
          accountId: req.accountId,
          tenantId: req.tenantId || undefined,
          scopeLevel: req.scopeLevel || undefined
        } as ListAccountRolesRequest,
        await this.trusted.forBusinessCall(source, PERMISSION_TARGET_AUDIENCE, ['permission.account.get_roles'])
      )
    )
  }

  // Lists assignable roles plus selected role ids for one account.
  async getAccountRoleSelection(
    req: GetAccountRoleSelectionRequest,
    source: DownstreamRequestSource
  ): Promise<AccountRoleSelectionResponse> {
    return this.call('getAccountRoleSelection', async () =>
      this.svc.getAccountRoleSelection(
        {
          accountId: req.accountId,
          tenantId: req.tenantId || undefined,
          scopeLevel: req.scopeLevel || undefined
        } as GetAccountRoleSelectionRequest,
        await this.trusted.forBusinessCall(source, PERMISSION_TARGET_AUDIENCE, ['permission.account.get_roles'])
      )
    )
  }

  // Assigns one role instance to one account binding target.
  async assignAccountRole(
    req: AssignAccountRoleRequest,
    source: DownstreamRequestSource
  ): Promise<void> {
    await this.call('assignAccountRole', async () =>
      this.svc.assignAccountRole(
        req,
        await this.trusted.forBusinessCall(source, PERMISSION_TARGET_AUDIENCE, ['permission.account.assign_roles'])
      )
    )
  }

  // Revokes one role instance from one account binding target.
  async revokeAccountRole(
    req: RevokeAccountRoleRequest,
    source: DownstreamRequestSource
  ): Promise<void> {
    await this.call('revokeAccountRole', async () =>
      this.svc.revokeAccountRole(
        req,
        await this.trusted.forBusinessCall(source, PERMISSION_TARGET_AUDIENCE, ['permission.account.assign_roles'])
      )
    )
  }

  // Replaces the effective role set for one account within one scope.
  async setAccountRoles(
    req: SetAccountRolesRequest,
    source: DownstreamRequestSource
  ): Promise<ListRolesResponse> {
    return this.call('setAccountRoles', async () =>
      this.svc.setAccountRoles(
        req,
        await this.trusted.forBusinessCall(source, PERMISSION_TARGET_AUDIENCE, ['permission.account.assign_roles'])
      )
    )
  }

  // Lists account-role bindings that currently reference one role instance.
  async listRoleAccounts(
    req: ListRoleAccountsRequest,
    source: DownstreamRequestSource
  ): Promise<ListRoleAccountsResponse> {
    return this.call('listRoleAccounts', async () =>
      this.svc.listRoleAccounts(
        req,
        await this.trusted.forBusinessCall(source, PERMISSION_TARGET_AUDIENCE, ['permission.account.get_roles'])
      )
    )
  }

  // Lists managed navigation entry registry records through permission-service.
  async listNavigationEntries(
    req: ListNavigationEntriesRequest,
    source: DownstreamRequestSource
  ): Promise<ListNavigationEntriesResponse> {
    return this.call('listNavigationEntries', async () =>
      this.svc.listNavigationEntries(
        {
          page: req.page || 1,
          pageSize: req.pageSize || 20,
          keyword: req.keyword || undefined,
          featureKey: req.featureKey || undefined,
          terminal: req.terminal || undefined,
          hasEnabledFilter: req.hasEnabledFilter,
          enabled: req.enabled
        },
        await this.trusted.forBusinessCall(source, PERMISSION_TARGET_AUDIENCE, ['permission.navigation.entry.list'])
      )
    )
  }

  // Reads one managed navigation entry registry record by stable entry key.
  async getNavigationEntry(
    req: GetNavigationEntryRequest,
    source: DownstreamRequestSource
  ): Promise<NavigationEntryResponse> {
    return this.call('getNavigationEntry', async () =>
      this.svc.getNavigationEntry(
        req,
        await this.trusted.forBusinessCall(source, PERMISSION_TARGET_AUDIENCE, ['permission.navigation.entry.get_by_key'])
      )
    )
  }

  // Creates one managed navigation entry registry record.
  async createNavigationEntry(
    req: CreateNavigationEntryRequest,
    source: DownstreamRequestSource
  ): Promise<NavigationEntryResponse> {
    return this.call('createNavigationEntry', async () =>
      this.svc.createNavigationEntry(
        req,
        await this.trusted.forBusinessCall(source, PERMISSION_TARGET_AUDIENCE, ['permission.navigation.entry.create'])
      )
    )
  }

  // Updates mutable metadata on one managed navigation entry registry record.
  async updateNavigationEntry(
    req: UpdateNavigationEntryRequest,
    source: DownstreamRequestSource
  ): Promise<NavigationEntryResponse> {
    return this.call('updateNavigationEntry', async () =>
      this.svc.updateNavigationEntry(
        req,
        await this.trusted.forBusinessCall(source, PERMISSION_TARGET_AUDIENCE, ['permission.navigation.entry.update'])
      )
    )
  }

  // Reads role-scoped navigation visibility and landing policy configuration.
  async getRoleNavigation(
    req: GetRoleNavigationRequest,
    source: DownstreamRequestSource
  ): Promise<RoleNavigationResponse> {
    return this.call('getRoleNavigation', async () =>
      this.svc.getRoleNavigation(
        req,
        await this.trusted.forBusinessCall(source, PERMISSION_TARGET_AUDIENCE, ['permission.role_instance.get_by_id'])
      )
    )
  }

  // Reads the terminal access defaults configured for one role instance.
  async getRoleTerminalAccess(
    req: GetRoleTerminalAccessRequest,
    source: DownstreamRequestSource
  ): Promise<GetRoleTerminalAccessResponse> {
    return this.call('getRoleTerminalAccess', async () =>
      this.svc.getRoleTerminalAccess(
        req,
        await this.trusted.forBusinessCall(source, PERMISSION_TARGET_AUDIENCE, ['permission.terminal_access.view'])
      )
    )
  }

  // Replaces the terminal access defaults configured for one role instance.
  async setRoleTerminalAccess(
    req: SetRoleTerminalAccessRequest,
    source: DownstreamRequestSource
  ): Promise<SetRoleTerminalAccessResponse> {
    return this.call('setRoleTerminalAccess', async () =>
      this.svc.setRoleTerminalAccess(
        req,
        await this.trusted.forBusinessCall(source, PERMISSION_TARGET_AUDIENCE, ['permission.terminal_access.role.manage'])
      )
    )
  }

  // Reads the effective terminal access for one account and whether an override exists.
  async getAccountTerminalAccess(
    req: GetAccountTerminalAccessRequest,
    source: DownstreamRequestSource
  ): Promise<GetAccountTerminalAccessResponse> {
    return this.call('getAccountTerminalAccess', async () =>
      this.svc.getAccountTerminalAccess(
        req,
        await this.trusted.forBusinessCall(source, PERMISSION_TARGET_AUDIENCE, ['permission.terminal_access.view'])
      )
    )
  }

  // Replaces the account-level terminal access override for one account.
  async replaceAccountTerminalAccessOverride(
    req: ReplaceAccountTerminalAccessOverrideRequest,
    source: DownstreamRequestSource
  ): Promise<ReplaceAccountTerminalAccessOverrideResponse> {
    return this.call('replaceAccountTerminalAccessOverride', async () =>
      this.svc.replaceAccountTerminalAccessOverride(
        req,
        await this.trusted.forBusinessCall(source, PERMISSION_TARGET_AUDIENCE, ['permission.terminal_access.account.manage'])
      )
    )
  }

  // Deletes the account-level terminal access override so the account inherits role defaults.
  async deleteAccountTerminalAccessOverride(
    req: DeleteAccountTerminalAccessOverrideRequest,
    source: DownstreamRequestSource
  ): Promise<DeleteAccountTerminalAccessOverrideResponse> {
    return this.call('deleteAccountTerminalAccessOverride', async () =>
      this.svc.deleteAccountTerminalAccessOverride(
        req,
        await this.trusted.forBusinessCall(source, PERMISSION_TARGET_AUDIENCE, ['permission.terminal_access.account.manage'])
      )
    )
  }

  // Replaces one role's navigation visibility configuration as a full set.
  async setRoleNavigationVisibility(
    req: SetRoleNavigationVisibilityRequest,
    source: DownstreamRequestSource
  ): Promise<RoleNavigationResponse> {
    return this.call('setRoleNavigationVisibility', async () =>
      this.svc.setRoleNavigationVisibility(
        req,
        await this.trusted.forBusinessCall(source, PERMISSION_TARGET_AUDIENCE, ['permission.role_instance.update'])
      )
    )
  }

  // Replaces one role's landing policy configuration as a full set.
  async setRoleLandingPolicies(
    req: SetRoleLandingPoliciesRequest,
    source: DownstreamRequestSource
  ): Promise<RoleNavigationResponse> {
    return this.call('setRoleLandingPolicies', async () =>
      this.svc.setRoleLandingPolicies(
        req,
        await this.trusted.forBusinessCall(source, PERMISSION_TARGET_AUDIENCE, ['permission.role_instance.update'])
      )
    )
  }

  // Resets one role instance navigation to match its linked template snapshot.
  async syncRoleNavigationFromTemplate(
    req: SyncRoleNavigationFromTemplateRequest,
    source: DownstreamRequestSource
  ): Promise<RoleNavigationResponse> {
    return this.call('syncRoleNavigationFromTemplate', async () =>
      this.svc.syncRoleNavigationFromTemplate(
        req,
        await this.trusted.forBusinessCall(source, PERMISSION_TARGET_AUDIENCE, ['permission.role_instance.sync_from_template'])
      )
    )
  }

  // Resolves the management preview for visible entries and default landing entry.
  async resolveNavigationPreview(
    req: ResolveNavigationPreviewRequest,
    source: DownstreamRequestSource
  ): Promise<ResolveNavigationPreviewResponse> {
    return this.call('resolveNavigationPreview', async () =>
      this.svc.resolveNavigationPreview(
        req,
        await this.trusted.forBusinessCall(source, PERMISSION_TARGET_AUDIENCE, ['permission.navigation.resolve_preview'])
      )
    )
  }

  private async call<T>(method: string, factory: () => any): Promise<T> {
    try {
      const result = await safeGrpcCall(await factory(), this.opts(method))
      return result as T
    } catch (error) {
      throw this.mapDownstreamError(error)
    }
  }

  private opts(method: string): SafeGrpcCallOptions {
    return { caller: CALLER, method }
  }

  private mapDownstreamError(error: unknown): unknown {
    if (!(error instanceof Error)) {
      return error
    }

    const message = error.message || 'Downstream service error'
    const normalized = message.toLowerCase()

    if (normalized.includes('authorization denied')) {
      return new HttpException(
        {
          code: 'AUTHORIZATION_DENIED',
          message: 'Authorization denied'
        },
        HttpStatus.FORBIDDEN
      )
    }

    if (normalized.includes('operator context is invalid')) {
      return new HttpException(
        {
          code: 'APP_SECURITY_004',
          message: 'Operator context is invalid'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }

    if (normalized.includes('operator context is missing')) {
      return new HttpException(
        {
          code: 'APP_SECURITY_003',
          message: 'Operator context is missing'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }

    if (normalized.includes('internal service metadata is missing')) {
      return new HttpException(
        {
          code: 'APP_SECURITY_001',
          message: 'Internal service metadata is missing'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }

    if (normalized.includes('internal service is not allowed')) {
      return new HttpException(
        {
          code: 'APP_SECURITY_002',
          message: 'Internal service is not allowed'
        },
        HttpStatus.FORBIDDEN
      )
    }

    if (normalized.includes('validation failed') || normalized.includes('must not be greater than')) {
      return new HttpException(
        {
          code: 'APP_VALIDATION_001',
          message
        },
        HttpStatus.BAD_REQUEST
      )
    }

    return error
  }
}
