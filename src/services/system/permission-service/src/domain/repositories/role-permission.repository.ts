import { RolePermission } from '../entities/role-permission.entity'

export abstract class RolePermissionRepository {
  abstract find(roleId: string, permissionId: string): Promise<RolePermission | null>
  abstract remove(roleId: string, permissionId: string): Promise<RolePermission | null>
  abstract add(rolePermission: RolePermission): Promise<RolePermission>
  abstract findByRoleIds(roleIds: string[]): Promise<RolePermission[]>
  abstract findByRoleId(roleId: string): Promise<RolePermission[]>
}
