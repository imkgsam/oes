export const IDENTITY_ACCOUNT_REFERENCE_PORT = Symbol('IDENTITY_ACCOUNT_REFERENCE_PORT')

export interface IdentityAccountReferencePort {
  getAccountById(accountId: string): Promise<{
    accountId: string
    tenantId: string | null
    scopeLevel: 'SYSTEM' | 'TENANT'
    isActive: boolean
  } | null>
  getServiceAccountById(serviceAccountId: string): Promise<{
    principalId: string
    tenantId: string | null
    scopeLevel: 'SYSTEM' | 'TENANT'
    isActive: boolean
  } | null>
}
