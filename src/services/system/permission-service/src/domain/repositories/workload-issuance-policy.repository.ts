import {
  AuthorizationScopeLevel,
  WorkloadIssuancePolicyFacts
} from '../authorization/permission-decision.types'

/** Resolves one immutable deployment-owned workload-to-audience INTERNAL policy tuple. */
export interface WorkloadIssuancePolicyRepository {
  findPolicy(input: {
    originalWorkloadSpiffeId: string
    targetAudience: string
    scopeLevel: AuthorizationScopeLevel
    tenantId?: string
  }): Promise<WorkloadIssuancePolicyFacts | null>
}
