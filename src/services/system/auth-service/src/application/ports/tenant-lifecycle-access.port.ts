export type TenantLifecycleStatus = 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED' | string

/** TenantLifecycleAccessPort reads tenant lifecycle truth from tenant-org-service for auth/session admission. */
export interface TenantLifecycleAccessPort {
  getTenantStatus(tenantId: string): Promise<TenantLifecycleStatus | null>
}
