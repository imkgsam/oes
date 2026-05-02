export const AUTH_LOGIN_ONBOARDING_PORT = Symbol('TENANT_ONBOARDING_AUTH_LOGIN_PORT')

/** AuthLoginOnboardingPort exposes auth-service login bootstrap operations for tenant onboarding. */
export interface AuthLoginOnboardingPort {
  bootstrapUserLoginMethods(input: {
    userId: string
    accountId: string
    displayName: string
    email?: string
    phone?: string
  }): Promise<{ emailBootstrapped: boolean; phoneBootstrapped: boolean; passwordBootstrapped: boolean }>
  requirePasswordSetup(input: {
    userId: string
    reason: string
  }): Promise<void>
}
