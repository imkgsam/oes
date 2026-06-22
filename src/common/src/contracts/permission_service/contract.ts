// ---- Permission Check contracts ----

export interface PermissionCheckInput {
  accountId: string
  permissionCode: string
  tenantId?: string
}

export interface PolicyExplainEntryOutput {
  policyId: string
  policyName: string
  effect: 'ALLOW' | 'DENY'
  priority: number
  applicable: boolean
  matched: boolean
  reasonCode: string
  conditionExplainTree?: PolicyConditionExplainNodeOutput
}

export interface PolicyConditionExplainNodeOutput {
  nodeType: 'ALL' | 'ANY' | 'NOT' | 'COMPARISON'
  path: string
  matched: boolean
  reasonCode: string
  source?: string
  key?: string
  operator?: string
  actualValueJson?: string
  expectedValueJson?: string
  children?: PolicyConditionExplainNodeOutput[]
}

export interface AuthorizationDecisionOutput {
  allowed: boolean
  evaluationMode: 'RBAC' | 'RBAC_ABAC'
  reason?: string
  matchedPolicy?: string
  explainCode?: string
  matchedPolicyId?: string
  policyExplainEntries?: PolicyExplainEntryOutput[]
}

export type PermissionCheckOutput = AuthorizationDecisionOutput
export type AuthzDecisionOutput = AuthorizationDecisionOutput
