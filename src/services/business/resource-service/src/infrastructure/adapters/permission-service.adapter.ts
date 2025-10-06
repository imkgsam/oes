import { Injectable } from '@nestjs/common'
import { IPermissionServicePort } from '../../application/ports/permission-service.port'
import { IPermissionServiceContract } from '@oes/common/interfaces/services/permission-service'

/**
 * 权限服务适配器
 *
 * 职责：
 * 1. 实现与权限服务的RPC通信
 * 2. 提供权限验证和检查功能
 * 3. 支持资源访问权限控制
 * 4. 封装权限服务的依赖
 *
 * 设计原则：
 * - 单一职责：专注于权限服务通信
 * - 错误处理：优雅处理RPC调用失败
 * - 缓存：减少重复的权限查询
 * - 可测试性：支持Mock实现
 */
@Injectable()
export class PermissionServiceAdapter implements IPermissionServicePort {
  constructor(private readonly permissionServiceClient: IPermissionServiceContract) {}

  async checkUserPermission(
    userId: string,
    permission: string,
    resourceId?: string
  ): Promise<boolean> {
    try {
      return await this.permissionServiceClient.checkUserPermission(userId, permission, resourceId)
    } catch (error) {
      console.error('Failed to check user permission:', error)
      throw new Error(`Permission service error: ${error.message}`)
    }
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    try {
      return await this.permissionServiceClient.getUserPermissions(userId)
    } catch (error) {
      console.error('Failed to get user permissions:', error)
      throw new Error(`Permission service error: ${error.message}`)
    }
  }

  async getUserRoles(userId: string): Promise<string[]> {
    try {
      return await this.permissionServiceClient.getUserRoles(userId)
    } catch (error) {
      console.error('Failed to get user roles:', error)
      throw new Error(`Permission service error: ${error.message}`)
    }
  }

  async validatePermission(
    permission: string,
    userId: string,
    resourceId?: string
  ): Promise<boolean> {
    try {
      return await this.permissionServiceClient.validatePermission(permission, userId, resourceId)
    } catch (error) {
      console.error('Failed to validate permission:', error)
      throw new Error(`Permission service error: ${error.message}`)
    }
  }

  /**
   * 检查用户是否有域名管理权限
   */
  async checkDomainManagementPermission(userId: string, tenantId: string): Promise<boolean> {
    try {
      const permissions = ['domain:create', 'domain:read', 'domain:update', 'domain:delete']

      const results = await Promise.all(
        permissions.map((permission) => this.checkUserPermission(userId, permission, tenantId))
      )

      return results.every((result) => result === true)
    } catch (error) {
      console.error('Failed to check domain management permission:', error)
      return false
    }
  }

  /**
   * 检查用户是否有域名创建权限
   */
  async checkDomainCreatePermission(userId: string, tenantId: string): Promise<boolean> {
    try {
      return await this.checkUserPermission(userId, 'domain:create', tenantId)
    } catch (error) {
      console.error('Failed to check domain create permission:', error)
      return false
    }
  }

  /**
   * 检查用户是否有域名读取权限
   */
  async checkDomainReadPermission(
    userId: string,
    tenantId: string,
    domainId?: string
  ): Promise<boolean> {
    try {
      return await this.checkUserPermission(userId, 'domain:read', domainId || tenantId)
    } catch (error) {
      console.error('Failed to check domain read permission:', error)
      return false
    }
  }

  /**
   * 检查用户是否有域名更新权限
   */
  async checkDomainUpdatePermission(
    userId: string,
    tenantId: string,
    domainId?: string
  ): Promise<boolean> {
    try {
      return await this.checkUserPermission(userId, 'domain:update', domainId || tenantId)
    } catch (error) {
      console.error('Failed to check domain update permission:', error)
      return false
    }
  }

  /**
   * 检查用户是否有域名删除权限
   */
  async checkDomainDeletePermission(
    userId: string,
    tenantId: string,
    domainId?: string
  ): Promise<boolean> {
    try {
      return await this.checkUserPermission(userId, 'domain:delete', domainId || tenantId)
    } catch (error) {
      console.error('Failed to check domain delete permission:', error)
      return false
    }
  }

  /**
   * 检查用户是否有DNS记录管理权限
   */
  async checkDnsRecordManagementPermission(
    userId: string,
    tenantId: string,
    domainId?: string
  ): Promise<boolean> {
    try {
      const permissions = ['dns:create', 'dns:read', 'dns:update', 'dns:delete']

      const results = await Promise.all(
        permissions.map((permission) =>
          this.checkUserPermission(userId, permission, domainId || tenantId)
        )
      )

      return results.every((result) => result === true)
    } catch (error) {
      console.error('Failed to check DNS record management permission:', error)
      return false
    }
  }

  /**
   * 检查用户是否有域名验证权限
   */
  async checkDomainVerificationPermission(
    userId: string,
    tenantId: string,
    domainId?: string
  ): Promise<boolean> {
    try {
      return await this.checkUserPermission(userId, 'domain:verify', domainId || tenantId)
    } catch (error) {
      console.error('Failed to check domain verification permission:', error)
      return false
    }
  }

  /**
   * 获取用户的资源权限列表
   */
  async getUserResourcePermissions(
    userId: string,
    resourceType: string,
    tenantId: string
  ): Promise<string[]> {
    try {
      const allPermissions = await this.getUserPermissions(userId)

      // 过滤出指定资源类型的权限
      const resourcePermissions = allPermissions.filter((permission) =>
        permission.startsWith(`${resourceType}:`)
      )

      return resourcePermissions
    } catch (error) {
      console.error('Failed to get user resource permissions:', error)
      return []
    }
  }

  /**
   * 检查用户是否有管理员权限
   */
  async checkAdminPermission(userId: string, tenantId: string): Promise<boolean> {
    try {
      const roles = await this.getUserRoles(userId)
      return roles.includes('admin') || roles.includes('super_admin')
    } catch (error) {
      console.error('Failed to check admin permission:', error)
      return false
    }
  }

  /**
   * 批量检查用户权限
   */
  async batchCheckPermissions(
    userId: string,
    permissions: Array<{ permission: string; resourceId?: string }>
  ): Promise<Array<{ permission: string; resourceId?: string; allowed: boolean }>> {
    try {
      const results = await Promise.all(
        permissions.map(async ({ permission, resourceId }) => ({
          permission,
          resourceId,
          allowed: await this.checkUserPermission(userId, permission, resourceId)
        }))
      )

      return results
    } catch (error) {
      console.error('Failed to batch check permissions:', error)
      return permissions.map(({ permission, resourceId }) => ({
        permission,
        resourceId,
        allowed: false
      }))
    }
  }
}
