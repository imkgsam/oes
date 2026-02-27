// ---- Permission Check contracts ----

export interface PermissionCheckInput {
  accountId: string
  permissionCode: string
}

export interface PermissionCheckOutput {
  pass: boolean
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

export interface AuthzDecisionOutput {
  allowed: boolean
  matchedPolicy?: string
  reason?: string
}
