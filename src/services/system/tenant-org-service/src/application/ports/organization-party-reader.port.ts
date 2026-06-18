/** OrganizationTenantPartyLookupSummary captures the minimal tenant-party facts tenant-org-service needs for org validation. */
export interface OrganizationTenantPartyLookupSummary {
  id: string
  tenantId: string
  type: string
  status: string
}

export const ORGANIZATION_PARTY_READER = Symbol('ORGANIZATION_PARTY_READER')

/** OrganizationTenantPartyReader resolves tenant-local organization subject facts through the party-service query boundary. */
export interface OrganizationTenantPartyReader {
  getOrganizationTenantPartyById(input: {
    tenantId: string
    tenantPartyId: string
  }): Promise<OrganizationTenantPartyLookupSummary | null>
}
