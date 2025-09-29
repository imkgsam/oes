// File: src/services/system/auth-service/src/application/ports/identity-service.port.ts
import { IIdentityServiceContract } from '@oes/common/interfaces/services/identity-service'

type IdentityMethodsSelections =
  | 'getUserById'
  | 'getUserByEmail'
  | 'getUserByPhone'
  | 'getAccountsByUserId'
  | 'getAccountById'

/**
 * Identity Service 端口接口
 */
export interface IIdentityServicePort
  extends Pick<IIdentityServiceContract, IdentityMethodsSelections> {}
