// ---- Permission Check contracts ----

export interface PermissionCheckInput {
  accountId: string
  permissionCode: string
  tenantId?: string
}

export interface AuthorizationDecisionOutput {
  allowed: boolean
  evaluationMode: 'RBAC' | 'RBAC_ABAC'
  reason?: string
  matchedPolicy?: string
}

export interface PermissionCheckWithContextInput {
  accountId: string
  permissionCode: string
  tenantId?: string
  subjectAttributes: Record<string, string>
  resourceAttributes: Record<string, string>
  environmentAttributes: Record<string, string>
  actionAttributes: Record<string, string>
}

export type PermissionCheckOutput = AuthorizationDecisionOutput
export type AuthzDecisionOutput = AuthorizationDecisionOutput
