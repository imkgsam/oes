import { Injectable } from '@nestjs/common'
import { IIdentityServicePort } from '../../application/ports/identity-service.port'
import { IIdentityServiceContract } from '@oes/common/interfaces/services/identity-service'

/**
 * 身份服务适配器
 *
 * 职责：
 * 1. 实现与身份服务的RPC通信
 * 2. 提供用户和租户信息查询
 * 3. 处理身份验证和授权
 * 4. 封装身份服务的依赖
 *
 * 设计原则：
 * - 单一职责：专注于身份服务通信
 * - 错误处理：优雅处理RPC调用失败
 * - 缓存：减少重复的身份查询
 * - 可测试性：支持Mock实现
 */
@Injectable()
export class IdentityServiceAdapter implements IIdentityServicePort {
  constructor(private readonly identityServiceClient: IIdentityServiceContract) {}

  async getUserById(userId: string): Promise<any> {
    try {
      return await this.identityServiceClient.getUserById(userId)
    } catch (error) {
      console.error('Failed to get user by ID:', error)
      throw new Error(`Identity service error: ${error.message}`)
    }
  }

  async getUserByEmail(email: string): Promise<any> {
    try {
      return await this.identityServiceClient.getUserByEmail(email)
    } catch (error) {
      console.error('Failed to get user by email:', error)
      throw new Error(`Identity service error: ${error.message}`)
    }
  }

  async getUserByPhone(phone: string): Promise<any> {
    try {
      return await this.identityServiceClient.getUserByPhone(phone)
    } catch (error) {
      console.error('Failed to get user by phone:', error)
      throw new Error(`Identity service error: ${error.message}`)
    }
  }

  async getAccountsByUserId(userId: string): Promise<any[]> {
    try {
      return await this.identityServiceClient.getAccountsByUserId(userId)
    } catch (error) {
      console.error('Failed to get accounts by user ID:', error)
      throw new Error(`Identity service error: ${error.message}`)
    }
  }

  async getAccountById(accountId: string): Promise<any> {
    try {
      return await this.identityServiceClient.getAccountById(accountId)
    } catch (error) {
      console.error('Failed to get account by ID:', error)
      throw new Error(`Identity service error: ${error.message}`)
    }
  }

  /**
   * 验证用户是否存在
   */
  async validateUserExists(userId: string): Promise<boolean> {
    try {
      const user = await this.getUserById(userId)
      return !!user
    } catch (error) {
      return false
    }
  }

  /**
   * 验证用户是否属于指定租户
   */
  async validateUserTenant(userId: string, tenantId: string): Promise<boolean> {
    try {
      const accounts = await this.getAccountsByUserId(userId)
      return accounts.some((account) => account.tenantId === tenantId)
    } catch (error) {
      console.error('Failed to validate user tenant:', error)
      return false
    }
  }

  /**
   * 获取用户的租户列表
   */
  async getUserTenants(userId: string): Promise<string[]> {
    try {
      const accounts = await this.getAccountsByUserId(userId)
      return accounts.map((account) => account.tenantId)
    } catch (error) {
      console.error('Failed to get user tenants:', error)
      return []
    }
  }

  /**
   * 验证用户是否有权限访问资源
   */
  async validateUserResourceAccess(
    userId: string,
    tenantId: string,
    resourceType: string
  ): Promise<boolean> {
    try {
      // 首先验证用户是否属于租户
      const isUserInTenant = await this.validateUserTenant(userId, tenantId)
      if (!isUserInTenant) {
        return false
      }

      // 获取用户账户信息
      const accounts = await this.getAccountsByUserId(userId)
      const userAccount = accounts.find((account) => account.tenantId === tenantId)

      if (!userAccount) {
        return false
      }

      // 检查账户状态
      if (userAccount.status !== 'active') {
        return false
      }

      // 这里可以添加更细粒度的权限检查
      // 例如检查用户角色、权限等

      return true
    } catch (error) {
      console.error('Failed to validate user resource access:', error)
      return false
    }
  }

  /**
   * 获取用户详细信息（包含租户信息）
   */
  async getUserWithTenantInfo(
    userId: string,
    tenantId: string
  ): Promise<{
    user: any
    account: any
    tenant: any
  } | null> {
    try {
      const [user, accounts] = await Promise.all([
        this.getUserById(userId),
        this.getAccountsByUserId(userId)
      ])

      if (!user) {
        return null
      }

      const account = accounts.find((acc) => acc.tenantId === tenantId)
      if (!account) {
        return null
      }

      return {
        user,
        account,
        tenant: account.tenant // 假设账户包含租户信息
      }
    } catch (error) {
      console.error('Failed to get user with tenant info:', error)
      return null
    }
  }
}
