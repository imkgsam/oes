import { OperatorScope } from '../authorization'

export interface RegisterPersonPartyInput {
  canonicalName: string
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

// Describes the single party-service write capability identity-service needs when creating a new human user.
export interface PartyRegistrationPort {
  registerPersonParty(input: RegisterPersonPartyInput): Promise<RegisterPersonPartyResult>
}

export const PARTY_REGISTRATION_PORT = Symbol('IDENTITY_PARTY_REGISTRATION_PORT')
