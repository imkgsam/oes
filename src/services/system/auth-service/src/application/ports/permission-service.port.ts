/**
 * Permission Service 端口接口
 *
 * Auth Service 依赖 Permission Service 来获取用户权限、角色等信息
 */

export interface Permission {
  id: string
  name: string
  code: string
  resource: string
  action: string
  description?: string
}

export interface Role {
  id: string
  name: string
  code: string
  description?: string
  permissions: Permission[]
}

export interface UserPermission {
  userId: string
  permissionId: string
  granted: boolean
  grantedAt?: Date
  grantedBy?: string
  expiresAt?: Date
}

export interface UserRole {
  userId: string
  roleId: string
  granted: boolean
  grantedAt?: Date
  grantedBy?: string
  expiresAt?: Date
}

export interface AccountPermission {
  accountId: string
  permissionId: string
  granted: boolean
  grantedAt?: Date
  grantedBy?: string
  expiresAt?: Date
}

export interface AccountRole {
  accountId: string
  roleId: string
  granted: boolean
  grantedAt?: Date
  grantedBy?: string
  expiresAt?: Date
}

/**
 * Permission Service 端口接口
 */
export interface IPermissionServicePort {
  /**
   * 获取用户的所有权限
   * @param userId 用户ID
   * @returns 用户权限列表
   */
  getUserPermissions(userId: string): Promise<Permission[]>

  /**
   * 获取用户的所有角色
   * @param userId 用户ID
   * @returns 用户角色列表
   */
  getUserRoles(userId: string): Promise<Role[]>

  /**
   * 获取账户的所有权限
   * @param accountId 账户ID
   * @returns 账户权限列表
   */
  getAccountPermissions(accountId: string): Promise<Permission[]>

  /**
   * 获取账户的所有角色
   * @param accountId 账户ID
   * @returns 账户角色列表
   */
  getAccountRoles(accountId: string): Promise<Role[]>

  /**
   * 检查用户是否有指定权限
   * @param userId 用户ID
   * @param permissionCode 权限代码
   * @returns 是否有权限
   */
  checkUserPermission(userId: string, permissionCode: string): Promise<boolean>

  /**
   * 检查用户是否有指定角色
   * @param userId 用户ID
   * @param roleCode 角色代码
   * @returns 是否有角色
   */
  checkUserRole(userId: string, roleCode: string): Promise<boolean>

  /**
   * 检查账户是否有指定权限
   * @param accountId 账户ID
   * @param permissionCode 权限代码
   * @returns 是否有权限
   */
  checkAccountPermission(
    accountId: string,
    permissionCode: string
  ): Promise<boolean>

  /**
   * 检查账户是否有指定角色
   * @param accountId 账户ID
   * @param roleCode 角色代码
   * @returns 是否有角色
   */
  checkAccountRole(accountId: string, roleCode: string): Promise<boolean>

  /**
   * 获取用户的所有权限（包括继承的）
   * @param userId 用户ID
   * @returns 用户所有权限列表
   */
  getUserAllPermissions(userId: string): Promise<Permission[]>

  /**
   * 获取账户的所有权限（包括继承的）
   * @param accountId 账户ID
   * @returns 账户所有权限列表
   */
  getAccountAllPermissions(accountId: string): Promise<Permission[]>

  /**
   * 验证权限是否存在
   * @param permissionCode 权限代码
   * @returns 是否存在
   */
  validatePermission(permissionCode: string): Promise<boolean>

  /**
   * 验证角色是否存在
   * @param roleCode 角色代码
   * @returns 是否存在
   */
  validateRole(roleCode: string): Promise<boolean>

  /**
   * 获取权限详情
   * @param permissionCode 权限代码
   * @returns 权限详情
   */
  getPermissionByCode(permissionCode: string): Promise<Permission>

  /**
   * 获取角色详情
   * @param roleCode 角色代码
   * @returns 角色详情
   */
  getRoleByCode(roleCode: string): Promise<Role>
}
