import {
  DEFAULT_MANAGED_MFA_FACTORS,
  DEFAULT_MANAGED_MFA_SCENARIO_REQUIREMENTS,
  ManagedMfaFactor,
  ManagedMfaFactorPolicySnapshot,
  ManagedMfaScenario,
  ManagedMfaScenarioRequirementSnapshot
} from './mfa-policy.shared'

export type TenantMfaScenario = ManagedMfaScenario
export type TenantMfaFactor = ManagedMfaFactor
export type TenantMfaScenarioRequirementSnapshot = ManagedMfaScenarioRequirementSnapshot
export type TenantMfaFactorPolicySnapshot = ManagedMfaFactorPolicySnapshot

// Represents one tenant-scoped MFA policy surface that keeps scenario requirements separate from global factor ordering.
export class TenantMfaPolicyEntity {
  constructor(
    public readonly tenantId: string,
    private readonly scenarioRequirements: TenantMfaScenarioRequirementSnapshot,
    private readonly factors: TenantMfaFactorPolicySnapshot[]
  ) {}

  static defaults(tenantId: string): TenantMfaPolicyEntity {
    return new TenantMfaPolicyEntity(
      tenantId,
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

  isScenarioRequired(scenario: TenantMfaScenario): boolean {
    return Boolean(this.scenarioRequirements[scenario])
  }

  setScenarioRequired(scenario: TenantMfaScenario, required: boolean): void {
    this.scenarioRequirements[scenario] = required
  }

  getScenarioRequirements(): TenantMfaScenarioRequirementSnapshot {
    return { ...this.scenarioRequirements }
  }

  replaceFactors(factors: TenantMfaFactorPolicySnapshot[]): void {
    const ordered = [...factors].sort((left, right) => left.priority - right.priority)
    const factorKeys = ordered.map((item) => item.factor)
    if (
      ordered.length !== DEFAULT_MANAGED_MFA_FACTORS.length ||
      DEFAULT_MANAGED_MFA_FACTORS.some((factor) => !factorKeys.includes(factor))
    ) {
      throw new Error('Tenant MFA factor policy must cover all managed factors exactly once')
    }

    this.factors.splice(0, this.factors.length, ...ordered)
  }

  getFactors(): TenantMfaFactorPolicySnapshot[] {
    return [...this.factors].sort((left, right) => left.priority - right.priority)
  }
}
