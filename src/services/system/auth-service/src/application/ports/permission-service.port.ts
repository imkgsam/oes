export interface AccountAuthorizationSummary {
  accountId: string
  roleIds: string[]
  roleCodes: string[]
  permissionCodes: string[]
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
  checkAccountPermission(accountId: string, permissionCode: string): Promise<boolean>
}
