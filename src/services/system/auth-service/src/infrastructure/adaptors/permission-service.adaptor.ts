import { Injectable, Logger } from '@nestjs/common'
import { Permission, Role } from '@oes/common/dtos'
import { InjectServiceClient, ServiceKeys } from '@oes/common/clients'
import { PERMISSION_MESSAGES } from '@oes/common/constants'
import { safeRpcCall } from '@oes/common/helpers'
import { IPermissionServicePort } from 'src/application/ports/permission-service.port'
import { ClientProxy } from '@nestjs/microservices'

/**
 * Permission Service 閫傞厤鍣ㄥ疄鐜? *
 * 閫氳繃 RPC 璋冪敤 Permission Service 鑾峰彇鐢ㄦ埛鏉冮檺銆佽鑹蹭俊鎭? */
@Injectable()
export class PermissionServiceAdaptor implements IPermissionServicePort {
  private readonly logger = new Logger(PermissionServiceAdaptor.name)

  constructor(
    @InjectServiceClient(ServiceKeys.PERMISSION_TCP)
    private readonly permissionServiceClient: ClientProxy
  ) {}

  async getUserPermissions(userId: string): Promise<Permission[]> {
    try {
      this.logger.debug(`Getting user permissions for user: ${userId}`)
      const response = await safeRpcCall<Permission[]>(
        this.permissionServiceClient.send(PERMISSION_MESSAGES.GET_USER_PERMISSIONS, { userId })
      )
      return response
    } catch (error) {
      this.logger.error(`Failed to get user permissions for user: ${userId}`, error)
      throw error
    }
  }

  async getUserRoles(userId: string): Promise<Role[]> {
    try {
      this.logger.debug(`Getting user roles for user: ${userId}`)
      const response = await safeRpcCall<Role[]>(
        this.permissionServiceClient.send(PERMISSION_MESSAGES.GET_USER_ROLES, { userId })
      )
      return response
    } catch (error) {
      this.logger.error(`Failed to get user roles for user: ${userId}`, error)
      throw error
    }
  }

  async getAccountPermissions(accountId: string): Promise<Permission[]> {
    try {
      this.logger.debug(`Getting account permissions for account: ${accountId}`)
      const response = await safeRpcCall<Permission[]>(
        this.permissionServiceClient.send(PERMISSION_MESSAGES.GET_ACCOUNT_PERMISSIONS, {
          accountId
        })
      )
      return response
    } catch (error) {
      this.logger.error(`Failed to get account permissions for account: ${accountId}`, error)
      throw error
    }
  }

  async getAccountRoles(accountId: string): Promise<Role[]> {
    try {
      this.logger.debug(`Getting account roles for account: ${accountId}`)
      const response = await safeRpcCall<Role[]>(
        this.permissionServiceClient.send(PERMISSION_MESSAGES.GET_ACCOUNT_ROLES, { accountId })
      )
      return response
    } catch (error) {
      this.logger.error(`Failed to get account roles for account: ${accountId}`, error)
      throw error
    }
  }

  async checkUserPermission(userId: string, permissionCode: string): Promise<boolean> {
    try {
      this.logger.debug(`Checking user permission: ${userId} - ${permissionCode}`)
      const response = await safeRpcCall<boolean>(
        this.permissionServiceClient.send(PERMISSION_MESSAGES.CHECK_USER_PERMISSION, {
          userId,
          permissionCode
        })
      )
      return response
    } catch (error) {
      this.logger.error(`Failed to check user permission: ${userId} - ${permissionCode}`, error)
      return false
    }
  }

  async checkUserRole(userId: string, roleCode: string): Promise<boolean> {
    try {
      this.logger.debug(`Checking user role: ${userId} - ${roleCode}`)
      const response = await safeRpcCall<boolean>(
        this.permissionServiceClient.send(PERMISSION_MESSAGES.CHECK_USER_ROLE, {
          userId,
          roleCode
        })
      )
      return response
    } catch (error) {
      this.logger.error(`Failed to check user role: ${userId} - ${roleCode}`, error)
      return false
    }
  }

  async checkAccountPermission(accountId: string, permissionCode: string): Promise<boolean> {
    try {
      this.logger.debug(`Checking account permission: ${accountId} - ${permissionCode}`)
      const response = await safeRpcCall<boolean>(
        this.permissionServiceClient.send(PERMISSION_MESSAGES.CHECK_ACCOUNT_PERMISSION, {
          accountId,
          permissionCode
        })
      )
      return response
    } catch (error) {
      this.logger.error(
        `Failed to check account permission: ${accountId} - ${permissionCode}`,
        error
      )
      return false
    }
  }

  async checkAccountRole(accountId: string, roleCode: string): Promise<boolean> {
    try {
      this.logger.debug(`Checking account role: ${accountId} - ${roleCode}`)
      const response = await safeRpcCall<boolean>(
        this.permissionServiceClient.send(PERMISSION_MESSAGES.CHECK_ACCOUNT_ROLE, {
          accountId,
          roleCode
        })
      )
      return response
    } catch (error) {
      this.logger.error(`Failed to check account role: ${accountId} - ${roleCode}`, error)
      return false
    }
  }

  async getUserAllPermissions(userId: string): Promise<Permission[]> {
    try {
      this.logger.debug(`Getting user all permissions for user: ${userId}`)
      const response = await safeRpcCall<Permission[]>(
        this.permissionServiceClient.send(PERMISSION_MESSAGES.GET_USER_ALL_PERMISSIONS, { userId })
      )
      return response
    } catch (error) {
      this.logger.error(`Failed to get user all permissions for user: ${userId}`, error)
      throw error
    }
  }

  async getAccountAllPermissions(accountId: string): Promise<Permission[]> {
    try {
      this.logger.debug(`Getting account all permissions for account: ${accountId}`)
      const response = await safeRpcCall<Permission[]>(
        this.permissionServiceClient.send(PERMISSION_MESSAGES.GET_ACCOUNT_ALL_PERMISSIONS, {
          accountId
        })
      )
      return response
    } catch (error) {
      this.logger.error(`Failed to get account all permissions for account: ${accountId}`, error)
      throw error
    }
  }

  async validatePermission(permissionCode: string): Promise<boolean> {
    try {
      this.logger.debug(`Validating permission: ${permissionCode}`)
      const response = await safeRpcCall<boolean>(
        this.permissionServiceClient.send(PERMISSION_MESSAGES.VALIDATE_PERMISSION, {
          permissionCode
        })
      )
      return response
    } catch (error) {
      this.logger.error(`Failed to validate permission: ${permissionCode}`, error)
      return false
    }
  }

  async validateRole(roleCode: string): Promise<boolean> {
    try {
      this.logger.debug(`Validating role: ${roleCode}`)
      const response = await safeRpcCall<boolean>(
        this.permissionServiceClient.send(PERMISSION_MESSAGES.VALIDATE_ROLE, {
          roleCode
        })
      )
      return response
    } catch (error) {
      this.logger.error(`Failed to validate role: ${roleCode}`, error)
      return false
    }
  }

  async getPermissionByCode(permissionCode: string): Promise<Permission> {
    try {
      this.logger.debug(`Getting permission by code: ${permissionCode}`)
      const response = await safeRpcCall<Permission>(
        this.permissionServiceClient.send(PERMISSION_MESSAGES.GET_PERMISSION_BY_CODE, {
          permissionCode
        })
      )
      return response
    } catch (error) {
      this.logger.error(`Failed to get permission by code: ${permissionCode}`, error)
      throw error
    }
  }

  async getRoleByCode(roleCode: string): Promise<Role> {
    try {
      this.logger.debug(`Getting role by code: ${roleCode}`)
      const response = await safeRpcCall<Role>(
        this.permissionServiceClient.send(PERMISSION_MESSAGES.GET_ROLE_BY_CODE, { roleCode })
      )
      return response
    } catch (error) {
      this.logger.error(`Failed to get role by code: ${roleCode}`, error)
      throw error
    }
  }
}
