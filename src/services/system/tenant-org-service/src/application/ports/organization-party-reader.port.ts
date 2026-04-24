/** OrganizationPartyLookupSummary captures the minimal party facts tenant-org-service needs for org-party validation. */
export interface OrganizationPartyLookupSummary {
  id: string
  type: string
  status: string
}

export const ORGANIZATION_PARTY_READER = Symbol('ORGANIZATION_PARTY_READER')

/** OrganizationPartyReader resolves canonical organization party facts through the party-service query boundary. */
export interface OrganizationPartyReader {
  getOrganizationPartyById(partyId: string): Promise<OrganizationPartyLookupSummary | null>
}
