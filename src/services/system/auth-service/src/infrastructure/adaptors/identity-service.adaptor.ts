// File: src/services/system/auth-service/src/infrastructure/adaptors/identity-service.adaptor.ts
import { Injectable, Logger } from '@nestjs/common'
import {
  UserDto,
  AccountDto,
  AccountIdRequestDto,
  UserIdRequestDto
} from '@oes/common/dtos'
import { InjectServiceClient, ServiceKeys } from '@oes/common/clients'
import { IDENTITY_MESSAGES } from '@oes/common/constants'
import { safeRpcCall, safeRpcCall2 } from '@oes/common/helpers'
import { IIdentityServicePort } from '../../application/ports/identity-service.port'
import { ClientProxy } from '@nestjs/microservices'

/**
 * Identity Service 閫傞厤鍣ㄥ疄鐜? *
 * 閫氳繃 RPC 璋冪敤 Identity Service 鑾峰彇鐢ㄦ埛銆佽处鎴枫€佺鎴蜂俊鎭? */
@Injectable()
export class IdentityServiceAdaptor implements IIdentityServicePort {
  private readonly logger = new Logger(IdentityServiceAdaptor.name)

  constructor(
    @InjectServiceClient(ServiceKeys.IDENTITY_TCP)
    private readonly identityServiceClient: ClientProxy
  ) {}
  getUserById(data: UserIdRequestDto): Promise<UserDto | null> {
    throw new Error('Method not implemented.')
  }
  getUserByEmail(email: string): Promise<UserDto | null> {
    throw new Error('Method not implemented.')
  }
  getUserByPhone(phone: string): Promise<UserDto | null> {
    throw new Error('Method not implemented.')
  }
  getAccountsByUserId(data: UserIdRequestDto): Promise<AccountDto[]> {
    throw new Error('Method not implemented.')
  }
  getAccountById(data: AccountIdRequestDto): Promise<AccountDto | null> {
    throw new Error('Method not implemented.')
  }

  // async getAccountById(accountId: string): Promise<AccountDto | null> {
  //   this.logger.debug(
  //     `requesting identity-service RPC: ==${IDENTITY_MESSAGES.GET_ACCOUNT_BY_ID}== \nID: ${accountId}`
  //   )
  //   const response = await safeRpcCall2<{ accountId: string }, AccountDto>(
  //     this.identityServiceClient,
  //     IDENTITY_MESSAGES.GET_ACCOUNT_BY_ID,
  //     { accountId },
  //     { traceId: '' }
  //   )
  // }

  // async getUserById(userId: string): Promise<UserDto | null> {
  //   try {
  //     this.logger.debug(`Getting user by ID: ${userId}`)
  //     const response = await safeRpcCall<UserDto>(
  //       this.identityServiceClient.send(IDENTITY_MESSAGES.GET_USER_BY_ID, { userId })
  //     )
  //     return response
  //   } catch (error) {
  //     this.logger.error(`Failed to get user by ID: ${userId}`, error)
  //     throw error
  //   }
  // }
  // getUserByEmail(email: string): Promise<UserDto | null> {
  //   throw new Error('Method not implemented.')
  // }
  // getUserByPhone(phone: string): Promise<UserDto | null> {
  //   throw new Error('Method not implemented.')
  // }
  // getAccountsByUserId(userId: string): Promise<AccountDto[]> {
  //   throw new Error('Method not implemented.')
  // }
}
