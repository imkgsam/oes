export const PERMISSION_ONBOARDING_GRANT_PORT = Symbol('PERMISSION_ONBOARDING_GRANT_PORT')

export interface PermissionOnboardingGrantPort {
  grantInitialAccessForEmployeeAccount(input: {
    tenantId: string
    accountId: string
    roleIds: string[]
    idempotencyKey: string
    reason?: string
    operatorContext?: {
      operatorId: string
      operatorType: string
      tenantId?: string
      orgId?: string
      operatorRoles?: string[]
    }
    requestId?: string
    traceId?: string
  }): Promise<{ grantId?: string }>
}
