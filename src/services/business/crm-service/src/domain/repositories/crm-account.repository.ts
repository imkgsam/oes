import {
  CrmAccountLifecycleStage,
  CrmAccountRecord,
  CrmAccountRecordStatus,
  CrmActivityRecord,
  CrmContactRecord,
  CrmOpportunityRecord,
  CrmSourceRecord
} from '../models/crm-records'

export type CrmDuplicateConfidence = 'HIGH' | 'MEDIUM' | 'LOW'

export interface CrmDuplicateSearchInput {
  tenantId: string
  displayName?: string | null
  leadCompanyName?: string | null
  leadPersonName?: string | null
  leadDomain?: string | null
  leadEmail?: string | null
  leadPhone?: string | null
  leadWhatsapp?: string | null
  leadCountry?: string | null
  leadIdentifiers?: Array<{
    identifierType: string
    normalizedValue: string
    issuerCountryOrRegion?: string | null
  }>
}

export interface CrmAccountDuplicateCandidate {
  crmAccountId: string
  tenantId: string
  displayName: string
  ownerAccountId?: string | null
  recordStatus: CrmAccountRecordStatus
  lifecycleStage: CrmAccountLifecycleStage
  matchedFields: string[]
  confidence: CrmDuplicateConfidence
}

export interface ListCrmAccountsInput {
  tenantId: string
  keyword?: string | null
  lifecycleStage?: CrmAccountLifecycleStage | null
  recordStatus?: CrmAccountRecordStatus | null
  ownerAccountId?: string | null
  page?: number
  pageSize?: number
}

export interface ListCrmAccountsResult {
  items: CrmAccountRecord[]
  total: number
  page: number
  pageSize: number
}

/** CrmAccountRepository defines CRM P1 persistence operations used by application use cases. */
export interface CrmAccountRepository {
  findAccountById(tenantId: string, accountId: string): Promise<CrmAccountRecord | null>
  findActiveFormalByTenantPartyId(tenantId: string, tenantPartyId: string): Promise<CrmAccountRecord | null>
  listAccounts(input: ListCrmAccountsInput): Promise<ListCrmAccountsResult>
  saveAccount(account: CrmAccountRecord): Promise<CrmAccountRecord>
  addSourceRecord(source: CrmSourceRecord): Promise<CrmSourceRecord>
  findDuplicateCandidates(input: CrmDuplicateSearchInput): Promise<CrmAccountDuplicateCandidate[]>
  addContact?(contact: CrmContactRecord): Promise<CrmContactRecord>
  addActivity?(activity: CrmActivityRecord): Promise<CrmActivityRecord>
  saveOpportunity?(opportunity: CrmOpportunityRecord): Promise<CrmOpportunityRecord>
}
