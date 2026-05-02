export const IDENTITY_ACCOUNT_ONBOARDING_PORT = Symbol('TENANT_ONBOARDING_IDENTITY_ACCOUNT_PORT')

/** IdentityAccountOnboardingPort exposes identity-service account creation for tenant onboarding. */
export interface IdentityAccountOnboardingPort {
  createTenantUserAccount(input: {
    tenantId: string
    displayName: string
    email?: string
    phone?: string
    idempotencyKey: string
  }): Promise<{
    userId: string
    accountId: string
    userPartyId?: string
    userTenantPartyId?: string
  }>
}
