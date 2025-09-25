import { UserDto, AccountDto } from '../../dtos/identity-service/api/rpc/all.dto'

/**
 * 等级： 1
 * 汇总服务接口
 */
export interface IIdentityServicePort extends IIdentityServiceRpcPort, IIdentityServiceHttpPort {}

/**
 * 等级： 2
 * RPC 接口
 */
export interface IIdentityServiceRpcPort
  extends IIdentityServiceRpcTestPort,
    IIdentityServiceRpcAccountPort,
    IIdentityServiceRpcUserPort {}

/**
 * 等级： 2
 * HTTP 接口
 */
export interface IIdentityServiceHttpPort {}

/**
 * 等级： 3
 * RPC 测试接口
 */
interface IIdentityServiceRpcTestPort {
  testing(): Promise<void>
}

/**
 * 等级： 3
 * RPC
 * 账户相关接口
 */
export interface IIdentityServiceRpcAccountPort {
  getAccountsByUserId(userId: string): Promise<AccountDto[]>
}

/**
 * 等级： 3
 * RPC
 * 用户相关接口
 */
export interface IIdentityServiceRpcUserPort {
  getUserById(userId: string): Promise<UserDto | null>
  getUserByEmail(email: string): Promise<UserDto | null>
  getUserByPhone(phone: string): Promise<UserDto | null>
}
