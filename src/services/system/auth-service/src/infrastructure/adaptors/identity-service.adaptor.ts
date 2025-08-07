import { Injectable, Logger } from '@nestjs/common'
import {
  IIdentityServicePort,
  UserInfo,
  AccountInfo,
  TenantInfo,
  UserAccountRelation,
  AccountTenantRelation
} from 'src/application/ports/identity-service.port'
import { InjectServiceClient } from '@oes/common/modules/clients/client.decorator'
import { ServiceKeys } from '@oes/common/modules/clients/service-map'
import { IDENTITY_MESSAGES } from '@oes/common/constants/messages/identity.message'
import { safeRpcCall } from '@oes/common/helpers/rpc.helper'

/**
 * Identity Service 适配器实现
 *
 * 通过 RPC 调用 Identity Service 获取用户、账户、租户信息
 */
@Injectable()
export class IdentityServiceAdaptor implements IIdentityServicePort {
  private readonly logger = new Logger(IdentityServiceAdaptor.name)

  constructor(
    @InjectServiceClient(ServiceKeys.IDENTITY_TCP)
    private readonly identityServiceClient: any
  ) {}

  async getUserById(userId: string): Promise<UserInfo> {
    try {
      this.logger.debug(`Getting user by ID: ${userId}`)
      const response = await safeRpcCall<UserInfo>(
        this.identityServiceClient.send(IDENTITY_MESSAGES.GET_USER_BY_ID, {
          userId
        })
      )
      return response
    } catch (error) {
      this.logger.error(`Failed to get user by ID: ${userId}`, error)
      throw error
    }
  }

  async getUserByEmail(email: string): Promise<UserInfo> {
    try {
      this.logger.debug(`Getting user by email: ${email}`)
      const response = await safeRpcCall<UserInfo>(
        this.identityServiceClient.send(IDENTITY_MESSAGES.GET_USER_BY_EMAIL, {
          email
        })
      )
      return response
    } catch (error) {
      this.logger.error(`Failed to get user by email: ${email}`, error)
      throw error
    }
  }

  async getUserByPhone(phone: string): Promise<UserInfo> {
    try {
      this.logger.debug(`Getting user by phone: ${phone}`)
      const response = await safeRpcCall<UserInfo>(
        this.identityServiceClient.send(IDENTITY_MESSAGES.GET_USER_BY_PHONE, {
          phone
        })
      )
      return response
    } catch (error) {
      this.logger.error(`Failed to get user by phone: ${phone}`, error)
      throw error
    }
  }

  async getAccountById(accountId: string): Promise<AccountInfo> {
    try {
      this.logger.debug(`Getting account by ID: ${accountId}`)
      const response = await safeRpcCall<AccountInfo>(
        this.identityServiceClient.send(IDENTITY_MESSAGES.GET_ACCOUNT_BY_ID, {
          accountId
        })
      )
      return response
    } catch (error) {
      this.logger.error(`Failed to get account by ID: ${accountId}`, error)
      throw error
    }
  }

  async getTenantById(tenantId: string): Promise<TenantInfo> {
    try {
      this.logger.debug(`Getting tenant by ID: ${tenantId}`)
      const response = await safeRpcCall<TenantInfo>(
        this.identityServiceClient.send(IDENTITY_MESSAGES.GET_TENANT_BY_ID, {
          tenantId
        })
      )
      return response
    } catch (error) {
      this.logger.error(`Failed to get tenant by ID: ${tenantId}`, error)
      throw error
    }
  }

  async getUserAccountRelations(
    userId: string
  ): Promise<UserAccountRelation[]> {
    try {
      this.logger.debug(`Getting user account relations for user: ${userId}`)
      const response = await safeRpcCall<UserAccountRelation[]>(
        this.identityServiceClient.send(
          IDENTITY_MESSAGES.GET_USER_ACCOUNT_RELATIONS,
          { userId }
        )
      )
      return response
    } catch (error) {
      this.logger.error(
        `Failed to get user account relations for user: ${userId}`,
        error
      )
      throw error
    }
  }

  async getAccountTenantRelations(
    accountId: string
  ): Promise<AccountTenantRelation[]> {
    try {
      this.logger.debug(
        `Getting account tenant relations for account: ${accountId}`
      )
      const response = await safeRpcCall<AccountTenantRelation[]>(
        this.identityServiceClient.send(
          IDENTITY_MESSAGES.GET_ACCOUNT_TENANT_RELATIONS,
          {
            accountId
          }
        )
      )
      return response
    } catch (error) {
      this.logger.error(
        `Failed to get account tenant relations for account: ${accountId}`,
        error
      )
      throw error
    }
  }

  async validateUser(userId: string): Promise<boolean> {
    try {
      this.logger.debug(`Validating user: ${userId}`)
      const response = await safeRpcCall<boolean>(
        this.identityServiceClient.send(IDENTITY_MESSAGES.VALIDATE_USER, {
          userId
        })
      )
      return response
    } catch (error) {
      this.logger.error(`Failed to validate user: ${userId}`, error)
      return false
    }
  }

  async validateAccount(accountId: string): Promise<boolean> {
    try {
      this.logger.debug(`Validating account: ${accountId}`)
      const response = await safeRpcCall<boolean>(
        this.identityServiceClient.send(IDENTITY_MESSAGES.VALIDATE_ACCOUNT, {
          accountId
        })
      )
      return response
    } catch (error) {
      this.logger.error(`Failed to validate account: ${accountId}`, error)
      return false
    }
  }

  async validateTenant(tenantId: string): Promise<boolean> {
    try {
      this.logger.debug(`Validating tenant: ${tenantId}`)
      const response = await safeRpcCall<boolean>(
        this.identityServiceClient.send(IDENTITY_MESSAGES.VALIDATE_TENANT, {
          tenantId
        })
      )
      return response
    } catch (error) {
      this.logger.error(`Failed to validate tenant: ${tenantId}`, error)
      return false
    }
  }

  async getUserDefaultAccount(userId: string): Promise<AccountInfo> {
    try {
      this.logger.debug(`Getting user default account for user: ${userId}`)
      const response = await safeRpcCall<AccountInfo>(
        this.identityServiceClient.send(
          IDENTITY_MESSAGES.GET_USER_DEFAULT_ACCOUNT,
          { userId }
        )
      )
      return response
    } catch (error) {
      this.logger.error(
        `Failed to get user default account for user: ${userId}`,
        error
      )
      throw error
    }
  }

  async getAccountDefaultTenant(accountId: string): Promise<TenantInfo> {
    try {
      this.logger.debug(
        `Getting account default tenant for account: ${accountId}`
      )
      const response = await safeRpcCall<TenantInfo>(
        this.identityServiceClient.send(
          IDENTITY_MESSAGES.GET_ACCOUNT_DEFAULT_TENANT,
          {
            accountId
          }
        )
      )
      return response
    } catch (error) {
      this.logger.error(
        `Failed to get account default tenant for account: ${accountId}`,
        error
      )
      throw error
    }
  }
}
