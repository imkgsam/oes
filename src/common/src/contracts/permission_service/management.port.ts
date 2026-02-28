import {
  CreatePermissionRequest,
  DeletePermissionRequest,
  GetPermissionByCodeRequest,
  ListPermissionsResponse,
  ListPermissionsByModuleRequest,
  PermissionResponse,
  CreateRoleRequest,
  DeleteRoleRequest,
  GetRoleByIdRequest,
  ListRolesResponse,
  RoleResponse
} from '../../generated/permission_service/permission_management'

export interface PermissionManagementPort {
  createPermission(req: CreatePermissionRequest): Promise<PermissionResponse>
  deletePermission(req: DeletePermissionRequest): Promise<void>
  getPermissionByCode(req: GetPermissionByCodeRequest): Promise<PermissionResponse>
  listPermissions(): Promise<ListPermissionsResponse>
  listPermissionsByModule(req: ListPermissionsByModuleRequest): Promise<ListPermissionsResponse>

  createRole(req: CreateRoleRequest): Promise<RoleResponse>
  deleteRole(req: DeleteRoleRequest): Promise<void>
  getRoleById(req: GetRoleByIdRequest): Promise<RoleResponse>
  listRoles(): Promise<ListRolesResponse>
}
