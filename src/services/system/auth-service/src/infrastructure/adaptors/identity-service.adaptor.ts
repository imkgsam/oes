import { Injectable, Logger } from '@nestjs/common'
import {
  UserInfo,
  AccountInfo,
  TenantInfo,
  UserAccountRelation,
  AccountTenantRelation,
  AccountDto,
  UserDto
} from '@oes/common/dtos/identity-service/api/rpc/all.dto'
import { InjectServiceClient } from '@oes/common/modules/clients/client.decorator'
import { ServiceKeys } from '@oes/common/modules/clients/service-map'
import { IDENTITY_MESSAGES } from '@oes/common/constants/messages/identity.message'
import { safeRpcCall } from '@oes/common/helpers/rpc.helper'
import { IIdentityServicePort } from '../../application/ports/identity-service.port'
import { ClientProxy } from '@nestjs/microservices'

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
    private readonly identityServiceClient: ClientProxy
  ) {}

  async getUserById(userId: string): Promise<UserDto | null> {
    try {
      this.logger.debug(`Getting user by ID: ${userId}`)
      const response = await safeRpcCall<UserInfo>(
        this.identityServiceClient.send(IDENTITY_MESSAGES.GET_USER_BY_ID, { userId })
      )
      return response
    } catch (error) {
      this.logger.error(`Failed to get user by ID: ${userId}`, error)
      throw error
    }
  }
  getUserByEmail(email: string): Promise<UserDto | null> {
    throw new Error('Method not implemented.')
  }
  getUserByPhone(phone: string): Promise<UserDto | null> {
    throw new Error('Method not implemented.')
  }
  getAccountsByUserId(userId: string): Promise<AccountDto[]> {
    throw new Error('Method not implemented.')
  }
}
