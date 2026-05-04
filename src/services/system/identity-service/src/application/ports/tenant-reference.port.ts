export interface TenantReference {
  id: string
}

// TenantReferencePort reads minimal tenant reference facts owned by tenant-org-service.
export interface TenantReferencePort {
  findById(tenantId: string): Promise<TenantReference | null>
}

export const TENANT_REFERENCE_PORT = Symbol('IDENTITY_TENANT_REFERENCE_PORT')
