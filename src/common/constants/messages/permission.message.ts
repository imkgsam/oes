/**
 * Permission Service 消息定义
 *
 * 用于 TCP 通信的消息模式定义
 * 每个消息都包含详细的使用场景说明
 */

export const PERMISSION_MESSAGES = {
  // ==================== 权限相关消息 ====================

  /**
   * 创建权限
   * 使用场景：管理员创建新的权限
   * 参数：{ name: string, code: string, resource: string, action: string, description?: string }
   */
  CREATE_PERMISSION: 'permission.create',

  /**
   * 更新权限
   * 使用场景：管理员更新权限信息
   * 参数：{ id: string, name?: string, code?: string, resource?: string, action?: string, description?: string }
   */
  UPDATE_PERMISSION: 'permission.update',

  /**
   * 删除权限
   * 使用场景：管理员删除权限
   * 参数：{ id: string }
   */
  DELETE_PERMISSION: 'permission.delete',

  /**
   * 获取权限列表
   * 使用场景：获取所有权限或按条件筛选权限
   * 参数：{ page?: number, limit?: number, search?: string }
   */
  LIST_PERMISSIONS: 'permission.list',

  /**
   * 获取权限详情
   * 使用场景：获取特定权限的详细信息
   * 参数：{ id: string }
   */
  GET_PERMISSION_BY_ID: 'permission.get_by_id',

  /**
   * 根据代码获取权限
   * 使用场景：通过权限代码获取权限信息
   * 参数：{ code: string }
   */
  GET_PERMISSION_BY_CODE: 'permission.get_by_code',

  GET_PERMISSIONS_BY_MODULE: 'permission.get_by_module',

  // ==================== 角色相关消息 ====================

  /**
   * 创建角色
   * 使用场景：管理员创建新的角色
   * 参数：{ name: string, code: string, description?: string, permissionIds?: string[] }
   */
  CREATE_ROLE: 'permission.role.create',

  /**
   * 更新角色
   * 使用场景：管理员更新角色信息
   * 参数：{ id: string, name?: string, code?: string, description?: string, permissionIds?: string[] }
   */
  UPDATE_ROLE: 'permission.role.update',

  /**
   * 删除角色
   * 使用场景：管理员删除角色
   * 参数：{ id: string }
   */
  DELETE_ROLE_BY_ID: 'permission.role.delete_by_id',

  /**
   * 获取角色列表
   * 使用场景：获取所有角色或按条件筛选角色
   * 参数：{ page?: number, limit?: number, search?: string }
   */
  LIST_ROLES: 'permission.role.list',

  /**
   * 获取角色详情
   * 使用场景：获取特定角色的详细信息
   * 参数：{ id: string }
   */
  GET_ROLE_BY_ID: 'permission.role.get_by_id',

  /**
   * 根据代码获取角色
   * 使用场景：通过角色代码获取角色信息
   * 参数：{ code: string }
   */
  GET_ROLE_BY_CODE: 'permission.role.get_by_code',

  // ==================== 用户权限相关消息 ====================

  /**
   * 获取用户权限
   * 使用场景：获取用户的所有权限
   * 参数：{ userId: string }
   */
  GET_USER_PERMISSIONS: 'permission.user.get_permissions',

  /**
   * 获取用户角色
   * 使用场景：获取用户的所有角色
   * 参数：{ userId: string }
   */
  GET_USER_ROLES: 'permission.user.get_roles',

  /**
   * 检查用户权限
   * 使用场景：检查用户是否有特定权限
   * 参数：{ userId: string, permissionCode: string }
   */
  CHECK_USER_PERMISSION: 'permission.user.check_permission',

  /**
   * 检查用户角色
   * 使用场景：检查用户是否有特定角色
   * 参数：{ userId: string, roleCode: string }
   */
  CHECK_USER_ROLE: 'permission.user.check_role',

  /**
   * 分配用户权限
   * 使用场景：管理员为用户分配权限
   * 参数：{ userId: string, permissionIds: string[] }
   */
  ASSIGN_USER_PERMISSIONS: 'permission.user.assign_permissions',

  /**
   * 分配用户角色
   * 使用场景：管理员为用户分配角色
   * 参数：{ userId: string, roleIds: string[] }
   */
  ASSIGN_USER_ROLES: 'permission.user.assign_roles',

  /**
   * 撤销用户权限
   * 使用场景：管理员撤销用户的权限
   * 参数：{ userId: string, permissionIds: string[] }
   */
  REVOKE_USER_PERMISSIONS: 'permission.user.revoke_permissions',

  /**
   * 撤销用户角色
   * 使用场景：管理员撤销用户的角色
   * 参数：{ userId: string, roleIds: string[] }
   */
  REVOKE_USER_ROLES: 'permission.user.revoke_roles',

  // ==================== 账户权限相关消息 ====================

  /**
   * 获取账户权限
   * 使用场景：获取账户的所有权限
   * 参数：{ accountId: string }
   */
  GET_ACCOUNT_PERMISSIONS: 'permission.account.get_permissions',

  /**
   * 获取账户角色
   * 使用场景：获取账户的所有角色
   * 参数：{ accountId: string }
   */
  GET_ACCOUNT_ROLES: 'permission.account.get_roles',

  /**
   * 检查账户权限
   * 使用场景：检查账户是否有特定权限
   * 参数：{ accountId: string, permissionCode: string }
   */
  CHECK_ACCOUNT_PERMISSION: 'permission.account.check_permission',

  /**
   * 检查账户角色
   * 使用场景：检查账户是否有特定角色
   * 参数：{ accountId: string, roleCode: string }
   */
  CHECK_ACCOUNT_ROLE: 'permission.account.check_role',

  /**
   * 分配账户权限
   * 使用场景：管理员为账户分配权限
   * 参数：{ accountId: string, permissionIds: string[] }
   */
  ASSIGN_ACCOUNT_PERMISSIONS: 'permission.account.assign_permissions',

  /**
   * 分配账户角色
   * 使用场景：管理员为账户分配角色
   * 参数：{ accountId: string, roleIds: string[] }
   */
  ASSIGN_ACCOUNT_ROLES: 'permission.account.assign_roles',

  // ==================== 权限验证相关消息 ====================

  /**
   * 验证权限
   * 使用场景：验证权限是否存在且有效
   * 参数：{ permissionCode: string }
   */
  VALIDATE_PERMISSION: 'permission.validate',

  /**
   * 验证角色
   * 使用场景：验证角色是否存在且有效
   * 参数：{ roleCode: string }
   */
  VALIDATE_ROLE: 'permission.role.validate',

  /**
   * 获取用户所有权限
   * 使用场景：获取用户的所有权限（包括继承的）
   * 参数：{ userId: string }
   */
  GET_USER_ALL_PERMISSIONS: 'permission.user.get_all_permissions',

  /**
   * 获取账户所有权限
   * 使用场景：获取账户的所有权限（包括继承的）
   * 参数：{ accountId: string }
   */
  GET_ACCOUNT_ALL_PERMISSIONS: 'permission.account.get_all_permissions',

  // ==================== 健康检查消息 ====================

  /**
   * 健康检查
   * 使用场景：检查权限服务的健康状态
   * 参数：{}
   */
  HEALTH_CHECK: 'permission.health_check',

  /**
   * 获取服务状态
   * 使用场景：获取权限服务的详细状态信息
   * 参数：{}
   */
  GET_SERVICE_STATUS: 'permission.get_service_status'
}
