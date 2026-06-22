import { Injectable } from '@nestjs/common'
import {
  AccountRoleSelectionResponse,
  AssignAccountRoleRequest,
  AssignRolePermissionRequest,
  AssignRoleTemplatePermissionRequest,
  CreateNavigationEntryRequest,
  CreatePermissionRequest,
  CreateRoleInstanceFromTemplateRequest,
  CreateRoleInstanceRequest,
  CreateRoleTemplateRequest,
  DeleteAccountTerminalAccessOverrideRequest,
  DeletePermissionRequest,
  DeleteRoleRequest,
  DeleteRoleTemplateRequest,
  GetAccountRoleSelectionRequest,
  GetAccountTerminalAccessRequest,
  GetAccountTerminalAccessResponse,
  GetNavigationEntryRequest,
  GetPermissionByCodeRequest,
  GetPermissionByIdRequest,
  GetPolicyByIdRequest,
  GetRoleByIdRequest,
  GetRoleNavigationRequest,
  GetRoleTerminalAccessRequest,
  GetRoleTerminalAccessResponse,
  GetRoleTemplateByIdRequest,
  ListAccountRolesRequest,
  ListNavigationEntriesRequest,
  ListNavigationEntriesResponse,
  ListPoliciesByPermissionRequest,
  ListPoliciesPagedRequest,
  ListPoliciesResponse,
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
  NavigationEntryResponse,
  PagedPoliciesResponse,
  PagedPermissionsResponse,
  PermissionResponse,
  PolicyResponse,
  ResolveNavigationPreviewRequest,
  ResolveNavigationPreviewResponse,
  RevokeRolePermissionRequest,
  RevokeRoleTemplatePermissionRequest,
  RevokeAccountRoleRequest,
  ReplaceAccountTerminalAccessOverrideRequest,
  ReplaceAccountTerminalAccessOverrideResponse,
  RoleNavigationResponse,
  RoleResponse,
  SetAccountRolesRequest,
  SetRoleLandingPoliciesRequest,
  SyncRoleNavigationFromTemplateRequest,
  SetRoleEnabledRequest,
  SetRoleNavigationVisibilityRequest,
  SetRoleTerminalAccessRequest,
  SetRoleTerminalAccessResponse,
  SetRoleTemplateEnabledRequest,
  UpdateNavigationEntryRequest,
  UpdatePermissionRequest,
  UpdateRoleRequest,
  UpdateRoleTemplateRequest
} from '@oes/common/generated/permission_service'
import { DownstreamRequestSource } from '../../common/grpc/gateway-downstream-source.mapper'
import { PolicyManagementGrpcAdapter } from './adapters/policy-management-grpc.adapter'
import {
  CreatePolicyInstanceRequest,
  GetPolicyInstanceRequest,
  ListPolicyInstancesRequest,
  PolicyInstanceManagementGrpcAdapter,
  SetPolicyInstanceEnabledRequest
} from './adapters/policy-instance-management-grpc.adapter'
import { PolicyInstancePreviewGrpcAdapter } from './adapters/policy-instance-preview-grpc.adapter'
import { PermissionManagementGrpcAdapter } from './adapters/permission-management-grpc.adapter'
import { EvaluatePolicyInstancePreviewDto } from './interface/http/dtos/policy-instance-preview.dto'

// Provides the gateway-facing permission management port over the downstream gRPC adapter.
@Injectable()
export class PermissionProxyService {
  constructor(
    private readonly managementPort: PermissionManagementGrpcAdapter,
    private readonly policyManagementPort: PolicyManagementGrpcAdapter,
    private readonly policyInstanceManagementPort: PolicyInstanceManagementGrpcAdapter,
    private readonly policyInstancePreviewPort: PolicyInstancePreviewGrpcAdapter
  ) {}

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

  // Reads a paged policy governance list for readonly management tables.
  async listPolicies(
    req: ListPoliciesPagedRequest & { hasIsEnabledFilter?: boolean },
    source: DownstreamRequestSource
  ): Promise<PagedPoliciesResponse> {
    return this.policyManagementPort.listPolicies(req, source)
  }

  // Reads one policy governance record by id for readonly detail views.
  async getPolicyById(
    req: GetPolicyByIdRequest,
    source: DownstreamRequestSource
  ): Promise<PolicyResponse> {
    return this.policyManagementPort.getPolicyById(req, source)
  }

  // Reads policy governance records linked to one permission code.
  async listPermissionPolicies(
    req: ListPoliciesByPermissionRequest,
    source: DownstreamRequestSource
  ): Promise<ListPoliciesResponse> {
    return this.policyManagementPort.listPoliciesByPermission(req, source)
  }

  // Reads paged PolicyInstance governance records from the new template-based policy model.
  async listPolicyInstances(req: ListPolicyInstancesRequest, source: DownstreamRequestSource) {
    return this.policyInstanceManagementPort.listPolicyInstances(req, source)
  }

  // Reads one PolicyInstance governance record by id from the new template-based policy model.
  async getPolicyInstanceById(req: GetPolicyInstanceRequest, source: DownstreamRequestSource) {
    return this.policyInstanceManagementPort.getPolicyInstanceById(req, source)
  }

  // Creates one template-based PolicyInstance authorization fact.
  async createPolicyInstance(req: CreatePolicyInstanceRequest, source: DownstreamRequestSource) {
    return this.policyInstanceManagementPort.createPolicyInstance(req, source)
  }

  // Enables or disables one template-based PolicyInstance authorization fact.
  async setPolicyInstanceEnabled(
    req: SetPolicyInstanceEnabledRequest,
    source: DownstreamRequestSource
  ) {
    return this.policyInstanceManagementPort.setPolicyInstanceEnabled(req, source)
  }

  // Evaluates a preview-only PolicyInstance request without persisting policy facts.
  async evaluatePolicyInstancePreview(
    req: EvaluatePolicyInstancePreviewDto,
    source: DownstreamRequestSource
  ) {
    return this.policyInstancePreviewPort.evaluatePolicyInstancePreview(req, source)
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

  // Reads effective terminal access for one account management view.
  async getAccountTerminalAccess(
    req: GetAccountTerminalAccessRequest,
    source: DownstreamRequestSource
  ): Promise<GetAccountTerminalAccessResponse> {
    return this.managementPort.getAccountTerminalAccess(req, source)
  }

  // Replaces one account's terminal access override.
  async replaceAccountTerminalAccessOverride(
    req: ReplaceAccountTerminalAccessOverrideRequest,
    source: DownstreamRequestSource
  ): Promise<ReplaceAccountTerminalAccessOverrideResponse> {
    return this.managementPort.replaceAccountTerminalAccessOverride(req, source)
  }

  // Deletes one account's terminal access override and returns effective role-based access.
  async deleteAccountTerminalAccessOverride(
    req: DeleteAccountTerminalAccessOverrideRequest,
    source: DownstreamRequestSource
  ) {
    return this.managementPort.deleteAccountTerminalAccessOverride(req, source)
  }

  // Reads account-role bindings that currently reference one role instance.
  async listRoleAccounts(
    req: ListRoleAccountsRequest,
    source: DownstreamRequestSource
  ): Promise<ListRoleAccountsResponse> {
    return this.managementPort.listRoleAccounts(req, source)
  }

  // Reads managed navigation entry registry records for navigation administration.
  async listNavigationEntries(
    req: ListNavigationEntriesRequest,
    source: DownstreamRequestSource
  ): Promise<ListNavigationEntriesResponse> {
    return this.managementPort.listNavigationEntries(req, source)
  }

  // Reads one managed navigation entry registry record by entry key.
  async getNavigationEntry(
    req: GetNavigationEntryRequest,
    source: DownstreamRequestSource
  ): Promise<NavigationEntryResponse> {
    return this.managementPort.getNavigationEntry(req, source)
  }

  // Creates one managed navigation entry registry record.
  async createNavigationEntry(
    req: CreateNavigationEntryRequest,
    source: DownstreamRequestSource
  ): Promise<NavigationEntryResponse> {
    return this.managementPort.createNavigationEntry(req, source)
  }

  // Updates mutable metadata on one managed navigation entry registry record.
  async updateNavigationEntry(
    req: UpdateNavigationEntryRequest,
    source: DownstreamRequestSource
  ): Promise<NavigationEntryResponse> {
    return this.managementPort.updateNavigationEntry(req, source)
  }

  // Reads role-scoped navigation visibility and landing policy configuration.
  async getRoleNavigation(
    req: GetRoleNavigationRequest,
    source: DownstreamRequestSource
  ): Promise<RoleNavigationResponse> {
    return this.managementPort.getRoleNavigation(req, source)
  }

  // Reads the role-level terminal defaults used by terminal access resolution.
  async getRoleTerminalAccess(
    req: GetRoleTerminalAccessRequest,
    source: DownstreamRequestSource
  ): Promise<GetRoleTerminalAccessResponse> {
    return this.managementPort.getRoleTerminalAccess(req, source)
  }

  // Replaces the role-level terminal defaults used by terminal access resolution.
  async setRoleTerminalAccess(
    req: SetRoleTerminalAccessRequest,
    source: DownstreamRequestSource
  ): Promise<SetRoleTerminalAccessResponse> {
    return this.managementPort.setRoleTerminalAccess(req, source)
  }

  // Replaces one role's navigation visibility configuration as a full set.
  async setRoleNavigationVisibility(
    req: SetRoleNavigationVisibilityRequest,
    source: DownstreamRequestSource
  ): Promise<RoleNavigationResponse> {
    return this.managementPort.setRoleNavigationVisibility(req, source)
  }

  // Replaces one role's landing policy configuration as a full set.
  async setRoleLandingPolicies(
    req: SetRoleLandingPoliciesRequest,
    source: DownstreamRequestSource
  ): Promise<RoleNavigationResponse> {
    return this.managementPort.setRoleLandingPolicies(req, source)
  }

  // Resets one role instance navigation to match its linked template snapshot.
  async syncRoleNavigationFromTemplate(
    req: SyncRoleNavigationFromTemplateRequest,
    source: DownstreamRequestSource
  ): Promise<RoleNavigationResponse> {
    return this.managementPort.syncRoleNavigationFromTemplate(req, source)
  }

  // Resolves a management preview for visible entries and default landing entry.
  async resolveNavigationPreview(
    req: ResolveNavigationPreviewRequest,
    source: DownstreamRequestSource
  ): Promise<ResolveNavigationPreviewResponse> {
    return this.managementPort.resolveNavigationPreview(req, source)
  }
}
