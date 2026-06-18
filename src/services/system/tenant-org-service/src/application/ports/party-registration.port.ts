export const PARTY_REGISTRATION_PORT = Symbol('TENANT_ONBOARDING_PARTY_REGISTRATION_PORT')

export interface TenantPartyIdentifierInput {
  identifierType: string
  rawValue?: string
  normalizedValue: string
  issuerCountryOrRegion?: string
}

/** PartyRegistrationPort exposes only the party-service writes needed by tenant onboarding. */
export interface PartyRegistrationPort {
  registerOrganizationTenantParty(input: {
    tenantId: string
    legalName: string
    registeredCountry?: string
    identifiers: TenantPartyIdentifierInput[]
    idempotencyKey: string
  }): Promise<{ tenantPartyId: string }>
}
