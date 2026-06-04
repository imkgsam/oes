import { MfaType } from '../../common/constants'
import { DEFAULT_MANAGED_MFA_FACTORS, ManagedMfaFactor } from './mfa-policy.shared'

export type MfaBindingType = ManagedMfaFactor

export type TerminalMfaPolicyInput = {
  loginMfaRequired: boolean
  newDeviceMfaRequired: boolean
  allowedFactors: readonly MfaBindingType[]
  factorPriority: readonly MfaBindingType[]
}

export type TerminalMfaPolicySnapshot = TerminalMfaPolicyInput & {
  tenantId?: string
  terminal: string
}

const DEFAULT_ALLOWED_FACTORS: readonly ManagedMfaFactor[] = DEFAULT_MANAGED_MFA_FACTORS

// Represents one platform-default or tenant-owned terminal MFA policy without treating platform defaults as tenant baselines.
export class TerminalMfaPolicyEntity {
  public readonly tenantId?: string
  public readonly terminal: string
  private loginMfaRequired: boolean
  private newDeviceMfaRequired: boolean
  private allowedFactors: MfaBindingType[]
  private factorPriority: MfaBindingType[]

  constructor(snapshot: TerminalMfaPolicySnapshot) {
    this.tenantId = snapshot.tenantId
    this.terminal = snapshot.terminal
    this.loginMfaRequired = snapshot.loginMfaRequired
    this.newDeviceMfaRequired = snapshot.newDeviceMfaRequired
    this.allowedFactors = [...snapshot.allowedFactors]
    this.factorPriority = [...snapshot.factorPriority]
    this.ensureValidFactors(this.allowedFactors, this.factorPriority)
  }

  static platformDefaults(): TerminalMfaPolicyEntity[] {
    return ['WEB', 'PDA', 'KIOSK', 'BROWSER_EXTENSION'].map(
      (terminal) =>
        new TerminalMfaPolicyEntity({
          terminal,
          loginMfaRequired: false,
          newDeviceMfaRequired: false,
          allowedFactors: DEFAULT_ALLOWED_FACTORS,
          factorPriority: DEFAULT_ALLOWED_FACTORS
        })
    )
  }

  static tenantOverride(
    tenantId: string,
    terminal: string,
    input: TerminalMfaPolicyInput
  ): TerminalMfaPolicyEntity {
    return new TerminalMfaPolicyEntity({
      tenantId,
      terminal,
      ...input
    })
  }

  requiresLoginMfa(): boolean {
    return this.loginMfaRequired
  }

  requiresNewDeviceMfa(): boolean {
    return this.newDeviceMfaRequired
  }

  replaceFactors(factors: readonly MfaBindingType[], priority: readonly MfaBindingType[]): void {
    this.ensureValidFactors(factors, priority)
    this.allowedFactors.splice(0, this.allowedFactors.length, ...Array.from(new Set(factors)))
    this.factorPriority.splice(0, this.factorPriority.length, ...Array.from(new Set(priority)))
  }

  getAllowedFactors(): MfaBindingType[] {
    return [...this.allowedFactors]
  }

  getFactorPriority(): MfaBindingType[] {
    return [...this.factorPriority]
  }

  toSnapshot(): TerminalMfaPolicySnapshot {
    return {
      tenantId: this.tenantId,
      terminal: this.terminal,
      loginMfaRequired: this.loginMfaRequired,
      newDeviceMfaRequired: this.newDeviceMfaRequired,
      allowedFactors: this.getAllowedFactors(),
      factorPriority: this.getFactorPriority()
    }
  }

  private ensureValidFactors(
    factors: readonly MfaType[],
    priority: readonly MfaType[]
  ): asserts factors is readonly ManagedMfaFactor[] {
    const uniqueFactors = Array.from(new Set(factors))
    const uniquePriority = Array.from(new Set(priority))
    if (uniqueFactors.some((factor) => !factor)) {
      throw new Error('Terminal MFA policy cannot allow empty factors')
    }

    if (uniqueFactors.length !== factors.length || uniquePriority.length !== priority.length) {
      throw new Error('Terminal MFA policy factors must be unique')
    }

    if (
      uniqueFactors.length !== uniquePriority.length ||
      uniquePriority.some((factor) => !uniqueFactors.includes(factor))
    ) {
      throw new Error('Terminal MFA policy factor priority must match allowed factors')
    }

    const allowedManagedFactors: readonly MfaType[] = DEFAULT_MANAGED_MFA_FACTORS
    if (
      uniqueFactors.some((factor) => !allowedManagedFactors.includes(factor)) ||
      uniquePriority.some((factor) => !allowedManagedFactors.includes(factor))
    ) {
      throw new Error('Terminal MFA policy can only use managed factors')
    }
  }
}
