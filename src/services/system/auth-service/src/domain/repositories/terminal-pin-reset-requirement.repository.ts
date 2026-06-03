import {
  TerminalPinResetReason,
  TerminalPinResetRequirementEntity
} from '../entities/terminal-pin-reset-requirement.entity'

export interface TerminalPinResetRequirementRepository {
  findActiveByUserId(userId: string): Promise<TerminalPinResetRequirementEntity | null>
  requireReset(input: {
    userId: string
    reason: TerminalPinResetReason
    requiredBy?: string | null
  }): Promise<TerminalPinResetRequirementEntity>
  complete(userId: string): Promise<void>
}
