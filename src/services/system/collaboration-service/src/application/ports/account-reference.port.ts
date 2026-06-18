/** AccountReferencePort validates account targets without moving identity truth into collaboration-service. */
export interface AccountReferencePort {
  isActiveTenantAccount(input: { tenantId: string; accountId: string }): Promise<boolean>
}

export const ACCOUNT_REFERENCE_PORT = Symbol('ACCOUNT_REFERENCE_PORT')
