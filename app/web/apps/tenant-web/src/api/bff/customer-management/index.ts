import { requestClient } from '#/api/request'

export namespace CustomerManagementApi {
  export type CrmAccountLifecycleStage = 'CUSTOMER' | 'LEAD' | 'PROSPECT_CUSTOMER'
  export type CrmAccountRecordStatus = 'ACTIVE' | 'ARCHIVED' | 'DRAFT'
  export type CrmAccountTypeHint = 'ORGANIZATION' | 'PERSON' | 'UNKNOWN'
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
  export type CrmSourceType =
    | 'AD_CAMPAIGN'
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
    priority: CrmPriority | string
    lastActivityAt: string
    nextFollowUpAt: string
    createdBy: string
    createdAt: string
    updatedAt: string
    archivedAt: string
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
    ownerAccountId?: string
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

  export interface CrmAccountListQuery {
    keyword?: string
    lifecycleStage?: CrmAccountLifecycleStage
    ownerAccountId?: string
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

// Lists CRM P1 accounts for the sales workspace without using the legacy customer-directory shape.
export async function listCrmAccountsApi(
  tenantId: string,
  params: CustomerManagementApi.CrmAccountListQuery
) {
  return requestClient.get<CustomerManagementApi.CrmAccountListResult>(
    `/customer-management/tenants/${encodeURIComponent(tenantId)}/crm-accounts`,
    {
      params
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
