export type TerminalPinResetReason = 'ADMIN_RESET' | 'SECURITY_POLICY'

// Represents an explicit terminal PIN reset gate for one user-scoped login credential.
export class TerminalPinResetRequirementEntity {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly reason: TerminalPinResetReason,
    public readonly requiredBy: string | null,
    public readonly requiredAt: Date,
    public readonly completedAt: Date | null
  ) {}

  isActive(): boolean {
    return !this.completedAt
  }
}
