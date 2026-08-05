export type AuthorizationPrincipalType = 'HUMAN' | 'MACHINE' | 'DELEGATED'
export type AuthorizationScopeLevel = 'SYSTEM' | 'TENANT'
export type PermissionDecisionKind = 'BUSINESS' | 'INTERNAL'
export type DelegatedRiskClass = 'DELEGATION_ALLOWED' | 'ACTION_GRANT_REQUIRED' | 'AI_FORBIDDEN'

/** Describes catalog metadata needed by decision policies without exposing persistence rows. */
export interface PermissionDecisionCatalogEntry {
  code: string
  kind: PermissionDecisionKind
}

/** Describes one enabled coarse principal policy without embedding Prisma semantics in the domain. */
export interface PrincipalAuthorizationPolicyFact {
  permissionCode: string
  effect: 'ALLOW' | 'DENY'
  subjectType: 'ROLE' | 'ACCOUNT' | 'ANY'
  subjectId?: string
  tenantId?: string
  conditionAstJson?: string
}

/** Carries current PrincipalRoleBinding-derived grant and policy facts. */
export interface PrincipalAuthorizationFacts {
  principalType: 'HUMAN' | 'MACHINE'
  principalId: string
  scopeLevel: AuthorizationScopeLevel
  tenantId?: string
  permissionCodes: string[]
  roleCodes: string[]
  policies: PrincipalAuthorizationPolicyFact[]
  authzVersion: string
  decisionReference: string
}

/** Carries Auth-orchestrated immutable upper bounds from their owning services. */
export interface DelegatedAuthorizationUpperBound {
  humanPrincipalId: string
  sessionReference: string
  securityReference: string
  delegationReference: string
  delegationVersion: string
  delegationActive: boolean
  delegationPermissionCodes: string[]
  agentPrincipalReference: string
  agentPrincipalVersion: string
  agentPrincipalActive: boolean
  agentPermissionCodes: string[]
  toolContractReference: string
  toolContractVersion: string
  toolContractActive: boolean
  toolPermissionCodes: string[]
}

/** Carries the business owner's canonical action and tightening-only policy result. */
export interface OwnerAuthorizationSnapshot {
  actionReference: string
  policyReference: string
  policyVersion: string
  current: boolean
  permissionCodes: string[]
  codeRiskBaseline: DelegatedRiskClass
  effectiveRiskClass: DelegatedRiskClass
  resourcePolicyAllowed: boolean
  resourcePolicyReference: string
}

/** Defines the trusted logical input for BUSINESS issuance resolution. */
export interface PrincipalAuthorizationInput {
  principalType: AuthorizationPrincipalType
  principalId: string
  scopeLevel: AuthorizationScopeLevel
  tenantId?: string
  orgId?: string
  targetAudience: string
  requestedPermissionCodes: string[]
  sessionReference?: string
  securityReference?: string
  delegatedUpperBound?: DelegatedAuthorizationUpperBound
}

/** Defines the deployment-owned workload issuance policy returned by an infrastructure adapter. */
export interface WorkloadIssuancePolicyFacts {
  originalWorkloadSpiffeId: string
  targetAudience: string
  permissionCodes: string[]
  scopeLevel: AuthorizationScopeLevel
  tenantIds?: string[]
  policyVersion: string
}

/** Defines the trusted logical input for the mTLS-only workload bootstrap decision. */
export interface WorkloadIssuanceInput {
  originalWorkloadSpiffeId: string
  targetAudience: string
  requestedPermissionCodes: string[]
  scopeLevel: AuthorizationScopeLevel
  tenantId?: string
  orgId?: string
  principalType: AuthorizationPrincipalType
  principalId: string
  issuancePolicyVersion: string
}

/** Defines the trusted logical input for one delegated action upper-bound decision. */
export interface DelegatedAuthorizationInput {
  humanPrincipalId: string
  scopeLevel: AuthorizationScopeLevel
  tenantId?: string
  orgId?: string
  targetAudience: string
  operationKey: string
  requestedPermissionCodes: string[]
  delegatedUpperBound: DelegatedAuthorizationUpperBound
  ownerAuthorization: OwnerAuthorizationSnapshot
}

/** Binds an all-or-nothing issuance result to its exact principal or workload request. */
export interface IssuanceAuthorizationDecision {
  allowed: boolean
  grantedPermissionCodes: string[]
  deniedPermissionCodes: string[]
  authzVersion: string
  policyDecisionReference: string
  reasonCode: string
}

/** Binds one delegated action result to owner risk, resource policy and effective Code intersection. */
export interface DelegatedAuthorizationDecision {
  allowed: boolean
  allowedPermissionCodes: string[]
  deniedPermissionCodes: string[]
  riskClass: DelegatedRiskClass
  policyVersion: string
  resourcePolicyAllowed: boolean
  resourcePolicyReference: string
  authzVersion: string
  policyDecisionReference: string
  reasonCode: string
}
