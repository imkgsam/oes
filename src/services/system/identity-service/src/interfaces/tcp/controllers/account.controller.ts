import { Injectable } from "@nestjs/common";
import { MessagePattern } from "@nestjs/microservices";
import { AccountDto } from "@oes/common/dtos/identity-service/api/rpc/all.dto";
import { IIdentityServiceRpcAccountPort } from "@oes/common/interfaces/services/identity-service.interface";
import { IDENTITY_MESSAGES } from "@oes/common/constants/messages/identity.message";
@Injectable()
export class AccountController implements IIdentityServiceRpcAccountPort {
  
  @MessagePattern(IDENTITY_MESSAGES.GET_ACCOUNTS_BY_USER_ID)
  getAccountsByUserId(userId: string): Promise<AccountDto[]> {
    throw new Error("Method not implemented.");
  }
}