import { IIdentityServicePort as IBaseIdentityServicePort } from '@oes/common/interfaces/services/identity-service.interface'

type IdentityMethodsSelections =
  | 'getUserById'
  | 'getUserByEmail'
  | 'getUserByPhone'
  | 'getAccountById'
  | 'getTenantById'
  | 'getUserAccountRelations'
  | 'getAccountTenantRelations'
  | 'validateUser'
  | 'validateAccount'
  | 'validateTenant'
  | 'getUserDefaultAccount'
  | 'getAccountDefaultTenant'

/**
 * Identity Service 端口接口
 */
export interface IIdentityServicePort
  extends Pick<IBaseIdentityServicePort, IdentityMethodsSelections> {}
