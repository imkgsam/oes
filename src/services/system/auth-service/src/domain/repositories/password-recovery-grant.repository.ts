import { PasswordRecoveryGrant } from '../entities/password-recovery-grant.entity'

export interface PasswordRecoveryGrantRepository {
  findById(id: string): Promise<PasswordRecoveryGrant | null>
  save(grant: PasswordRecoveryGrant): Promise<PasswordRecoveryGrant>
}
