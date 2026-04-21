export type PasswordSetupReason = 'FIRST_LOGIN' | 'ADMIN_RESET' | 'SECURITY_POLICY'

// Represents an explicit password setup gate for one authenticated user.
export class PasswordSetupRequirementEntity {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly reason: PasswordSetupReason,
    public readonly requiredBy: string | null,
    public readonly requiredAt: Date,
    public readonly completedAt: Date | null
  ) {}

  isActive(): boolean {
    return !this.completedAt
  }
}
