import {
  AccountInfo,
  AccountTenantRelation,
  TenantInfo,
  UserAccountRelation,
  UserInfo
} from '../../dtos/identity-service/api/rpc/all.dto'

/**
 * RPC 测试接口
 */
export interface IIdentityServiceRpcTestPort {
  testing(): Promise<void>
}

/**
 * RPC 接口
 */
export interface IIdentityServiceRpcPort {}

/**
 * HTTP 接口
 */
export interface IIdentityServiceHttpPort {}

/**
 * 汇总服务接口
 * 汇总服务接口不包含任何接口定义，只是为了方便管理所有的接口
 */
export interface IIdentityServicePort extends IIdentityServiceRpcPort, IIdentityServiceHttpPort {
  // =================以下的接口需要整理归类到所属的ports中 =================
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
