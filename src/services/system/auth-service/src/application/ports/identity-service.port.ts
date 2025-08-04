/**
 * Identity Service 端口接口
 *
 * Auth Service 依赖 Identity Service 来获取用户、账户、租户等信息
 */

export interface UserInfo {
  id: string
  username: string
  email?: string
  phone?: string
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED'
  createdAt: Date
  updatedAt: Date
}

export interface AccountInfo {
  id: string
  name: string
  type: 'PERSONAL' | 'BUSINESS' | 'ENTERPRISE'
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED'
  createdAt: Date
  updatedAt: Date
}

export interface TenantInfo {
  id: string
  name: string
  code: string
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED'
  createdAt: Date
  updatedAt: Date
}

export interface UserAccountRelation {
  userId: string
  accountId: string
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST'
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  joinedAt: Date
}

export interface AccountTenantRelation {
  accountId: string
  tenantId: string
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST'
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  joinedAt: Date
}

/**
 * Identity Service 端口接口
 */
export interface IIdentityServicePort {
  /**
   * 根据用户ID获取用户信息
   * @param userId 用户ID
   * @returns 用户信息
   */
  getUserById(userId: string): Promise<UserInfo>

  /**
   * 根据邮箱获取用户信息
   * @param email 邮箱地址
   * @returns 用户信息
   */
  getUserByEmail(email: string): Promise<UserInfo>

  /**
   * 根据手机号获取用户信息
   * @param phone 手机号
   * @returns 用户信息
   */
  getUserByPhone(phone: string): Promise<UserInfo>

  /**
   * 根据账户ID获取账户信息
   * @param accountId 账户ID
   * @returns 账户信息
   */
  getAccountById(accountId: string): Promise<AccountInfo>

  /**
   * 根据租户ID获取租户信息
   * @param tenantId 租户ID
   * @returns 租户信息
   */
  getTenantById(tenantId: string): Promise<TenantInfo>

  /**
   * 获取用户的所有账户关系
   * @param userId 用户ID
   * @returns 用户账户关系列表
   */
  getUserAccountRelations(userId: string): Promise<UserAccountRelation[]>

  /**
   * 获取账户的所有租户关系
   * @param accountId 账户ID
   * @returns 账户租户关系列表
   */
  getAccountTenantRelations(accountId: string): Promise<AccountTenantRelation[]>

  /**
   * 验证用户是否存在且状态正常
   * @param userId 用户ID
   * @returns 是否有效
   */
  validateUser(userId: string): Promise<boolean>

  /**
   * 验证账户是否存在且状态正常
   * @param accountId 账户ID
   * @returns 是否有效
   */
  validateAccount(accountId: string): Promise<boolean>

  /**
   * 验证租户是否存在且状态正常
   * @param tenantId 租户ID
   * @returns 是否有效
   */
  validateTenant(tenantId: string): Promise<boolean>

  /**
   * 获取用户的默认账户
   * @param userId 用户ID
   * @returns 默认账户信息
   */
  getUserDefaultAccount(userId: string): Promise<AccountInfo>

  /**
   * 获取账户的默认租户
   * @param accountId 账户ID
   * @returns 默认租户信息
   */
  getAccountDefaultTenant(accountId: string): Promise<TenantInfo>
}
