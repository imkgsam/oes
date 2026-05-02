export const PARTY_REGISTRATION_PORT = Symbol('TENANT_ONBOARDING_PARTY_REGISTRATION_PORT')

export interface PartyIdentifierInput {
  identifierType: string
  rawValue?: string
  normalizedValue: string
  issuerCountryOrRegion?: string
}

/** PartyRegistrationPort exposes only the party-service writes needed by tenant onboarding. */
export interface PartyRegistrationPort {
  registerOrganizationParty(input: {
    canonicalName: string
    registeredCountry?: string
    identifiers: PartyIdentifierInput[]
    idempotencyKey: string
  }): Promise<{ partyId: string; tenantPartyId?: string }>
  bindExistingPartyToTenant(input: {
    tenantId: string
    partyId: string
    localDisplayName?: string
    localCode?: string
    idempotencyKey: string
  }): Promise<{ partyId: string; tenantPartyId: string }>
}
