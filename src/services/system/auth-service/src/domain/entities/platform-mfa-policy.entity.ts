import {
  DEFAULT_MANAGED_MFA_FACTORS,
  DEFAULT_MANAGED_MFA_SCENARIO_REQUIREMENTS,
  ManagedMfaFactor,
  ManagedMfaFactorPolicySnapshot,
  ManagedMfaScenario,
  ManagedMfaScenarioRequirementSnapshot
} from './mfa-policy.shared'

export type PlatformMfaScenario = ManagedMfaScenario
export type PlatformMfaFactor = ManagedMfaFactor
export type PlatformMfaScenarioRequirementSnapshot = ManagedMfaScenarioRequirementSnapshot
export type PlatformMfaFactorPolicySnapshot = ManagedMfaFactorPolicySnapshot

// Represents the platform-owned MFA policy surface used by SYSTEM accounts.
export class PlatformMfaPolicyEntity {
  constructor(
    private readonly scenarioRequirements: PlatformMfaScenarioRequirementSnapshot,
    private readonly factors: PlatformMfaFactorPolicySnapshot[]
  ) {}

  static defaults(): PlatformMfaPolicyEntity {
    return new PlatformMfaPolicyEntity(
      { ...DEFAULT_MANAGED_MFA_SCENARIO_REQUIREMENTS },
      DEFAULT_MANAGED_MFA_FACTORS.map((factor, index) => ({
        factor,
        enabled: true,
        priority: index + 1
      }))
    )
  }

  isLoginRequired(): boolean {
    return this.isScenarioRequired('LOGIN')
  }

  setLoginRequired(required: boolean): void {
    this.setScenarioRequired('LOGIN', required)
  }

  isScenarioRequired(scenario: PlatformMfaScenario): boolean {
    return Boolean(this.scenarioRequirements[scenario])
  }

  setScenarioRequired(scenario: PlatformMfaScenario, required: boolean): void {
    this.scenarioRequirements[scenario] = required
  }

  getScenarioRequirements(): PlatformMfaScenarioRequirementSnapshot {
    return { ...this.scenarioRequirements }
  }

  replaceFactors(factors: PlatformMfaFactorPolicySnapshot[]): void {
    const ordered = [...factors].sort((left, right) => left.priority - right.priority)
    const factorKeys = ordered.map((item) => item.factor)
    if (
      ordered.length !== DEFAULT_MANAGED_MFA_FACTORS.length ||
      DEFAULT_MANAGED_MFA_FACTORS.some((factor) => !factorKeys.includes(factor))
    ) {
      throw new Error('Platform MFA factor policy must cover all managed factors exactly once')
    }

    this.factors.splice(0, this.factors.length, ...ordered)
  }

  getFactors(): PlatformMfaFactorPolicySnapshot[] {
    return [...this.factors].sort((left, right) => left.priority - right.priority)
  }
}
