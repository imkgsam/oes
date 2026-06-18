import {
  IdentifierStatus,
  PartyType,
  TenantPartyStatus
} from '../value-objects'

/** TenantPartySummary is the minimal tenant-scoped subject view shared between repositories and services. */
export interface TenantPartySummary {
  id: string
  tenantId: string
  type: PartyType
  legalName: string
  displayName?: string | null
  localCode?: string | null
  registeredCountry?: string | null
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

/** ContactPointInput describes one tenant-party contact or digital evidence point used for search and registration. */
export interface ContactPointInput {
  contactPointType: 'EMAIL' | 'PHONE' | 'WHATSAPP' | 'DOMAIN' | 'WEBSITE'
  normalizedValue: string
  rawValue: string
  label?: string
}

/** SearchTenantPartyCandidatesInput carries tenant-local search criteria for candidate lookup. */
export interface SearchTenantPartyCandidatesInput {
  tenantId: string
  keyword?: string
  partyType?: PartyType
  registeredCountry?: string
  identifiers?: IdentifierInput[]
  domain?: string
  email?: string
  phone?: string
  whatsapp?: string
}

/** ResolveTenantPartyForConsumerInput carries consumer evidence for tenant-local subject resolution without consumer semantics. */
export interface ResolveTenantPartyForConsumerInput {
  tenantId: string
  typeHint?: PartyType
  name?: string
  country?: string
  domain?: string
  email?: string
  phone?: string
  whatsapp?: string
  identifiers?: IdentifierInput[]
}

/** TenantPartyCandidate summarizes one tenant-local subject candidate returned without side effects. */
export interface TenantPartyCandidate {
  tenantParty: TenantPartySummary
  confidence: number
  matchSignals: string[]
}

/** ResolvedTenantPartyCandidate adds resolution-specific match and conflict details to one tenant party candidate. */
export interface ResolvedTenantPartyCandidate {
  tenantParty: TenantPartySummary
  confidence: number
  matchedFields: string[]
  conflictFlags: string[]
}

/** ResolveTenantPartyForConsumerResult classifies tenant-local subject resolution for downstream services. */
export interface ResolveTenantPartyForConsumerResult {
  result: 'EXACT_MATCH' | 'NO_MATCH' | 'CANDIDATES_FOUND' | 'IDENTITY_CONFLICT'
  tenantParty: TenantPartySummary | null
  candidates: ResolvedTenantPartyCandidate[]
  matchedFields: string[]
}

/** RegisterTenantPartyInput captures the legal and local inputs required to register a tenant-scoped subject. */
export interface RegisterTenantPartyInput {
  tenantId: string
  type: PartyType
  legalName: string
  displayName?: string
  localCode?: string
  identifiers: IdentifierInput[]
  contactPoints?: ContactPointInput[]
  idempotencyKey?: string
  registeredCountry?: string
}

/** DeactivateTenantPartyInput marks one tenant party inactive without deleting history. */
export interface DeactivateTenantPartyInput {
  tenantId: string
  tenantPartyId: string
  reason?: string
}

/** TenantPartyRepository owns tenant-scoped subject lookup, registration, search, and lifecycle changes. */
export interface TenantPartyRepository {
  findById(tenantId: string, tenantPartyId: string): Promise<TenantPartySummary | null>
  findByTenantAndIdentifier(tenantId: string, identifiers: IdentifierInput[]): Promise<TenantPartySummary | null>
  findCandidates(input: SearchTenantPartyCandidatesInput): Promise<TenantPartyCandidate[]>
  create(data: RegisterTenantPartyInput): Promise<TenantPartySummary>
  deactivate(data: DeactivateTenantPartyInput): Promise<TenantPartySummary>
}

/** PartyRegistrationIdempotencyRecord rehydrates a completed registration request for safe retries. */
export interface PartyRegistrationIdempotencyRecord {
  idempotencyKey: string
  requestHash: string
  operation: string
  tenantParty: TenantPartySummary
  matchResult?: string | null
}

/** PartyRegistrationIdempotencyRepository stores completed party registration outcomes keyed by caller idempotency. */
export interface PartyRegistrationIdempotencyRepository {
  findByKey(idempotencyKey: string): Promise<PartyRegistrationIdempotencyRecord | null>
  saveCompleted(input: {
    idempotencyKey: string
    requestHash: string
    operation: string
    tenantPartyId: string
    matchResult?: string
  }): Promise<PartyRegistrationIdempotencyRecord>
}

export const TENANT_PARTY_REPOSITORY = Symbol('TENANT_PARTY_REPOSITORY')
export const PARTY_REGISTRATION_IDEMPOTENCY_REPOSITORY = Symbol('PARTY_REGISTRATION_IDEMPOTENCY_REPOSITORY')
