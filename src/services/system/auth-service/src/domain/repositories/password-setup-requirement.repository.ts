import {
  PasswordSetupReason,
  PasswordSetupRequirementEntity
} from '../entities/password-setup-requirement.entity'

export interface PasswordSetupRequirementRepository {
  findActiveByUserId(userId: string): Promise<PasswordSetupRequirementEntity | null>
  requireSetup(input: {
    userId: string
    reason: PasswordSetupReason
    requiredBy?: string | null
  }): Promise<PasswordSetupRequirementEntity>
  complete(userId: string): Promise<void>
}
