export const IDENTITY_ACCOUNT_ONBOARDING_PORT = Symbol('TENANT_ONBOARDING_IDENTITY_ACCOUNT_PORT')

/** IdentityAccountOnboardingPort exposes identity-service account creation for tenant onboarding. */
export interface IdentityAccountOnboardingPort {
  createTenantUserAccount(input: {
    tenantId: string
    displayName: string
    email?: string
    existingUserId?: string
    phone?: string
    provisioningMode?: 'CREATE_NEW_USER' | 'EXISTING_USER'
    idempotencyKey: string
  }): Promise<{
    userId: string
    accountId: string
    userPartyId?: string
    userTenantPartyId?: string
  }>
}
