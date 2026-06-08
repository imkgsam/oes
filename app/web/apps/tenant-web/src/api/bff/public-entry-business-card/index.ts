import { requestClient } from '#/api/request'

export namespace PublicEntryBusinessCardApi {
  export type Status = 'ACTIVE' | 'ARCHIVED' | 'DISABLED' | 'DRAFT'
  export type ActionType =
    | 'ADD_WECHAT'
    | 'CALL_PHONE'
    | 'OPEN_COMPANY_WEBSITE'
    | 'OPEN_WHATSAPP'
    | 'SAVE_VCARD'
    | 'SEND_EMAIL'
  export type TargetRefType = 'CONTACT_ASSET' | 'NONE' | 'TENANT_PUBLIC_PROFILE'

  export interface PublicEntryRef {
    expiresAt?: string
    publicEntryId: string
    publicUrl: string
    qrContent: string
    shortCode: string
    status: string
  }

  export interface ContactActionConfig {
    contactActionType: ActionType
    displayOrder: number
    enabled: boolean
    includeInVCard: boolean
    targetRefId?: null | string
    targetRefType: TargetRefType
    visibility: 'HIDDEN' | 'PUBLIC'
  }

  export interface VisibilityConfig {
    showCompany: boolean
    showDepartment: boolean
    showOfficialPhoto: boolean
    showTitle: boolean
  }

  export interface BusinessCardRecord {
    businessCardId: string
    contactActionConfigs: ContactActionConfig[]
    employeeId: string
    publicEntryRef?: null | PublicEntryRef
    status: Status
    templateKey: string
    tenantId: string
    updatedAt: string
    visibilityConfig: VisibilityConfig
  }

  export interface DetailResult {
    businessCard?: BusinessCardRecord
    readiness?: { ready: boolean; reasons: string[] }
  }

  export interface ListResult {
    items: BusinessCardRecord[]
    page: number
    pageSize: number
    total: number
  }

  export interface PublicView {
    businessCardId: string
    company: { companyDisplayName: string; logoUrl?: string; websiteUrl?: string }
    contactActions: Array<{
      actionUrl?: string
      contactActionType: ActionType
      displayOrder: number
      displayValue?: string
    }>
    person: {
      department?: string
      displayName: string
      englishName?: string
      officialPhotoUrl?: string
      title?: string
    }
    publicUrl?: string
    templateKey: string
  }

  export interface PublicRenderResult {
    state: 'AVAILABLE' | 'PUBLIC_CARD_NOT_FOUND' | 'PUBLIC_CARD_UNAVAILABLE'
    view?: PublicView
  }

  export interface CountBucket {
    count: number
    key: string
  }

  export interface VisitSummary {
    byDetectedChannel: CountBucket[]
    byDeviceType: CountBucket[]
    byReferrer: CountBucket[]
    byResultStatus: CountBucket[]
    lastVisitedAt?: string
    shortLinkId: string
    totalVisits: number
  }
}

const basePath = (tenantId: string) => `/public-entry/tenants/${tenantId}/business-cards`

// ensurePrimaryBusinessCardApi ensures one primary employee card through the admin BFF.
export function ensurePrimaryBusinessCardApi(tenantId: string, employeeId: string) {
  return requestClient.post<PublicEntryBusinessCardApi.DetailResult>(
    `${basePath(tenantId)}/ensure-primary`,
    { employeeId }
  )
}

// listBusinessCardsApi lists tenant-scoped BusinessCards.
export function listBusinessCardsApi(tenantId: string, query?: { page?: number; pageSize?: number }) {
  return requestClient.get<PublicEntryBusinessCardApi.ListResult>(basePath(tenantId), { params: query })
}

// getBusinessCardDetailApi loads one BusinessCard detail and readiness diagnostics.
export function getBusinessCardDetailApi(tenantId: string, businessCardId: string) {
  return requestClient.get<PublicEntryBusinessCardApi.DetailResult>(
    `${basePath(tenantId)}/${businessCardId}`
  )
}

// updateBusinessCardContactActionsApi replaces Contact Action references without contact values.
export function updateBusinessCardContactActionsApi(
  tenantId: string,
  businessCardId: string,
  payload: {
    contactActionConfigs: PublicEntryBusinessCardApi.ContactActionConfig[]
    visibilityConfig?: PublicEntryBusinessCardApi.VisibilityConfig
  }
) {
  return requestClient.post<PublicEntryBusinessCardApi.DetailResult>(
    `${basePath(tenantId)}/${businessCardId}/contact-actions`,
    payload
  )
}

// enableBusinessCardApi enables one ready BusinessCard.
export function enableBusinessCardApi(tenantId: string, businessCardId: string) {
  return requestClient.post(`${basePath(tenantId)}/${businessCardId}/enable`)
}

// disableBusinessCardApi disables one BusinessCard.
export function disableBusinessCardApi(tenantId: string, businessCardId: string) {
  return requestClient.post(`${basePath(tenantId)}/${businessCardId}/disable`)
}

// bindBusinessCardPublicEntryApi binds or refreshes the main ShortLink public entry.
export function bindBusinessCardPublicEntryApi(tenantId: string, businessCardId: string) {
  return requestClient.post<{ publicEntryRef: PublicEntryBusinessCardApi.PublicEntryRef }>(
    `${basePath(tenantId)}/${businessCardId}/public-entry`
  )
}

// getBusinessCardVisitSummaryApi reads visit summary through ShortLink.
export function getBusinessCardVisitSummaryApi(tenantId: string, businessCardId: string) {
  return requestClient.get<PublicEntryBusinessCardApi.VisitSummary>(
    `${basePath(tenantId)}/${businessCardId}/visits`
  )
}

// getOwnBusinessCardPreviewApi reads the authenticated employee self-view.
export function getOwnBusinessCardPreviewApi(tenantId: string) {
  return requestClient.get(`${basePath(tenantId)}/self/preview`)
}

// renderPublicBusinessCardApi reads the anonymous public BusinessCard view.
export function renderPublicBusinessCardApi(businessCardId: string) {
  return fetch(`/public-entry/public/business-cards/${businessCardId}`, {
    headers: { Accept: 'application/json' }
  }).then(async (response) => {
    if (!response.ok) return { state: 'PUBLIC_CARD_UNAVAILABLE' as const }
    const contentType = response.headers.get('content-type') ?? ''
    if (!contentType.includes('application/json')) {
      return { state: 'PUBLIC_CARD_UNAVAILABLE' as const }
    }
    return (await response.json()) as PublicEntryBusinessCardApi.PublicRenderResult
  }).catch(() => ({ state: 'PUBLIC_CARD_UNAVAILABLE' as const }))
}

// resolveBusinessCardVCardUrl returns the anonymous vCard download path.
export function resolveBusinessCardVCardUrl(businessCardId: string) {
  return `/public-entry/public/business-cards/${businessCardId}.vcf`
}
