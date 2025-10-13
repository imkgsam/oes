// File: src/services/system/identity-service/src/interfaces/tcp/controllers/account.controller.ts
import { Injectable } from '@nestjs/common'
import { MessagePattern } from '@nestjs/microservices'
import {
  AccountDto,
  AccountIdRequestDto,
  UserIdRequestDto
} from '@oes/common/dtos/identity-service/all.dto'
import { IIdentityServiceRpcAccountContract } from '@oes/common/interfaces/services/identity-service'
import { IDENTITY_MESSAGES } from '@oes/common/constants/messages/identity.message'
import { RpcRequestData } from '@oes/common/decorators/rpc-request-data.decorator'
@Injectable()
export class AccountController implements IIdentityServiceRpcAccountContract {
  constructor() {}

  @MessagePattern(IDENTITY_MESSAGES.GET_ACCOUNT_BY_ID)
  getAccountById(@RpcRequestData() data: AccountIdRequestDto): Promise<AccountDto | null> {
    throw new Error('Method not implemented.')
  }

  @MessagePattern(IDENTITY_MESSAGES.GET_ACCOUNTS_BY_USER_ID)
  getAccountsByUserId(@RpcRequestData() data: UserIdRequestDto): Promise<AccountDto[]> {
    throw new Error('Method not implemented.')
  }
}
