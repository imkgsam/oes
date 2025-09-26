import { UserDto, AccountDto } from '../../../dtos/identity-service/all.dto'

/**
 * RPC 接口 入口
 */
export interface IIdentityServiceRpcContract
  extends IIdentityServiceRpcTestContract,
    IIdentityServiceRpcAccountContract,
    IIdentityServiceRpcUserContract {}

export interface IIdentityServiceRpcTestContract {
  testing(): Promise<void>
}

export interface IIdentityServiceRpcAccountContract {
  getAccountsByUserId(userId: string): Promise<AccountDto[]>
  getAccountById(accountId: string): Promise<AccountDto | null>
}

export interface IIdentityServiceRpcUserContract {
  getUserById(userId: string): Promise<UserDto | null>
  getUserByEmail(email: string): Promise<UserDto | null>
  getUserByPhone(phone: string): Promise<UserDto | null>
}
