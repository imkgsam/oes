import { Injectable } from '@nestjs/common'
import {
  AccountRoleSelectionResponse,
  AssignAccountRoleRequest,
  CreatePermissionRequest,
  DeletePermissionRequest,
  GetPermissionByCodeRequest,
  GetPermissionByIdRequest,
  GetAccountRoleSelectionRequest,
  ListPermissionRolesRequest,
  ListPermissionsPagedRequest,
  PagedPermissionsResponse,
  PermissionResponse,
  UpdatePermissionRequest,
  AssignRolePermissionRequest,
  AssignRoleTemplatePermissionRequest,
  CreateRoleInstanceRequest,
  CreateRoleInstanceFromTemplateRequest,
  CreateRoleTemplateRequest,
  DeleteRoleRequest,
  DeleteRoleTemplateRequest,
  GetRoleByIdRequest,
  GetRoleTemplateByIdRequest,
  ListAccountRolesRequest,
  ListPermissionsResponse,
  ListRoleAccountsRequest,
  ListRoleAccountsResponse,
  ListRolePermissionsRequest,
  ListRoleInstancesRequest,
  ListRoleTemplatePermissionsRequest,
  ListRoleTemplatesRequest,
  ListRolesResponse,
  RoleResponse,
  RevokeRolePermissionRequest,
  RevokeRoleTemplatePermissionRequest,
  RevokeAccountRoleRequest,
  SetAccountRolesRequest,
  SetRoleEnabledRequest,
  SetRoleTemplateEnabledRequest,
  UpdateRoleRequest,
  UpdateRoleTemplateRequest
} from '@oes/common/generated/permission_service'
import { DownstreamRequestSource } from '../../common/grpc/gateway-downstream-source.mapper'
import { PermissionManagementGrpcAdapter } from './adapters/permission-management-grpc.adapter'

// Provides the gateway-facing permission management port over the downstream gRPC adapter.
@Injectable()
export class PermissionProxyService {
  constructor(private readonly managementPort: PermissionManagementGrpcAdapter) {}

  async createPermission(
    req: CreatePermissionRequest,
    source: DownstreamRequestSource
  ): Promise<PermissionResponse> {
    return this.managementPort.createPermission(req, source)
  }

  async deletePermission(
    req: DeletePermissionRequest,
    source: DownstreamRequestSource
  ): Promise<void> {
    return this.managementPort.deletePermission(req, source)
  }

  // Updates mutable fields on one global permission dictionary item.
  async updatePermission(
    req: UpdatePermissionRequest,
    source: DownstreamRequestSource
  ): Promise<PermissionResponse> {
    return this.managementPort.updatePermission(req, source)
  }

  // Reads one permission dictionary item by id for management detail pages.
  async getPermissionById(
    req: GetPermissionByIdRequest,
    source: DownstreamRequestSource
  ): Promise<PermissionResponse> {
    return this.managementPort.getPermissionById(req, source)
  }

  // Reads one permission dictionary item by code for dictionary lookups.
  async getPermissionByCode(
    req: GetPermissionByCodeRequest,
    source: DownstreamRequestSource
  ): Promise<PermissionResponse> {
    return this.managementPort.getPermissionByCode(req, source)
  }

  // Reads a paged permission dictionary list for management tables.
  async listPermissions(
    req: ListPermissionsPagedRequest,
    source: DownstreamRequestSource
  ): Promise<PagedPermissionsResponse> {
    return this.managementPort.listPermissions(req, source)
  }

  // Reads role references for one permission dictionary item.
  async listPermissionRoles(
    req: ListPermissionRolesRequest,
    source: DownstreamRequestSource
  ): Promise<ListRolesResponse> {
    return this.managementPort.listPermissionRoles(req, source)
  }

  async deleteRole(req: DeleteRoleRequest, source: DownstreamRequestSource): Promise<void> {
    return this.managementPort.deleteRole(req, source)
  }

  // Deletes one global role template.
  async deleteRoleTemplate(
    req: DeleteRoleTemplateRequest,
    source: DownstreamRequestSource
  ): Promise<void> {
    return this.managementPort.deleteRoleTemplate(req, source)
  }

  // Creates a system- or tenant-scoped role instance for role management pages.
  async createRole(
    req: CreateRoleInstanceRequest,
    source: DownstreamRequestSource
  ): Promise<RoleResponse> {
    return this.managementPort.createRole(req, source)
  }

  // Creates a global role template used to derive tenant role instances.
  async createRoleTemplate(
    req: CreateRoleTemplateRequest,
    source: DownstreamRequestSource
  ): Promise<RoleResponse> {
    return this.managementPort.createRoleTemplate(req, source)
  }

  // Updates mutable fields on one role instance.
  async updateRole(
    req: UpdateRoleRequest,
    source: DownstreamRequestSource
  ): Promise<RoleResponse> {
    return this.managementPort.updateRole(req, source)
  }

  // Enables or disables one role instance.
  async setRoleEnabled(
    req: SetRoleEnabledRequest,
    source: DownstreamRequestSource
  ): Promise<RoleResponse> {
    return this.managementPort.setRoleEnabled(req, source)
  }

  async getRoleById(
    req: GetRoleByIdRequest,
    source: DownstreamRequestSource
  ): Promise<RoleResponse> {
    return this.managementPort.getRoleById(req, source)
  }

  // Reads one role template by id for template detail pages.
  async getRoleTemplateById(
    req: GetRoleTemplateByIdRequest,
    source: DownstreamRequestSource
  ): Promise<RoleResponse> {
    return this.managementPort.getRoleTemplateById(req, source)
  }

  // Reads paged role instances for management tables.
  async listRoles(
    req: ListRoleInstancesRequest,
    source: DownstreamRequestSource
  ) {
    return this.managementPort.listRoles(req, source)
  }

  // Reads paged role templates for template management tables.
  async listRoleTemplates(
    req: ListRoleTemplatesRequest,
    source: DownstreamRequestSource
  ) {
    return this.managementPort.listRoleTemplates(req, source)
  }

  // Reads permissions assigned to one role instance.
  async listRolePermissions(
    req: ListRolePermissionsRequest,
    source: DownstreamRequestSource
  ): Promise<ListPermissionsResponse> {
    return this.managementPort.listRolePermissions(req, source)
  }

  // Reads permissions assigned to one role template.
  async listRoleTemplatePermissions(
    req: ListRoleTemplatePermissionsRequest,
    source: DownstreamRequestSource
  ): Promise<ListPermissionsResponse> {
    return this.managementPort.listRoleTemplatePermissions(req, source)
  }

  // Assigns one permission to one role instance.
  async assignRolePermission(
    req: AssignRolePermissionRequest,
    source: DownstreamRequestSource
  ): Promise<void> {
    return this.managementPort.assignRolePermission(req, source)
  }

  // Assigns one permission to one role template.
  async assignRoleTemplatePermission(
    req: AssignRoleTemplatePermissionRequest,
    source: DownstreamRequestSource
  ): Promise<void> {
    return this.managementPort.assignRoleTemplatePermission(req, source)
  }

  // Revokes one permission from one role instance.
  async revokeRolePermission(
    req: RevokeRolePermissionRequest,
    source: DownstreamRequestSource
  ): Promise<void> {
    return this.managementPort.revokeRolePermission(req, source)
  }

  // Revokes one permission from one role template.
  async revokeRoleTemplatePermission(
    req: RevokeRoleTemplatePermissionRequest,
    source: DownstreamRequestSource
  ): Promise<void> {
    return this.managementPort.revokeRoleTemplatePermission(req, source)
  }

  // Updates mutable fields on one role template.
  async updateRoleTemplate(
    req: UpdateRoleTemplateRequest,
    source: DownstreamRequestSource
  ): Promise<RoleResponse> {
    return this.managementPort.updateRoleTemplate(req, source)
  }

  // Enables or disables one role template.
  async setRoleTemplateEnabled(
    req: SetRoleTemplateEnabledRequest,
    source: DownstreamRequestSource
  ): Promise<RoleResponse> {
    return this.managementPort.setRoleTemplateEnabled(req, source)
  }

  // Creates a tenant role instance from one role template.
  async createRoleFromTemplate(
    req: CreateRoleInstanceFromTemplateRequest,
    source: DownstreamRequestSource
  ): Promise<RoleResponse> {
    return this.managementPort.createRoleFromTemplate(req, source)
  }

  // Reads the effective role bindings currently assigned to one account.
  async listAccountRoles(
    req: ListAccountRolesRequest,
    source: DownstreamRequestSource
  ): Promise<ListRolesResponse> {
    return this.managementPort.listAccountRoles(req, source)
  }

  // Reads assignable roles plus currently selected role ids for one account.
  async getAccountRoleSelection(
    req: GetAccountRoleSelectionRequest,
    source: DownstreamRequestSource
  ): Promise<AccountRoleSelectionResponse> {
    return this.managementPort.getAccountRoleSelection(req, source)
  }

  // Assigns one role instance to one account binding target.
  async assignAccountRole(
    req: AssignAccountRoleRequest,
    source: DownstreamRequestSource
  ): Promise<void> {
    return this.managementPort.assignAccountRole(req, source)
  }

  // Revokes one role instance from one account binding target.
  async revokeAccountRole(
    req: RevokeAccountRoleRequest,
    source: DownstreamRequestSource
  ): Promise<void> {
    return this.managementPort.revokeAccountRole(req, source)
  }

  // Replaces the effective role set for one account within one scope.
  async setAccountRoles(
    req: SetAccountRolesRequest,
    source: DownstreamRequestSource
  ): Promise<ListRolesResponse> {
    return this.managementPort.setAccountRoles(req, source)
  }

  // Reads account-role bindings that currently reference one role instance.
  async listRoleAccounts(
    req: ListRoleAccountsRequest,
    source: DownstreamRequestSource
  ): Promise<ListRoleAccountsResponse> {
    return this.managementPort.listRoleAccounts(req, source)
  }
}
