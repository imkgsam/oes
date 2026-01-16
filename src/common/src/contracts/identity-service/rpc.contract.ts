// File: src/common/interfaces/services/identity-service/rpc.contract.ts
import {
  UserDto,
  AccountDto,
  UserIdRequestDto,
  AccountIdRequestDto
} from '../../dtos/identity-service/all.dto'

//RPC 接口 入口
export interface IIdentityServiceRpcContract
  extends
    IIdentityServiceRpcTestContract,
    IIdentityServiceRpcAccountContract,
    IIdentityServiceRpcUserContract {}

export interface IIdentityServiceRpcTestContract {
  testing(): Promise<void>
}

export interface IIdentityServiceRpcAccountContract {
  getAccountsByUserId(data: UserIdRequestDto): Promise<AccountDto[]>
  getAccountById(data: AccountIdRequestDto): Promise<AccountDto | null>
}

export interface IIdentityServiceRpcUserContract {
  getUserById(data: UserIdRequestDto): Promise<UserDto | null>
  getUserByEmail(email: string): Promise<UserDto | null>
  getUserByPhone(phone: string): Promise<UserDto | null>
}
