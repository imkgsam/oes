import { MfaType } from '../../common/constants'

export type TenantMfaScenario = 'LOGIN'
export type TenantMfaFactor = MfaType.EMAIL_OTP | MfaType.SMS_OTP | MfaType.TOTP | MfaType.BACKUP_CODE

export interface TenantMfaFactorPolicySnapshot {
  enabled: boolean
  factor: TenantMfaFactor
  priority: number
  updatedAt?: Date
  updatedBy?: null | string
}

const DEFAULT_FACTORS: TenantMfaFactor[] = [
  MfaType.EMAIL_OTP,
  MfaType.SMS_OTP,
  MfaType.TOTP,
  MfaType.BACKUP_CODE
]

// Represents one tenant-scoped MFA policy surface used by login-scene orchestration.
export class TenantMfaPolicyEntity {
  constructor(
    public readonly tenantId: string,
    private loginRequired: boolean,
    private readonly factors: TenantMfaFactorPolicySnapshot[]
  ) {}

  static defaults(tenantId: string): TenantMfaPolicyEntity {
    return new TenantMfaPolicyEntity(
      tenantId,
      false,
      DEFAULT_FACTORS.map((factor, index) => ({
        factor,
        enabled: true,
        priority: index + 1
      }))
    )
  }

  isLoginRequired(): boolean {
    return this.loginRequired
  }

  setLoginRequired(required: boolean): void {
    this.loginRequired = required
  }

  replaceFactors(factors: TenantMfaFactorPolicySnapshot[]): void {
    const ordered = [...factors].sort((left, right) => left.priority - right.priority)
    const factorKeys = ordered.map((item) => item.factor)
    if (
      ordered.length !== DEFAULT_FACTORS.length ||
      DEFAULT_FACTORS.some((factor) => !factorKeys.includes(factor))
    ) {
      throw new Error('Tenant MFA factor policy must cover all managed factors exactly once')
    }

    this.factors.splice(0, this.factors.length, ...ordered)
  }

  getFactors(): TenantMfaFactorPolicySnapshot[] {
    return [...this.factors].sort((left, right) => left.priority - right.priority)
  }
}
