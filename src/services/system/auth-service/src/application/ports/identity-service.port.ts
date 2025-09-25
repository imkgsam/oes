import { IIdentityServicePort as IBaseIdentityServicePort } from '@oes/common/interfaces/services/identity-service.interface'

type IdentityMethodsSelections =
  | 'getUserById'
  | 'getUserByEmail'
  | 'getUserByPhone'
  | 'getAccountsByUserId'

/**
 * Identity Service 端口接口
 */
export interface IIdentityServicePort
  extends Pick<IBaseIdentityServicePort, IdentityMethodsSelections> {}
