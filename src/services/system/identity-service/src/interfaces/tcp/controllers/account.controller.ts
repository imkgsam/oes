// File: src/services/system/identity-service/src/interfaces/tcp/controllers/account.controller.ts
import { Injectable } from '@nestjs/common'
import { MessagePattern } from '@nestjs/microservices'
import {
  AccountDto,
  AccountIdRequestDto,
  UserIdRequestDto
} from '@oes/common/dtos'
import { IDENTITY_MESSAGES } from '@oes/common/constants'
import { RpcRequestData } from '@oes/common/decorators'
@Injectable()
export class AccountController {
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
