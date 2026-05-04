export const PARTY_REGISTRATION_PORT = Symbol('PARTY_REGISTRATION_PORT')

export interface RegisterPersonPartyInput {
  idempotencyKey?: string
  identifiers: Array<{
    identifierType: string
    issuerCountryOrRegion?: string
    normalizedValue: string
    rawValue?: string
  }>
  legalName: string
  localDisplayName?: string
  tenantId: string
}

export interface RegisterPersonPartyResult {
  partyId: string
  tenantPartyId: string
}

export interface PartyRegistrationPort {
  registerPersonParty(input: RegisterPersonPartyInput): Promise<RegisterPersonPartyResult>
}
