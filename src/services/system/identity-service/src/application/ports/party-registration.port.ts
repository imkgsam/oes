import { OperatorScope } from '../authorization'

export interface RegisterPersonPartyInput {
  legalName: string
  localDisplayName?: string
  operatorId?: string
  operatorScope?: OperatorScope
  tenantId?: string
  idempotencyKey?: string
}

export interface RegisterPersonPartyResult {
  partyId: string
  tenantPartyId?: string
}

export interface BindExistingPartyToTenantInput {
  idempotencyKey?: string
  localDisplayName?: string
  operatorId?: string
  operatorScope?: OperatorScope
  partyId: string
  tenantId: string
}

export interface BindExistingPartyToTenantResult {
  partyId: string
  tenantPartyId: string
}

// Describes the party-service write capabilities identity-service needs when provisioning human accounts.
export interface PartyRegistrationPort {
  bindExistingPartyToTenant(input: BindExistingPartyToTenantInput): Promise<BindExistingPartyToTenantResult>
  registerPersonParty(input: RegisterPersonPartyInput): Promise<RegisterPersonPartyResult>
}

export const PARTY_REGISTRATION_PORT = Symbol('IDENTITY_PARTY_REGISTRATION_PORT')
