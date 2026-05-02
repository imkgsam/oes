import {
  AssertionLevel,
  IdentifierStatus,
  PartyStatus,
  PartyType,
  RelationshipType,
  TenantPartyStatus
} from '../value-objects'

/** PartySummary is the minimal canonical party view shared between repositories and application services. */
export interface PartySummary {
  id: string
  type: PartyType
  status: PartyStatus
  canonicalName: string
  displayName?: string | null
}

/** TenantPartySummary is the minimal tenant-scoped binding view shared between repositories and services. */
export interface TenantPartySummary {
  id: string
  tenantId: string
  partyId: string
  localDisplayName?: string | null
  localCode?: string | null
  status: TenantPartyStatus | string
}

/** IdentifierInput describes one stable identifier supplied during registration or search. */
export interface IdentifierInput {
  identifierType: string
  normalizedValue: string
  rawValue: string
  issuerCountryOrRegion?: string
  status?: IdentifierStatus
}

/** SearchPartyCandidatesInput carries the minimal search criteria for candidate lookup. */
export interface SearchPartyCandidatesInput {
  tenantId: string
  keyword?: string
  partyType?: PartyType
  registeredCountry?: string
  identifiers?: IdentifierInput[]
}

/** PartyCandidate summarizes one possible match returned to the caller without side effects. */
export interface PartyCandidate {
  party: PartySummary
  confidence: number
  matchSignals: string[]
}

/** PartyRelationshipSummary is the stable outward-facing view of a first-stage party relationship. */
export interface PartyRelationshipSummary {
  id: string
  fromPartyId: string
  toPartyId: string
  relationshipType: RelationshipType
  assertionLevel: AssertionLevel
  effectiveFrom?: string | null
  effectiveTo?: string | null
}

/** CreatePersonPartyInput captures the canonical and local inputs required to register a person party. */
export interface CreatePersonPartyInput {
  tenantId: string
  canonicalName: string
  localDisplayName?: string
  localCode?: string
  identifiers: IdentifierInput[]
  idempotencyKey?: string
}

/** CreateOrganizationPartyInput captures the canonical and local inputs required to register an organization party. */
export interface CreateOrganizationPartyInput extends CreatePersonPartyInput {
  registeredCountry?: string
}

/** BindExistingPartyToTenantInput binds an already known canonical party to one tenant. */
export interface BindExistingPartyToTenantInput {
  tenantId: string
  partyId: string
  localDisplayName?: string
  localCode?: string
  tags?: string[]
  idempotencyKey?: string
}

/** DeactivateTenantPartyInput marks one tenant party inactive without deleting history. */
export interface DeactivateTenantPartyInput {
  tenantId: string
  tenantPartyId: string
  reason?: string
}

/** MergePartiesInput describes a high-risk merge operation for canonical parties. */
export interface MergePartiesInput {
  survivorPartyId: string
  mergedPartyIds: string[]
  reason?: string
}

/** PartyRepository owns canonical party persistence and candidate search operations. */
export interface PartyRepository {
  findById(id: string): Promise<PartySummary | null>
  createPersonParty(data: {
    canonicalName: string
    displayName?: string
  }): Promise<PartySummary>
  createOrganizationParty(data: {
    canonicalName: string
    displayName?: string
    registeredCountry?: string
  }): Promise<PartySummary>
  findCandidates(input: SearchPartyCandidatesInput): Promise<PartyCandidate[]>
  resolveByIdentifier(input: IdentifierInput): Promise<PartySummary | null>
  findRelationships(partyId: string, relationshipType?: RelationshipType): Promise<PartyRelationshipSummary[]>
  mergeParties(input: MergePartiesInput): Promise<{
    survivorParty: PartySummary
    mergedParties: Array<PartySummary & { status: PartyStatus | string }>
  }>
}

/** TenantPartyRepository owns tenant-scoped binding lookup and lifecycle changes. */
export interface TenantPartyRepository {
  findById(tenantId: string, tenantPartyId: string): Promise<TenantPartySummary | null>
  findByTenantAndPartyId(tenantId: string, partyId: string): Promise<TenantPartySummary | null>
  create(data: {
    tenantId: string
    partyId: string
    localDisplayName?: string
    localCode?: string
    tags?: string[]
  }): Promise<TenantPartySummary>
  deactivate(data: DeactivateTenantPartyInput): Promise<TenantPartySummary>
}

/** PartyIdentifierRepository owns strong-match lookup and identifier persistence. */
export interface PartyIdentifierRepository {
  createMany(partyId: string, identifiers: IdentifierInput[]): Promise<void>
  findStrongMatch(identifiers: IdentifierInput[]): Promise<PartySummary | null>
}

/** PartyRegistrationIdempotencyRecord rehydrates a completed registration request for safe retries. */
export interface PartyRegistrationIdempotencyRecord {
  idempotencyKey: string
  requestHash: string
  operation: string
  party: PartySummary
  tenantParty?: TenantPartySummary | null
  matchResult?: string | null
}

/** PartyRegistrationIdempotencyRepository stores completed party registration outcomes keyed by caller idempotency. */
export interface PartyRegistrationIdempotencyRepository {
  findByKey(idempotencyKey: string): Promise<PartyRegistrationIdempotencyRecord | null>
  saveCompleted(input: {
    idempotencyKey: string
    requestHash: string
    operation: string
    partyId: string
    tenantPartyId?: string
    matchResult?: string
  }): Promise<PartyRegistrationIdempotencyRecord>
}

export const PARTY_REPOSITORY = Symbol('PARTY_REPOSITORY')
export const TENANT_PARTY_REPOSITORY = Symbol('TENANT_PARTY_REPOSITORY')
export const PARTY_IDENTIFIER_REPOSITORY = Symbol('PARTY_IDENTIFIER_REPOSITORY')
export const PARTY_REGISTRATION_IDEMPOTENCY_REPOSITORY = Symbol('PARTY_REGISTRATION_IDEMPOTENCY_REPOSITORY')
