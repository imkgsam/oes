export const AUTH_SESSION_REVOCATION_PORT = Symbol('AuthSessionRevocationPort')

export interface RevokeTenantSessionsInput {
  tenantId: string
  reason: 'TENANT_SUSPENDED' | 'TENANT_ARCHIVED'
}

/** AuthSessionRevocationPort asks auth-service to revoke tenant-scope sessions after tenant lifecycle changes. */
export interface AuthSessionRevocationPort {
  revokeTenantSessions(input: RevokeTenantSessionsInput): Promise<void>
}
