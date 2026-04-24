export const TENANT_ORG_REFERENCE_PORT = Symbol('TENANT_ORG_REFERENCE_PORT')

export interface TenantOrgReferenceValidationResult {
  valid: boolean
  rejectionReason?: string
}

export interface TenantOrgReferencePort {
  validateOrgReference(input: {
    tenantId: string
    orgUnitId: string
  }): Promise<TenantOrgReferenceValidationResult>
}
