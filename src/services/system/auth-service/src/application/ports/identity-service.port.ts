// File: src/services/system/auth-service/src/application/ports/identity-service.port.ts
import { UserPort, AccountPort } from '@oes/common/contracts'

type UserPortSelections = 'getUserById' | 'getUserByEmail' | 'getUserByPhone'

type AccountPortSelections = 'getAccountsByUserId' | 'getAccountById'

/**
 * Identity Service 绔彛鎺ュ彛
 */
export interface IIdentityServicePort
  extends Pick<UserPort, UserPortSelections>, Pick<AccountPort, AccountPortSelections> {}
