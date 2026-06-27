export type ExtensionCrmStatus =
  | 'CUSTOMER'
  | 'OTHER_OWNER_LEAD'
  | 'OWNED_LEAD'
  | 'POOL_LEAD'
  | 'POSSIBLE_DUPLICATE'
  | 'PROSPECT_CUSTOMER'
  | 'RESTRICTED'
  | 'UNKNOWN'

export type ExtensionCrmAction =
  | 'CHECK_DUPLICATE'
  | 'CLAIM_POOL_LEAD'
  | 'CREATE_ACTIVE_LEAD'
  | 'CREATE_DRAFT_LEAD'
  | 'OPEN_OES_DETAIL'

export interface ExtensionCrmPageSignals {
  capturedAt: string
  companyNameCandidates?: string[]
  domain: string
  pageKind: 'OFFICIAL_SITE' | 'SEARCH_RESULTS'
  selectedText?: string
  socialLinks?: string[]
  title: string
  url: string
  visibleEmails?: string[]
  visiblePhones?: string[]
}

export interface ExtensionCrmLeadCapturePayload {
  browserContext: {
    entryPoint: 'CONTEXT_MENU'
    workspace: 'CRM'
  }
  capturedAt: string
  captureKind: 'CURRENT_PAGE' | 'LINK'
  companyNameCandidates: string[]
  sourcePageTitle: string
  sourcePageUrl: string
  targetDomain: string
  targetTitle: string
  targetUrl: string
  visibleEmails: string[]
  visiblePhones: string[]
}

export interface ExtensionCrmAccountSummary {
  archiveReason?: string
  archivedAt?: string
  createdAt?: string
  crmAccountId: string
  displayName: string
  leadCountry?: string
  leadDomain?: string
  leadEmail?: string
  leadPhone?: string
  lifecycleStage: string
  nextFollowUpAt?: string
  ownerAccountId?: string
  ownerDisplayName?: string
  ownerKind?: string
  priority?: string
  recordStatus: string
  updatedAt?: string
}

export interface ExtensionCrmResolvedPage {
  allowedActions: ExtensionCrmAction[]
  archiveReason?: string
  archivedAt?: string
  deepLinks?: { tenantWebCrmAccountUrl?: string }
  domain?: string
  duplicateHints?: Array<{
    archiveReason?: string
    archivedAt?: string
    confidence: string
    crmAccountId: string
    displayName: string
    lifecycleStage?: string
    matchedFields: string[]
    ownerKind: string
    recordStatus?: string
  }>
  matchedAccount?: ExtensionCrmAccountSummary | null
  status: ExtensionCrmStatus
  summary?: {
    description: string
    displayName: string
    label: string
    sensitivity: string
  }
  title?: string
  url?: string
}

export interface ResolvePageContextRequest {
  page: ExtensionCrmPageSignals
}

export interface SearchResultCandidateRequest {
  domain: string
  snippet?: string
  title: string
  url: string
}

export interface ResolveSearchResultsRequest {
  capturedAt: string
  query: string
  results: SearchResultCandidateRequest[]
  searchEngine: string
}

export interface ExtensionLeadRequest {
  capture?: ExtensionCrmLeadCapturePayload
  displayName: string
  duplicateWarningAcknowledged?: boolean
  leadCompanyName?: string
  leadCountry?: string
  leadDomain?: string
  leadEmail?: string
  leadPhone?: string
  page?: ExtensionCrmPageSignals
  partyTypeHint?: string
  priority?: string
  sourceNote?: string
}

export interface ExtensionCrmAccountPage {
  crmAccounts: ExtensionCrmAccountSummary[]
  page: number
  pageSize: number
  total: number
}
