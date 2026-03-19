import {
  BatchCreatePermissionsRequest,
  CreatePermissionRequest,
  UpdatePermissionRequest,
  DeletePermissionRequest,
  GetPermissionByCodeRequest,
  ListPermissionRolesRequest,
  ListPermissionsResponse,
  ListPermissionsByModuleRequest,
  ListPermissionsPagedRequest,
  PagedPermissionsResponse,
  PermissionResponse,
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
  ListRoleInstancesRequest,
  ListRoleTemplatesRequest,
  PagedRolesResponse,
  DeleteRoleRequest,
  GetRoleByIdRequest,
  ListRolePermissionsRequest,
  ListRoleAccountsRequest,
  GetAccountRoleSelectionRequest,
  AccountRoleSelectionResponse,
  SetAccountRolesRequest,
  ListRolesResponse,
  ListRoleAccountsResponse,
  RoleResponse
} from '../../generated/permission_service/permission_management'

export interface PermissionManagementPort {
  createPermission(req: CreatePermissionRequest): Promise<PermissionResponse>
  batchCreatePermissions(req: BatchCreatePermissionsRequest): Promise<ListPermissionsResponse>
  updatePermission(req: UpdatePermissionRequest): Promise<PermissionResponse>
  deletePermission(req: DeletePermissionRequest): Promise<void>
  getPermissionByCode(req: GetPermissionByCodeRequest): Promise<PermissionResponse>
  listPermissions(): Promise<ListPermissionsResponse>
  listPermissionsByModule(req: ListPermissionsByModuleRequest): Promise<ListPermissionsResponse>
  listPermissionsPaged(req: ListPermissionsPagedRequest): Promise<PagedPermissionsResponse>
  listPermissionRoles(req: ListPermissionRolesRequest): Promise<ListRolesResponse>

  createRole(req: CreateRoleRequest): Promise<RoleResponse>
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
  listRoles(): Promise<ListRolesResponse>
  listRoleInstances(req: ListRoleInstancesRequest): Promise<PagedRolesResponse>
  listRoleTemplates(req: ListRoleTemplatesRequest): Promise<PagedRolesResponse>
  listRolePermissions(req: ListRolePermissionsRequest): Promise<ListPermissionsResponse>
  listRoleAccounts(req: ListRoleAccountsRequest): Promise<ListRoleAccountsResponse>
  getAccountRoleSelection(
    req: GetAccountRoleSelectionRequest
  ): Promise<AccountRoleSelectionResponse>
  setAccountRoles(req: SetAccountRolesRequest): Promise<ListRolesResponse>
}
