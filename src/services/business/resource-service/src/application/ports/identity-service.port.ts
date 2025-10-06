import { IIdentityServiceContract } from '@oes/common/interfaces/services/identity-service'

type IdentityMethodsSelections =
  | 'getUserById'
  | 'getUserByEmail'
  | 'getUserByPhone'
  | 'getAccountsByUserId'
  | 'getAccountById'

/**
 * Identity Service 端口接口
 *
 * 职责：
 * 1. 定义与身份服务的RPC通信接口
 * 2. 提供用户和租户信息查询能力
 * 3. 支持权限验证和身份确认
 * 4. 封装身份服务的依赖
 */
export interface IIdentityServicePort
  extends Pick<IIdentityServiceContract, IdentityMethodsSelections> {}
