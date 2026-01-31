// File: src/common/contracts/permission-service/index.ts
import { Permission, Role } from '../../dtos/permission-service/all.dto'

export interface SomePort {
  getUserPermissions(userId: string): Promise<Permission[]>
  getUserRoles(userId: string): Promise<Role[]>
  getAccountPermissions(accountId: string): Promise<Permission[]>
  getAccountRoles(accountId: string): Promise<Role[]>
  checkUserPermission(userId: string, permissionCode: string): Promise<boolean>
  checkUserRole(userId: string, roleCode: string): Promise<boolean>
  checkAccountPermission(accountId: string, permissionCode: string): Promise<boolean>
  checkAccountRole(accountId: string, roleCode: string): Promise<boolean>
  getUserAllPermissions(userId: string): Promise<Permission[]>
  getAccountAllPermissions(accountId: string): Promise<Permission[]>
  validatePermission(permissionCode: string): Promise<boolean>
  validateRole(roleCode: string): Promise<boolean>
  getPermissionByCode(permissionCode: string): Promise<Permission>
  getRoleByCode(roleCode: string): Promise<Role>
}
