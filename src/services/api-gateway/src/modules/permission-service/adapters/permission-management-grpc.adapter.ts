import { HttpException, HttpStatus, Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { SERVICE_NAMES } from '@oes/common/constants'
import { InjectGrpcClient } from '@oes/common/transport'
import { safeGrpcCall, SafeGrpcCallOptions } from '@oes/common/transport'
import {
  GRPC_METADATA_PROPAGATION_FACTORY,
  GrpcMetadataPropagationFactory
} from '@oes/common/authorization'
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
  DeletePermissionRequest,
  GetAccountRoleSelectionRequest,
  GetNavigationEntryRequest,
  GetPermissionByCodeRequest,
  GetPermissionByIdRequest,
  GetRoleNavigationRequest,
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
  SetAccountRolesRequest,
  SetRoleEnabledRequest,
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
import {
  DownstreamRequestSource,
  toOperatorScopedMetadataInput
} from '../../../common/grpc/gateway-downstream-source.mapper'

const CALLER = 'api-gateway'

// Bridges gateway permission management requests onto the downstream permission-service gRPC contract.
@Injectable()
export class PermissionManagementGrpcAdapter implements OnModuleInit {
  private svc!: PermissionManagementServiceClient

  constructor(
    @InjectGrpcClient(SERVICE_NAMES.PERMISSION)
    private readonly client: ClientGrpc,
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory: GrpcMetadataPropagationFactory
  ) {}

  onModuleInit() {
    this.svc = this.client.getService<PermissionManagementServiceClient>(
      PERMISSION_MANAGEMENT_SERVICE_NAME
    )
  }

  // Permission methods

  async createPermission(
    req: CreatePermissionRequest,
    source: DownstreamRequestSource
  ): Promise<PermissionResponse> {
    return this.call('createPermission', () =>
      this.svc.createPermission(req, this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source)))
    )
  }

  async deletePermission(
    req: DeletePermissionRequest,
    source: DownstreamRequestSource
  ): Promise<void> {
    await this.call('deletePermission', () =>
      this.svc.deletePermission(req, this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source)))
    )
  }

  // Forwards permission dictionary updates to the downstream management gRPC contract.
  async updatePermission(
    req: UpdatePermissionRequest,
    source: DownstreamRequestSource
  ): Promise<PermissionResponse> {
    return this.call('updatePermission', () =>
      this.svc.updatePermission(
        req,
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  // Loads one permission dictionary item by its stable id through permission-service.
  async getPermissionById(
    req: GetPermissionByIdRequest,
    source: DownstreamRequestSource
  ): Promise<PermissionResponse> {
    return this.call('getPermissionById', () =>
      this.svc.getPermissionById(
        req,
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  // Loads one permission dictionary item by its stable code through permission-service.
  async getPermissionByCode(
    req: GetPermissionByCodeRequest,
    source: DownstreamRequestSource
  ): Promise<PermissionResponse> {
    return this.call('getPermissionByCode', () =>
      this.svc.getPermissionByCode(req, this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source)))
    )
  }

  // Forwards paged permission list queries while preserving downstream pagination metadata.
  async listPermissions(
    req: ListPermissionsPagedRequest,
    source: DownstreamRequestSource
  ): Promise<PagedPermissionsResponse> {
    return this.call<PagedPermissionsResponse>('listPermissionsPaged', () =>
      this.svc.listPermissionsPaged(
        {
          page: req.page || 1,
          pageSize: req.pageSize || 100,
          module: req.module || undefined,
          keyword: req.keyword || undefined
        } as ListPermissionsPagedRequest,
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  // Lists role summaries that currently include the selected permission.
  async listPermissionRoles(
    req: ListPermissionRolesRequest,
    source: DownstreamRequestSource
  ): Promise<ListRolesResponse> {
    return this.call('listPermissionRoles', () =>
      this.svc.listPermissionRoles(
        req,
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  // Role methods

  // Creates a role template through the downstream role management contract.
  async createRoleTemplate(
    req: CreateRoleTemplateRequest,
    source: DownstreamRequestSource
  ): Promise<RoleResponse> {
    return this.call('createRoleTemplate', () =>
      this.svc.createRoleTemplate(
        req,
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  // Creates a role instance through the downstream role management contract.
  async createRole(
    req: CreateRoleInstanceRequest,
    source: DownstreamRequestSource
  ): Promise<RoleResponse> {
    return this.call('createRoleInstance', () =>
      this.svc.createRoleInstance(
        req,
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  async deleteRole(req: DeleteRoleRequest, source: DownstreamRequestSource): Promise<void> {
    await this.call('deleteRole', () =>
      this.svc.deleteRole(req, this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source)))
    )
  }

  // Deletes one role template through permission-service.
  async deleteRoleTemplate(
    req: DeleteRoleTemplateRequest,
    source: DownstreamRequestSource
  ): Promise<void> {
    await this.call('deleteRoleTemplate', () =>
      this.svc.deleteRoleTemplate(
        req,
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  // Updates mutable fields on one role instance.
  async updateRole(
    req: UpdateRoleRequest,
    source: DownstreamRequestSource
  ): Promise<RoleResponse> {
    return this.call('updateRole', () =>
      this.svc.updateRole(
        req,
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  // Enables or disables one role instance through permission-service.
  async setRoleEnabled(
    req: SetRoleEnabledRequest,
    source: DownstreamRequestSource
  ): Promise<RoleResponse> {
    return this.call('setRoleEnabled', () =>
      this.svc.setRoleEnabled(
        req,
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  async getRoleById(
    req: GetRoleByIdRequest,
    source: DownstreamRequestSource
  ): Promise<RoleResponse> {
    return this.call('getRoleById', () =>
      this.svc.getRoleById(req, this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source)))
    )
  }

  // Reads one role template by id through permission-service.
  async getRoleTemplateById(
    req: GetRoleTemplateByIdRequest,
    source: DownstreamRequestSource
  ): Promise<RoleResponse> {
    return this.call('getRoleTemplateById', () =>
      this.svc.getRoleTemplateById(
        req,
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  // Forwards paged role instance queries while preserving downstream pagination metadata.
  async listRoles(
    req: ListRoleInstancesRequest,
    source: DownstreamRequestSource
  ): Promise<PagedRolesResponse> {
    return this.call<PagedRolesResponse>('listRoleInstances', () =>
      this.svc.listRoleInstances(
        {
          page: req.page || 1,
          pageSize: req.pageSize || 20,
          tenantId: req.tenantId || undefined,
          scopeLevel: req.scopeLevel || undefined,
          keyword: req.keyword || undefined
        } as ListRoleInstancesRequest,
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  // Forwards paged role template queries while preserving downstream pagination metadata.
  async listRoleTemplates(
    req: ListRoleTemplatesRequest,
    source: DownstreamRequestSource
  ): Promise<PagedRolesResponse> {
    return this.call<PagedRolesResponse>('listRoleTemplates', () =>
      this.svc.listRoleTemplates(
        {
          page: req.page || 1,
          pageSize: req.pageSize || 20,
          keyword: req.keyword || undefined
        } as ListRoleTemplatesRequest,
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  // Lists permissions assigned to one role instance.
  async listRolePermissions(
    req: ListRolePermissionsRequest,
    source: DownstreamRequestSource
  ): Promise<ListPermissionsResponse> {
    return this.call('listRolePermissions', () =>
      this.svc.listRolePermissions(
        req,
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  // Lists permissions assigned to one role template.
  async listRoleTemplatePermissions(
    req: ListRoleTemplatePermissionsRequest,
    source: DownstreamRequestSource
  ): Promise<ListPermissionsResponse> {
    return this.call('listRoleTemplatePermissions', () =>
      this.svc.listRoleTemplatePermissions(
        req,
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  // Assigns one permission to one role instance.
  async assignRolePermission(
    req: AssignRolePermissionRequest,
    source: DownstreamRequestSource
  ): Promise<void> {
    await this.call('assignRolePermission', () =>
      this.svc.assignRolePermission(
        req,
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  // Assigns one permission to one role template.
  async assignRoleTemplatePermission(
    req: AssignRoleTemplatePermissionRequest,
    source: DownstreamRequestSource
  ): Promise<void> {
    await this.call('assignRoleTemplatePermission', () =>
      this.svc.assignRoleTemplatePermission(
        req,
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  // Revokes one permission from one role instance.
  async revokeRolePermission(
    req: RevokeRolePermissionRequest,
    source: DownstreamRequestSource
  ): Promise<void> {
    await this.call('revokeRolePermission', () =>
      this.svc.revokeRolePermission(
        req,
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  // Revokes one permission from one role template.
  async revokeRoleTemplatePermission(
    req: RevokeRoleTemplatePermissionRequest,
    source: DownstreamRequestSource
  ): Promise<void> {
    await this.call('revokeRoleTemplatePermission', () =>
      this.svc.revokeRoleTemplatePermission(
        req,
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  // Updates mutable fields on one role template.
  async updateRoleTemplate(
    req: UpdateRoleTemplateRequest,
    source: DownstreamRequestSource
  ): Promise<RoleResponse> {
    return this.call('updateRoleTemplate', () =>
      this.svc.updateRoleTemplate(
        req,
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  // Enables or disables one role template through permission-service.
  async setRoleTemplateEnabled(
    req: SetRoleTemplateEnabledRequest,
    source: DownstreamRequestSource
  ): Promise<RoleResponse> {
    return this.call('setRoleTemplateEnabled', () =>
      this.svc.setRoleTemplateEnabled(
        req,
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  // Creates a tenant role instance from one role template.
  async createRoleFromTemplate(
    req: CreateRoleInstanceFromTemplateRequest,
    source: DownstreamRequestSource
  ): Promise<RoleResponse> {
    return this.call('createRoleInstanceFromTemplate', () =>
      this.svc.createRoleInstanceFromTemplate(
        req,
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  // Lists the effective role bindings currently assigned to one account.
  async listAccountRoles(
    req: ListAccountRolesRequest,
    source: DownstreamRequestSource
  ): Promise<ListRolesResponse> {
    return this.call('listAccountRoles', () =>
      this.svc.listAccountRoles(
        {
          accountId: req.accountId,
          tenantId: req.tenantId || undefined,
          scopeLevel: req.scopeLevel || undefined
        } as ListAccountRolesRequest,
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  // Lists assignable roles plus selected role ids for one account.
  async getAccountRoleSelection(
    req: GetAccountRoleSelectionRequest,
    source: DownstreamRequestSource
  ): Promise<AccountRoleSelectionResponse> {
    return this.call('getAccountRoleSelection', () =>
      this.svc.getAccountRoleSelection(
        {
          accountId: req.accountId,
          tenantId: req.tenantId || undefined,
          scopeLevel: req.scopeLevel || undefined
        } as GetAccountRoleSelectionRequest,
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  // Assigns one role instance to one account binding target.
  async assignAccountRole(
    req: AssignAccountRoleRequest,
    source: DownstreamRequestSource
  ): Promise<void> {
    await this.call('assignAccountRole', () =>
      this.svc.assignAccountRole(
        req,
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  // Revokes one role instance from one account binding target.
  async revokeAccountRole(
    req: RevokeAccountRoleRequest,
    source: DownstreamRequestSource
  ): Promise<void> {
    await this.call('revokeAccountRole', () =>
      this.svc.revokeAccountRole(
        req,
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  // Replaces the effective role set for one account within one scope.
  async setAccountRoles(
    req: SetAccountRolesRequest,
    source: DownstreamRequestSource
  ): Promise<ListRolesResponse> {
    return this.call('setAccountRoles', () =>
      this.svc.setAccountRoles(
        req,
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  // Lists account-role bindings that currently reference one role instance.
  async listRoleAccounts(
    req: ListRoleAccountsRequest,
    source: DownstreamRequestSource
  ): Promise<ListRoleAccountsResponse> {
    return this.call('listRoleAccounts', () =>
      this.svc.listRoleAccounts(
        req,
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  // Lists managed navigation entry registry records through permission-service.
  async listNavigationEntries(
    req: ListNavigationEntriesRequest,
    source: DownstreamRequestSource
  ): Promise<ListNavigationEntriesResponse> {
    return this.call('listNavigationEntries', () =>
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
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  // Reads one managed navigation entry registry record by stable entry key.
  async getNavigationEntry(
    req: GetNavigationEntryRequest,
    source: DownstreamRequestSource
  ): Promise<NavigationEntryResponse> {
    return this.call('getNavigationEntry', () =>
      this.svc.getNavigationEntry(
        req,
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  // Creates one managed navigation entry registry record.
  async createNavigationEntry(
    req: CreateNavigationEntryRequest,
    source: DownstreamRequestSource
  ): Promise<NavigationEntryResponse> {
    return this.call('createNavigationEntry', () =>
      this.svc.createNavigationEntry(
        req,
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  // Updates mutable metadata on one managed navigation entry registry record.
  async updateNavigationEntry(
    req: UpdateNavigationEntryRequest,
    source: DownstreamRequestSource
  ): Promise<NavigationEntryResponse> {
    return this.call('updateNavigationEntry', () =>
      this.svc.updateNavigationEntry(
        req,
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  // Reads role-scoped navigation visibility and landing policy configuration.
  async getRoleNavigation(
    req: GetRoleNavigationRequest,
    source: DownstreamRequestSource
  ): Promise<RoleNavigationResponse> {
    return this.call('getRoleNavigation', () =>
      this.svc.getRoleNavigation(
        req,
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  // Replaces one role's navigation visibility configuration as a full set.
  async setRoleNavigationVisibility(
    req: SetRoleNavigationVisibilityRequest,
    source: DownstreamRequestSource
  ): Promise<RoleNavigationResponse> {
    return this.call('setRoleNavigationVisibility', () =>
      this.svc.setRoleNavigationVisibility(
        req,
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  // Replaces one role's landing policy configuration as a full set.
  async setRoleLandingPolicies(
    req: SetRoleLandingPoliciesRequest,
    source: DownstreamRequestSource
  ): Promise<RoleNavigationResponse> {
    return this.call('setRoleLandingPolicies', () =>
      this.svc.setRoleLandingPolicies(
        req,
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  // Resets one role instance navigation to match its linked template snapshot.
  async syncRoleNavigationFromTemplate(
    req: SyncRoleNavigationFromTemplateRequest,
    source: DownstreamRequestSource
  ): Promise<RoleNavigationResponse> {
    return this.call('syncRoleNavigationFromTemplate', () =>
      this.svc.syncRoleNavigationFromTemplate(
        req,
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  // Resolves the management preview for visible entries and default landing entry.
  async resolveNavigationPreview(
    req: ResolveNavigationPreviewRequest,
    source: DownstreamRequestSource
  ): Promise<ResolveNavigationPreviewResponse> {
    return this.call('resolveNavigationPreview', () =>
      this.svc.resolveNavigationPreview(
        req,
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  private async call<T>(method: string, factory: () => any): Promise<T> {
    try {
      const result = await safeGrpcCall(factory(), this.opts(method))
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
