export const PERMISSION_TENANT_ONBOARDING_PORT = Symbol('TENANT_ONBOARDING_PERMISSION_PORT')

/** PermissionTenantOnboardingPort exposes permission-service tenant role ensure and grant operations. */
export interface PermissionTenantOnboardingPort {
  ensureTenantAdminRole(input: {
    tenantId: string
    idempotencyKey: string
  }): Promise<{ roleId: string; roleCode: string; created: boolean }>
  ensureHrAdminRole(input: {
    tenantId: string
    idempotencyKey: string
  }): Promise<{ roleId: string; roleCode: string; created: boolean }>
  ensureAccountBasicRole(input: {
    tenantId: string
    idempotencyKey: string
  }): Promise<{ roleId: string; roleCode: string; created: boolean }>
  grantTenantAdmin(input: {
    tenantId: string
    accountId: string
    roleId: string
    idempotencyKey: string
  }): Promise<{ grantId: string }>
  grantHrAdmin(input: {
    tenantId: string
    accountId: string
    roleId: string
    idempotencyKey: string
  }): Promise<{ grantId: string }>
}
