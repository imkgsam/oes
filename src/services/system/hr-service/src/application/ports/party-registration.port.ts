export const PARTY_REGISTRATION_PORT = Symbol('PARTY_REGISTRATION_PORT')

export interface RegisterTenantPartyInput {
  idempotencyKey?: string
  identifiers: Array<{
    identifierType: string
    issuerCountryOrRegion?: string
    normalizedValue: string
    rawValue?: string
  }>
  legalName: string
  displayName?: string
  tenantId: string
}

export interface RegisterTenantPartyResult {
  tenantPartyId: string
}

export interface PartyRegistrationPort {
  registerTenantParty(input: RegisterTenantPartyInput): Promise<RegisterTenantPartyResult>
}
