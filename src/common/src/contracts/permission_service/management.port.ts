import {
  BatchCreatePermissionsRequest,
  CreatePermissionRequest,
  UpdatePermissionRequest,
  DeletePermissionRequest,
  GetPermissionByCodeRequest,
  ListPermissionRolesRequest,
  ListPermissionsResponse,
  ListPermissionsPagedRequest,
  PagedPermissionsResponse,
  PermissionResponse,
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
  DeleteRoleRequest,
  GetRoleByIdRequest,
  ListRoleInstancesRequest,
  ListRolePermissionsRequest,
  ListRoleAccountsRequest,
  GetAccountRoleSelectionRequest,
  AccountRoleSelectionResponse,
  ListAuditEventsRequest,
  ListAuditEventsResponse,
  SetAccountRolesRequest,
  ListRoleTemplatesRequest,
  ListRolesResponse,
  ListRoleAccountsResponse,
  PagedRolesResponse,
  RoleResponse,
  AssignAccountRoleRequest,
  AssignAccountRoleResponse,
  ListAccountRolesRequest,
  ListAccountRolesResponse,
  RevokeAccountRoleRequest,
  RevokeAccountRoleResponse,
  RevokePrincipalRoleBindingRequest,
  RevokePrincipalRoleBindingResponse,
  SetAccountRolesResponse
} from '../../generated/permission_service/permission_management'

/** Defines the shared permission management application boundary consumed by transport adapters. */
export interface PermissionManagementPort {
  createPermission(req: CreatePermissionRequest): Promise<PermissionResponse>
  batchCreatePermissions(req: BatchCreatePermissionsRequest): Promise<ListPermissionsResponse>
  updatePermission(req: UpdatePermissionRequest): Promise<PermissionResponse>
  deletePermission(req: DeletePermissionRequest): Promise<void>
  getPermissionByCode(req: GetPermissionByCodeRequest): Promise<PermissionResponse>
  listPermissionsPaged(req: ListPermissionsPagedRequest): Promise<PagedPermissionsResponse>
  listPermissionRoles(req: ListPermissionRolesRequest): Promise<ListRolesResponse>

  createRoleTemplate(req: CreateRoleTemplateRequest): Promise<RoleResponse>
  createRoleInstance(req: CreateRoleInstanceRequest): Promise<RoleResponse>
  getRoleTemplateById(req: GetRoleTemplateByIdRequest): Promise<RoleResponse>
  updateRoleTemplate(req: UpdateRoleTemplateRequest): Promise<RoleResponse>
  deleteRoleTemplate(req: DeleteRoleTemplateRequest): Promise<void>
  setRoleTemplateEnabled(req: SetRoleTemplateEnabledRequest): Promise<RoleResponse>
  listRoleTemplatePermissions(req: ListRoleTemplatePermissionsRequest): Promise<ListPermissionsResponse>
  assignRoleTemplatePermission(req: AssignRoleTemplatePermissionRequest): Promise<void>
  revokeRoleTemplatePermission(req: RevokeRoleTemplatePermissionRequest): Promise<void>
  createRoleInstanceFromTemplate(req: CreateRoleInstanceFromTemplateRequest): Promise<RoleResponse>
  updateRole(req: UpdateRoleRequest): Promise<RoleResponse>
  setRoleEnabled(req: SetRoleEnabledRequest): Promise<RoleResponse>
  deleteRole(req: DeleteRoleRequest): Promise<void>
  getRoleById(req: GetRoleByIdRequest): Promise<RoleResponse>
  listRoleInstances(req: ListRoleInstancesRequest): Promise<PagedRolesResponse>
  listRoleTemplates(req: ListRoleTemplatesRequest): Promise<PagedRolesResponse>
  listRolePermissions(req: ListRolePermissionsRequest): Promise<ListPermissionsResponse>
  assignAccountRole(req: AssignAccountRoleRequest): Promise<AssignAccountRoleResponse>
  revokePrincipalRoleBinding(
    req: RevokePrincipalRoleBindingRequest
  ): Promise<RevokePrincipalRoleBindingResponse>
  /** @deprecated Compatibility-window-only selector for legacy AccountRole records. */
  revokeAccountRole(req: RevokeAccountRoleRequest): Promise<RevokeAccountRoleResponse>
  listAccountRoles(req: ListAccountRolesRequest): Promise<ListAccountRolesResponse>
  listRoleAccounts(req: ListRoleAccountsRequest): Promise<ListRoleAccountsResponse>
  getAccountRoleSelection(
    req: GetAccountRoleSelectionRequest
  ): Promise<AccountRoleSelectionResponse>
  listAuditEvents(req: ListAuditEventsRequest): Promise<ListAuditEventsResponse>
  setAccountRoles(req: SetAccountRolesRequest): Promise<SetAccountRolesResponse>
}
