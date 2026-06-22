export enum CrmAccountLifecycleStage {
  LEAD = 'LEAD',
  PROSPECT_CUSTOMER = 'PROSPECT_CUSTOMER',
  CUSTOMER = 'CUSTOMER'
}

export enum CrmAccountRecordStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED'
}

export enum CrmAccountTypeHint {
  UNKNOWN = 'UNKNOWN',
  PERSON = 'PERSON',
  ORGANIZATION = 'ORGANIZATION'
}

export enum CrmPriority {
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D'
}

export enum CrmSourceType {
  WEBSITE_FORM = 'WEBSITE_FORM',
  EXHIBITION_SCAN = 'EXHIBITION_SCAN',
  BUSINESS_CARD = 'BUSINESS_CARD',
  ADVERTISEMENT = 'ADVERTISEMENT',
  AD_CAMPAIGN = 'AD_CAMPAIGN',
  REFERRAL = 'REFERRAL',
  IMPORTED_LIST = 'IMPORTED_LIST',
  BROWSER_EXTENSION = 'BROWSER_EXTENSION',
  WEB_RESEARCH = 'WEB_RESEARCH',
  PEER_TRANSFER = 'PEER_TRANSFER',
  SOCIAL_MEDIA = 'SOCIAL_MEDIA',
  COLD_EMAIL = 'COLD_EMAIL',
  CUSTOMER_RECOMMENDATION = 'CUSTOMER_RECOMMENDATION',
  MANUAL_INPUT = 'MANUAL_INPUT',
  OTHER = 'OTHER'
}

export enum CrmOpportunityStage {
  NEW = 'NEW',
  QUALIFYING = 'QUALIFYING',
  QUOTING = 'QUOTING',
  SAMPLE = 'SAMPLE',
  NEGOTIATION = 'NEGOTIATION',
  WON = 'WON',
  LOST = 'LOST'
}

export enum CrmOpportunityStatus {
  OPEN = 'OPEN',
  WON = 'WON',
  LOST = 'LOST',
  CANCELLED = 'CANCELLED'
}

export enum CrmActivityType {
  NOTE = 'NOTE',
  CALL = 'CALL',
  EMAIL = 'EMAIL',
  MEETING = 'MEETING',
  MESSAGE = 'MESSAGE',
  SOURCE_CAPTURED = 'SOURCE_CAPTURED',
  STATUS_CHANGED = 'STATUS_CHANGED',
  OWNER_CHANGED = 'OWNER_CHANGED',
  OPPORTUNITY_CREATED = 'OPPORTUNITY_CREATED',
  OPPORTUNITY_STAGE_CHANGED = 'OPPORTUNITY_STAGE_CHANGED',
  OPPORTUNITY_CLOSED = 'OPPORTUNITY_CLOSED',
  QUOTE_VIEWED = 'QUOTE_VIEWED',
  EXTERNAL_EVENT = 'EXTERNAL_EVENT',
  OTHER = 'OTHER'
}

export enum CrmActivityDirection {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND',
  INTERNAL = 'INTERNAL'
}

export enum CrmActivityCreatedByType {
  USER = 'USER',
  SYSTEM = 'SYSTEM',
  INTEGRATION = 'INTEGRATION'
}

export enum CrmActivityVisibility {
  INTERNAL = 'INTERNAL',
  TEAM = 'TEAM',
  OWNER_ONLY = 'OWNER_ONLY'
}

export enum CrmLeadDuplicateResultType {
  NO_DUPLICATE = 'NO_DUPLICATE',
  POSSIBLE_DUPLICATE = 'POSSIBLE_DUPLICATE',
  CLAIMABLE_EXISTING = 'CLAIMABLE_EXISTING',
  OWNED_DUPLICATE = 'OWNED_DUPLICATE',
  RESTRICTED_DUPLICATE = 'RESTRICTED_DUPLICATE'
}

export enum CrmLeadCreateResultType {
  CREATED = 'CREATED',
  BLOCKED_BY_CLAIMABLE_EXISTING = 'BLOCKED_BY_CLAIMABLE_EXISTING',
  BLOCKED_BY_OWNED_DUPLICATE = 'BLOCKED_BY_OWNED_DUPLICATE',
  BLOCKED_BY_RESTRICTED_DUPLICATE = 'BLOCKED_BY_RESTRICTED_DUPLICATE'
}

export enum CrmLeadAssignmentIntent {
  OWNED_BY_OPERATOR = 'OWNED_BY_OPERATOR',
  POOL = 'POOL'
}

export enum CrmLeadConversionResultType {
  CONVERTED = 'CONVERTED',
  INSUFFICIENT_INFO = 'INSUFFICIENT_INFO',
  USER_CHOICE_REQUIRED = 'USER_CHOICE_REQUIRED',
  EXISTING_CRM_ACCOUNT_FOUND = 'EXISTING_CRM_ACCOUNT_FOUND',
  IDENTITY_CONFLICT = 'IDENTITY_CONFLICT'
}

export interface CrmLeadIdentifierRecord {
  identifierType: string
  normalizedValue: string
  rawValue?: string | null
  issuerCountryOrRegion?: string | null
}

export interface CrmAccountRecord {
  id: string
  tenantId: string
  tenantPartyId?: string | null
  recordStatus: CrmAccountRecordStatus
  lifecycleStage: CrmAccountLifecycleStage
  partyTypeHint: CrmAccountTypeHint
  displayName: string
  leadCompanyName?: string | null
  leadPersonName?: string | null
  leadDomain?: string | null
  leadEmail?: string | null
  leadPhone?: string | null
  leadWhatsapp?: string | null
  leadCountry?: string | null
  leadIdentifiers: CrmLeadIdentifierRecord[]
  ownerAccountId?: string | null
  priority: CrmPriority
  lastActivityAt?: Date | null
  nextFollowUpAt?: Date | null
  createdBy: string
  createdAt?: Date
  updatedAt?: Date
  archivedAt?: Date | null
}

export interface CrmSourceRecord {
  id: string
  tenantId: string
  crmAccountId: string
  sourceType: CrmSourceType
  sourceName?: string | null
  capturedAt: Date
  capturedByAccountId?: string | null
  externalReference?: string | null
  rawPayload?: Record<string, unknown> | null
  note?: string | null
  isPrimary: boolean
  createdAt?: Date
  updatedAt?: Date
}

export interface CrmContactRecord {
  id: string
  tenantId: string
  crmAccountId: string
  personTenantPartyId?: string | null
  name: string
  title?: string | null
  department?: string | null
  email?: string | null
  phone?: string | null
  whatsapp?: string | null
  linkedin?: string | null
  isPrimary: boolean
  note?: string | null
  createdBy: string
  createdAt?: Date
  updatedAt?: Date
  archivedAt?: Date | null
}

export interface CrmActivityRecord {
  id: string
  tenantId: string
  crmAccountId: string
  opportunityId?: string | null
  contactId?: string | null
  activityType: CrmActivityType
  direction: CrmActivityDirection
  subject: string
  content?: string | null
  occurredAt: Date
  createdByAccountId?: string | null
  createdByType: CrmActivityCreatedByType
  externalProvider?: string | null
  externalReference?: string | null
  metadata: Record<string, unknown>
  visibility: CrmActivityVisibility
  createdAt?: Date
}

export interface CrmOpportunityRecord {
  id: string
  tenantId: string
  crmAccountId: string
  ownerAccountId: string
  name: string
  stage: CrmOpportunityStage
  status: CrmOpportunityStatus
  estimatedAmount?: string | null
  currency: string
  expectedCloseDate?: Date | null
  openedAt: Date
  closedAt?: Date | null
  closeReason?: string | null
  closeNote?: string | null
  createdBy: string
  createdAt?: Date
  updatedAt?: Date
}

export interface CrmOperatorContext {
  operatorId: string
  operatorType: string
  orgId?: string | null
}

export interface CrmTraceContext {
  traceId: string
  requestId: string
}

export interface CrmAuditContext {
  auditId: string
  reason: string
  source: string
}

export interface PageResult<TItem> {
  items: TItem[]
  total: number
  page: number
  pageSize: number
}

/** cloneRecord deep-clones plain CRM records so repositories do not leak mutable state across calls. */
export function cloneRecord<T>(value: T): T {
  return structuredClone(value)
}
