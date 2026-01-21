// File: src/services/system/auth-service/src/application/ports/identity-service.port.ts
import { UserPort, AccountPort } from '@oes/common/contracts/identity-service/index'

type UserPortSelections = 'getUserById' | 'getUserByEmail' | 'getUserByPhone'

type AccountPortSelections = 'getAccountsByUserId' | 'getAccountById'

/**
 * Identity Service 端口接口
 */
export interface IIdentityServicePort
  extends Pick<UserPort, UserPortSelections>, Pick<AccountPort, AccountPortSelections> {}
