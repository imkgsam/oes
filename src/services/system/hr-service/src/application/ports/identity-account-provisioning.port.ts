export const IDENTITY_ACCOUNT_PROVISIONING_PORT = Symbol('IDENTITY_ACCOUNT_PROVISIONING_PORT')

export interface IdentityAccountProvisioningPort {
  createUserAccount(input: {
    scopeLevel: 'TENANT'
    tenantId: string
    displayName: string
    email?: string
    existingUserId?: string
    phone?: string
    tenantPartyId?: string
    username?: string
    operatorContext?: {
      operatorId: string
      operatorType: string
      tenantId?: string
      orgId?: string
      operatorRoles?: string[]
    }
    requestId?: string
    traceId?: string
  }): Promise<{
    accountId: string
    userId: string
    displayName: string
  }>
}
