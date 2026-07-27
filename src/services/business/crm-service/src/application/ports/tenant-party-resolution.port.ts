import {
  CrmAccountProfileItemRecord,
  CrmAccountTypeHint,
  CrmLeadIdentifierRecord
} from '../../domain/models/crm-records'

export enum TenantPartyResolutionResultType {
  EXACT_MATCH = 'EXACT_MATCH',
  NO_MATCH = 'NO_MATCH',
  CANDIDATES_FOUND = 'CANDIDATES_FOUND',
  IDENTITY_CONFLICT = 'IDENTITY_CONFLICT'
}

export interface TenantPartyResolutionCandidate {
  tenantPartyId: string
  displayName: string
  confidence: number
  matchedFields: string[]
  conflictFlags: string[]
}

export interface ResolveTenantPartyForConsumerInput {
  tenantId: string
  typeHint: CrmAccountTypeHint
  name: string
  country?: string | null
  identifiers: CrmLeadIdentifierRecord[]
  profileItems?: CrmAccountProfileItemRecord[]
}

export interface ResolveTenantPartyForConsumerResult {
  resultType: TenantPartyResolutionResultType
  tenantPartyId?: string | null
  displayName?: string | null
  candidates: TenantPartyResolutionCandidate[]
  matchedFields: string[]
}

export interface RegisterTenantPartyFromCrmInput {
  tenantId: string
  typeHint: CrmAccountTypeHint
  legalName: string
  displayName: string
  country?: string | null
  identifiers: CrmLeadIdentifierRecord[]
  profileItems?: Array<{
    itemType:
      | 'EMAIL'
      | 'PHONE'
      | 'WHATSAPP'
      | 'WECHAT'
      | 'DOMAIN'
      | 'WEBSITE'
      | 'SOCIAL_PROFILE'
      | 'MARKETPLACE_STORE'
    normalizedValue: string
    rawValue?: string | null
    label?: string | null
    role?: string | null
  }>
}

export interface RegisterTenantPartyFromCrmResult {
  tenantPartyId: string
  displayName: string
}

/** TenantPartyResolutionPort exposes party-service formal subject matching without CRM-specific account logic. */
export interface TenantPartyResolutionPort {
  resolveTenantPartyForConsumer(
    input: ResolveTenantPartyForConsumerInput
  ): Promise<ResolveTenantPartyForConsumerResult>
  registerTenantParty(
    input: RegisterTenantPartyFromCrmInput
  ): Promise<RegisterTenantPartyFromCrmResult>
}
