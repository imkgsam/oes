import {
  CreatePermissionRequest,
  DeletePermissionRequest,
  GetPermissionByCodeRequest,
  ListPermissionsResponse,
  ListPermissionsByModuleRequest,
  PermissionResponse,
  CreateRoleRequest,
  UpdateRoleRequest,
  SetRoleEnabledRequest,
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
  deletePermission(req: DeletePermissionRequest): Promise<void>
  getPermissionByCode(req: GetPermissionByCodeRequest): Promise<PermissionResponse>
  listPermissions(): Promise<ListPermissionsResponse>
  listPermissionsByModule(req: ListPermissionsByModuleRequest): Promise<ListPermissionsResponse>

  createRole(req: CreateRoleRequest): Promise<RoleResponse>
  updateRole(req: UpdateRoleRequest): Promise<RoleResponse>
  setRoleEnabled(req: SetRoleEnabledRequest): Promise<RoleResponse>
  deleteRole(req: DeleteRoleRequest): Promise<void>
  getRoleById(req: GetRoleByIdRequest): Promise<RoleResponse>
  listRoles(): Promise<ListRolesResponse>
  listRolePermissions(req: ListRolePermissionsRequest): Promise<ListPermissionsResponse>
  listRoleAccounts(req: ListRoleAccountsRequest): Promise<ListRoleAccountsResponse>
  getAccountRoleSelection(
    req: GetAccountRoleSelectionRequest
  ): Promise<AccountRoleSelectionResponse>
  setAccountRoles(req: SetAccountRolesRequest): Promise<ListRolesResponse>
}
