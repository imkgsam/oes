export interface AccountAuthorizationSummary {
  accountId: string
  roleIds: string[]
  roleCodes: string[]
  permissionCodes: string[]
}

export interface AccountTerminalAccessDecision {
  allowed: boolean
  reasonCode: string
  effectiveAllowedTerminals: string[]
  resolutionSource: string
  matchedRoleIds: string[]
}

/**
 * Application port for permission lookups required by auth-service.
 *
 * Rules:
 * - Define only auth-service's required capabilities.
 * - Do not expose transport details or generated client types.
 * - Keep return models local to auth-service's application layer.
 */
export interface IPermissionServicePort {
  getAccountAuthorizationSummary(params: {
    accountId: string
    tenantId?: string | null
    scopeLevel: 'SYSTEM' | 'TENANT'
  }): Promise<AccountAuthorizationSummary>
  resolveAccountTerminalAccess(params: {
    accountId: string
    tenantId?: string | null
    scopeLevel: 'SYSTEM' | 'TENANT'
    terminal: string
  }): Promise<AccountTerminalAccessDecision>
  checkAccountPermission(accountId: string, permissionCode: string): Promise<boolean>
}
