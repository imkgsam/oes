import { requestClient } from '#/api/request'

export namespace CustomerManagementApi {
  export type CrmAccountLifecycleStage = 'CUSTOMER' | 'LEAD' | 'PROSPECT_CUSTOMER'
  export type CrmAccountRecordStatus = 'ACTIVE' | 'ARCHIVED' | 'DRAFT'
  export type CrmAccountTypeHint = 'ORGANIZATION' | 'PERSON' | 'UNKNOWN'
  export type CrmArchiveReason =
    | 'COMPETITOR'
    | 'DUPLICATE'
    | 'INVALID_TARGET'
    | 'LOW_VALUE'
    | 'NON_TARGET_ACCOUNT'
    | 'NO_FIT'
    | 'OTHER'
    | 'UNRESPONSIVE'
  export type CrmLeadCreateResultType =
    | 'BLOCKED_BY_CLAIMABLE_EXISTING'
    | 'BLOCKED_BY_OWNED_DUPLICATE'
    | 'BLOCKED_BY_RESTRICTED_DUPLICATE'
    | 'CREATED'
  export type CrmLeadConversionResultType =
    | 'CONVERTED'
    | 'EXISTING_CRM_ACCOUNT_FOUND'
    | 'IDENTITY_CONFLICT'
    | 'INSUFFICIENT_INFO'
    | 'USER_CHOICE_REQUIRED'
  export type CrmLeadDuplicateResultType =
    | 'CLAIMABLE_EXISTING'
    | 'NO_DUPLICATE'
    | 'OWNED_DUPLICATE'
    | 'POSSIBLE_DUPLICATE'
    | 'RESTRICTED_DUPLICATE'
  export type CrmPriority = 'A' | 'B' | 'C' | 'D'
  export type CrmLeadAssignmentIntent = 'OWNED_BY_OPERATOR' | 'POOL'
  export type CrmSourceType =
    | 'AD_CAMPAIGN'
    | 'BROWSER_EXTENSION'
    | 'BUSINESS_CARD'
    | 'EXHIBITION_SCAN'
    | 'IMPORTED_LIST'
    | 'OTHER'
    | 'PEER_TRANSFER'
    | 'REFERRAL'
    | 'SOCIAL_MEDIA'
    | 'WEB_RESEARCH'
    | 'WEBSITE_FORM'
  export interface CrmLeadIdentifier {
    identifierType: string
    normalizedValue: string
    rawValue?: string
    issuerCountryOrRegion?: string
  }

  export interface CrmAccount {
    crmAccountId: string
    tenantId: string
    tenantPartyId: string
    recordStatus: CrmAccountRecordStatus | string
    lifecycleStage: CrmAccountLifecycleStage | string
    archiveReason: CrmArchiveReason | string
    partyTypeHint: CrmAccountTypeHint | string
    displayName: string
    leadCompanyName: string
    leadPersonName: string
    leadDomain: string
    leadEmail: string
    leadPhone: string
    leadWhatsapp: string
    leadCountry: string
    leadIdentifiers: CrmLeadIdentifier[]
    ownerAccountId: string
    ownerDisplayName: string
    priority: CrmPriority | string
    lastActivityAt: string
    nextFollowUpAt: string
    createdBy: string
    createdByDisplayName: string
    createdAt: string
    updatedAt: string
    archivedAt: string
  }

  export interface CrmSourceRecord {
    sourceRecordId: string
    crmAccountId: string
    sourceType: CrmSourceType | string
    sourceName: string
    capturedAt: string
    capturedByAccountId: string
    capturedByDisplayName: string
    externalReference: string
    rawPayload: Record<string, unknown> | null
    note: string
    isPrimary: boolean
    createdAt: string
    updatedAt: string
  }

  export interface CrmSourceRecordListResult {
    sourceRecords: CrmSourceRecord[]
  }

  export interface CrmDuplicateCandidate {
    crmAccountId: string
    tenantId: string
    displayName: string
    ownerAccountId: string
    recordStatus: string
    lifecycleStage: string
    matchedFields: string[]
    confidence: string
  }

  export interface CrmLeadDuplicateResult {
    resultType: CrmLeadDuplicateResultType | string
    candidates: CrmDuplicateCandidate[]
  }

  export interface CrmPartyCandidate {
    tenantPartyId: string
    displayName: string
    confidence: number
    matchedFields: string[]
    conflictFlags: string[]
  }

  export interface SelectableCustomer {
    customerAccountId: string
    customerAccountNo: string
    displayName: string
    status: string
    primaryTenantPartyId: string
    primaryPartyDisplayName: string
  }

  export interface CustomerAccount {
    customerAccountId: string
    customerAccountNo: string
    tenantId: string
    displayName: string
    status: string
    customerCategory: string
    tags: string[]
    primaryBinding?: {
      customerPartyBindingId: string
      tenantPartyId: string
      bindingStatus?: string
      partyDisplayName: string
    }
  }

  export interface CreateLeadPayload {
    displayName: string
    duplicateWarningAcknowledged?: boolean
    leadCompanyName?: string
    leadCountry?: string
    leadDomain?: string
    leadEmail?: string
    leadIdentifiers?: CrmLeadIdentifier[]
    leadPersonName?: string
    leadPhone?: string
    leadWhatsapp?: string
    nextFollowUpAt?: string
    claimForCurrentUser?: boolean
    assignmentIntent?: CrmLeadAssignmentIntent
    partyTypeHint?: CrmAccountTypeHint
    priority?: CrmPriority
    sourceCapturedAt?: string
    sourceCapturedByAccountId?: string
    sourceExternalReference?: string
    sourceName?: string
    sourceNote?: string
    sourceRawPayload?: Record<string, unknown>
    sourceType: CrmSourceType
  }

  export interface CreateLeadResult {
    resultType: CrmLeadCreateResultType | string
    crmAccount: CrmAccount | null
    duplicateResult: CrmLeadDuplicateResult
  }

  export interface ConvertLeadToProspectCustomerResult {
    resultType: CrmLeadConversionResultType | string
    crmAccount: CrmAccount | null
    candidates: CrmPartyCandidate[]
    existingCrmAccountId: string
  }

  export interface CreateDraftLeadPayload extends Omit<CreateLeadPayload, 'claimForCurrentUser' | 'duplicateWarningAcknowledged' | 'sourceType'> {
    sourceType?: CrmSourceType
  }

  export interface UpdateDraftLeadPayload extends Omit<CreateDraftLeadPayload, 'sourceCapturedAt' | 'sourceCapturedByAccountId' | 'sourceExternalReference' | 'sourceName' | 'sourceNote' | 'sourceRawPayload' | 'sourceType'> {}

  export interface SubmitDraftLeadPayload {
    claimForCurrentUser?: boolean
    assignmentIntent?: CrmLeadAssignmentIntent
    duplicateWarningAcknowledged?: boolean
    sourceCapturedAt?: string
    sourceCapturedByAccountId?: string
    sourceExternalReference?: string
    sourceName?: string
    sourceNote?: string
    sourceRawPayload?: Record<string, unknown>
    sourceType?: CrmSourceType
  }

  export interface ArchiveCrmAccountPayload {
    archiveReason: CrmArchiveReason
  }

  export interface DeleteDraftLeadResult {
    deleted: boolean
    crmAccountId: string
  }

  export interface CheckLeadDuplicatePayload {
    displayName?: string
    leadCompanyName?: string
    leadCountry?: string
    leadDomain?: string
    leadEmail?: string
    leadIdentifiers?: CrmLeadIdentifier[]
    leadPersonName?: string
    leadPhone?: string
    leadWhatsapp?: string
  }

  export interface CheckLeadDuplicateResult {
    duplicateResult: CrmLeadDuplicateResult
  }

  export interface CrmAccountListQuery {
    createdBy?: string
    keyword?: string
    lifecycleStage?: CrmAccountLifecycleStage
    lifecycleStages?: CrmAccountLifecycleStage[]
    ownerAccountId?: string
    ownerless?: boolean
    page?: number
    pageSize?: number
    recordStatus?: CrmAccountRecordStatus
  }

  export interface CustomerAccountListQuery {
    keyword?: string
    page?: number
    pageSize?: number
    primaryTenantPartyId?: string
  }

  export interface SelectableCustomerListQuery {
    keyword?: string
    page?: number
    pageSize?: number
  }

  export interface CrmAccountListResult {
    crmAccounts: CrmAccount[]
    page: number
    pageSize: number
    total: number
  }

  export interface CustomerAccountListResult {
    customerAccounts: CustomerAccount[]
    page: number
    pageSize: number
    total: number
  }

  export interface SelectableCustomerListResult {
    customers: SelectableCustomer[]
    page: number
    pageSize: number
    total: number
  }
}

// Checks CRM P1 duplicate candidates before creating or submitting a lead.
export async function checkLeadDuplicateApi(
  tenantId: string,
  data: CustomerManagementApi.CheckLeadDuplicatePayload
) {
  return requestClient.post<CustomerManagementApi.CheckLeadDuplicateResult>(
    `/customer-management/tenants/${encodeURIComponent(tenantId)}/leads/check-duplicate`,
    data
  )
}

// Lists CRM P1 accounts for the sales workspace without using the legacy customer-directory shape.
export async function listCrmAccountsApi(
  tenantId: string,
  params: CustomerManagementApi.CrmAccountListQuery
) {
  return requestClient.get<CustomerManagementApi.CrmAccountListResult>(
    `/customer-management/tenants/${encodeURIComponent(tenantId)}/crm-accounts`,
    {
      params,
      paramsSerializer: 'repeat'
    }
  )
}

// Loads one CRM P1 account for the sales workspace detail panel.
export async function getCrmAccountApi(
  tenantId: string,
  crmAccountId: string
) {
  return requestClient.get<CustomerManagementApi.CrmAccount>(
    `/customer-management/tenants/${encodeURIComponent(tenantId)}/crm-accounts/${encodeURIComponent(crmAccountId)}`
  )
}

// Lists read-only CRM source evidence for one account detail page.
export async function listCrmSourceRecordsApi(
  tenantId: string,
  crmAccountId: string
) {
  return requestClient.get<CustomerManagementApi.CrmSourceRecordListResult>(
    `/customer-management/tenants/${encodeURIComponent(tenantId)}/crm-accounts/${encodeURIComponent(crmAccountId)}/source-records`
  )
}

// Creates one CRM P1 draft lead without entering the active lead views.
export async function createDraftLeadApi(
  tenantId: string,
  data: CustomerManagementApi.CreateDraftLeadPayload
) {
  return requestClient.post<CustomerManagementApi.CrmAccount>(
    `/customer-management/tenants/${encodeURIComponent(tenantId)}/draft-leads`,
    data
  )
}

// Updates one CRM P1 draft lead before submit.
export async function updateDraftLeadApi(
  tenantId: string,
  crmAccountId: string,
  data: CustomerManagementApi.UpdateDraftLeadPayload
) {
  return requestClient.request<CustomerManagementApi.CrmAccount>(
    `/customer-management/tenants/${encodeURIComponent(tenantId)}/draft-leads/${encodeURIComponent(crmAccountId)}`,
    { data, method: 'PATCH' }
  )
}

// Submits one CRM P1 draft lead to ACTIVE + LEAD after formal duplicate checks.
export async function submitDraftLeadApi(
  tenantId: string,
  crmAccountId: string,
  data: CustomerManagementApi.SubmitDraftLeadPayload
) {
  return requestClient.post<CustomerManagementApi.CreateLeadResult>(
    `/customer-management/tenants/${encodeURIComponent(tenantId)}/draft-leads/${encodeURIComponent(crmAccountId)}/submit`,
    data
  )
}

// Hard-deletes one CRM P1 draft lead and its source records.
export async function deleteDraftLeadApi(
  tenantId: string,
  crmAccountId: string
) {
  return requestClient.delete<CustomerManagementApi.DeleteDraftLeadResult>(
    `/customer-management/tenants/${encodeURIComponent(tenantId)}/draft-leads/${encodeURIComponent(crmAccountId)}`
  )
}

// Creates one CRM P1 active lead with a primary source record.
export async function createCrmLeadApi(
  tenantId: string,
  data: CustomerManagementApi.CreateLeadPayload
) {
  return requestClient.post<CustomerManagementApi.CreateLeadResult>(
    `/customer-management/tenants/${encodeURIComponent(tenantId)}/leads`,
    data
  )
}

// Converts one CRM P1 lead into a prospect customer through Party resolution.
export async function convertLeadToProspectCustomerApi(
  tenantId: string,
  crmAccountId: string
) {
  return requestClient.post<CustomerManagementApi.ConvertLeadToProspectCustomerResult>(
    `/customer-management/tenants/${encodeURIComponent(tenantId)}/leads/${encodeURIComponent(crmAccountId)}/convert-to-prospect-customer`,
    {}
  )
}

// Claims one ownerless CRM P1 Pool lead or prospect customer for the current operator.
export async function claimCrmAccountApi(
  tenantId: string,
  crmAccountId: string
) {
  return requestClient.post<CustomerManagementApi.CrmAccount>(
    `/customer-management/tenants/${encodeURIComponent(tenantId)}/crm-accounts/${encodeURIComponent(crmAccountId)}/claim`,
    {}
  )
}

// Releases one owned CRM P1 lead or prospect customer back to the ownerless Pool.
export async function releaseCrmAccountApi(
  tenantId: string,
  crmAccountId: string
) {
  return requestClient.post<CustomerManagementApi.CrmAccount>(
    `/customer-management/tenants/${encodeURIComponent(tenantId)}/crm-accounts/${encodeURIComponent(crmAccountId)}/release`,
    {}
  )
}

// Archives one CRM P1 lead or prospect customer with the CRM-owned reason selected by the operator.
export async function archiveCrmAccountApi(
  tenantId: string,
  crmAccountId: string,
  data: CustomerManagementApi.ArchiveCrmAccountPayload
) {
  return requestClient.post<CustomerManagementApi.CrmAccount>(
    `/customer-management/tenants/${encodeURIComponent(tenantId)}/crm-accounts/${encodeURIComponent(crmAccountId)}/archive`,
    data
  )
}

// Bridges legacy Sales selector screens onto the CRM P1 account endpoint until Sales/CRM selection is refrozen.
export async function listSelectableCustomersApi(
  tenantId: string,
  params: CustomerManagementApi.SelectableCustomerListQuery
) {
  const result = await listCrmAccountsApi(tenantId, {
    keyword: params.keyword,
    lifecycleStage: 'PROSPECT_CUSTOMER',
    page: params.page,
    pageSize: params.pageSize,
    recordStatus: 'ACTIVE'
  })

  return {
    customers: (result.crmAccounts ?? [])
      .filter((account) => Boolean(account.tenantPartyId))
      .map(mapCrmAccountToSelectableCustomer),
    page: result.page,
    pageSize: result.pageSize,
    total: result.total
  }
}

// Bridges current Sales quote detail display onto CRM P1 account data without restoring old customer-master endpoints.
export async function listManagedCustomerAccountsApi(
  tenantId: string,
  params: CustomerManagementApi.CustomerAccountListQuery
) {
  const result = await listCrmAccountsApi(tenantId, {
    keyword: params.keyword,
    page: params.page,
    pageSize: params.pageSize,
    recordStatus: 'ACTIVE'
  })
  const customerAccounts = (result.crmAccounts ?? [])
    .filter((account) =>
      params.primaryTenantPartyId ? account.tenantPartyId === params.primaryTenantPartyId : true
    )
    .map(mapCrmAccountToCustomerAccount)

  return {
    customerAccounts,
    page: result.page,
    pageSize: result.pageSize,
    total: customerAccounts.length
  }
}

// Maps a CRM P1 account into the temporary Sales customer selector shape.
function mapCrmAccountToSelectableCustomer(
  account: CustomerManagementApi.CrmAccount
): CustomerManagementApi.SelectableCustomer {
  return {
    customerAccountId: account.crmAccountId,
    customerAccountNo: '',
    displayName: account.displayName,
    status: account.lifecycleStage,
    primaryTenantPartyId: account.tenantPartyId,
    primaryPartyDisplayName: account.displayName
  }
}

// Maps a CRM P1 account into the temporary Sales quote-detail customer summary shape.
function mapCrmAccountToCustomerAccount(
  account: CustomerManagementApi.CrmAccount
): CustomerManagementApi.CustomerAccount {
  return {
    customerAccountId: account.crmAccountId,
    customerAccountNo: '',
    tenantId: account.tenantId,
    displayName: account.displayName,
    status: account.lifecycleStage,
    customerCategory: '',
    tags: [],
    primaryBinding: account.tenantPartyId
      ? {
          customerPartyBindingId: '',
          tenantPartyId: account.tenantPartyId,
          bindingStatus: 'ACTIVE_PRIMARY',
          partyDisplayName: account.displayName
        }
      : undefined
  }
}
