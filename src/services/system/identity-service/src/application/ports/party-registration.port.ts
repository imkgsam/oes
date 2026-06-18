import { OperatorScope } from '../authorization'

export interface RegisterTenantPartyInput {
  legalName: string
  displayName?: string
  operatorId?: string
  operatorScope?: OperatorScope
  tenantId: string
  idempotencyKey?: string
}

export interface RegisterTenantPartyResult {
  tenantPartyId: string
}

// Describes the party-service write capability identity-service needs when provisioning tenant accounts.
export interface PartyRegistrationPort {
  registerTenantParty(input: RegisterTenantPartyInput): Promise<RegisterTenantPartyResult>
}

export const PARTY_REGISTRATION_PORT = Symbol('IDENTITY_PARTY_REGISTRATION_PORT')
