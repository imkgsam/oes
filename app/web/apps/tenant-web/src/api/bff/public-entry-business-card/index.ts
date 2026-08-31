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
  export type ContactAssetType =
    | 'EXTERNAL_COMMUNICATION_ACCOUNT'
    | 'OTHER_SOCIAL'
    | 'WECHAT'
    | 'WHATSAPP'
    | 'WORK_EMAIL'
    | 'WORK_PHONE'

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

  export interface PublicRenderEnvelope {
    data?: PublicRenderResult
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

  export interface ContactAssetCandidate {
    contactAssetId: string
    displayLabel: string
    displayValue: string
    isPrimary: boolean
    ownership: string
    provider?: null | string
    status: string
    type: ContactAssetType
  }

  export interface ContactAssetCandidateResult {
    assets: ContactAssetCandidate[]
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

// listBusinessCardsApi lists tenant-scoped BusinessCards with optional employee narrowing.
export function listBusinessCardsApi(
  tenantId: string,
  query?: { employeeId?: string; page?: number; pageSize?: number }
) {
  return requestClient.get<PublicEntryBusinessCardApi.ListResult>(basePath(tenantId), {
    params: query
  })
}

// getBusinessCardDetailApi loads one BusinessCard detail and readiness diagnostics.
export function getBusinessCardDetailApi(tenantId: string, businessCardId: string) {
  return requestClient.get<PublicEntryBusinessCardApi.DetailResult>(
    `${basePath(tenantId)}/${businessCardId}`
  )
}

// listBusinessCardContactAssetCandidatesApi reads identity-owned Contact Asset refs for the management picker.
export function listBusinessCardContactAssetCandidatesApi(tenantId: string, employeeId: string) {
  return requestClient.get<PublicEntryBusinessCardApi.ContactAssetCandidateResult>(
    `${basePath(tenantId)}/contact-assets`,
    { params: { employeeId } }
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
  })
    .then(async (response) => {
      const contentType = response.headers.get('content-type') ?? ''
      if (!contentType.includes('application/json')) {
        return { state: 'PUBLIC_CARD_UNAVAILABLE' as const }
      }
      return normalizePublicRenderResponse(await response.json())
    })
    .catch(() => ({ state: 'PUBLIC_CARD_UNAVAILABLE' as const }))
}

// normalizePublicRenderResponse accepts both direct service payloads and gateway response envelopes.
function normalizePublicRenderResponse(
  payload: unknown
): PublicEntryBusinessCardApi.PublicRenderResult {
  const envelope = payload as PublicEntryBusinessCardApi.PublicRenderEnvelope
  const result = envelope.data ?? (payload as PublicEntryBusinessCardApi.PublicRenderResult)
  if (result?.state === 'PUBLIC_CARD_NOT_FOUND' || result?.state === 'PUBLIC_CARD_UNAVAILABLE') {
    return { state: result.state }
  }
  if (result?.state === 'AVAILABLE') {
    const view = normalizePublicView(result.view)
    return view ? { state: 'AVAILABLE', view } : { state: 'PUBLIC_CARD_UNAVAILABLE' }
  }
  return { state: 'PUBLIC_CARD_UNAVAILABLE' }
}

// normalizePublicView copies only anonymous contract fields and drops any management or upstream source fields.
function normalizePublicView(value: unknown): PublicEntryBusinessCardApi.PublicView | undefined {
  if (!isRecord(value) || !isRecord(value.person) || !isRecord(value.company)) return undefined
  const businessCardId = requiredString(value.businessCardId)
  const templateKey = requiredString(value.templateKey)
  const displayName = requiredString(value.person.displayName)
  const companyDisplayName = stringValue(value.company.companyDisplayName)
  if (!businessCardId || !templateKey || !displayName || companyDisplayName === undefined)
    return undefined

  return {
    businessCardId,
    templateKey,
    person: {
      displayName,
      ...optionalStringField('englishName', value.person.englishName),
      ...optionalStringField('title', value.person.title),
      ...optionalStringField('department', value.person.department),
      ...optionalStringField('officialPhotoUrl', value.person.officialPhotoUrl)
    },
    company: {
      companyDisplayName,
      ...optionalStringField('logoUrl', value.company.logoUrl),
      ...optionalStringField('websiteUrl', value.company.websiteUrl)
    },
    contactActions: Array.isArray(value.contactActions)
      ? value.contactActions.flatMap((action) => normalizePublicAction(action, businessCardId))
      : [],
    ...optionalStringField('publicUrl', value.publicUrl)
  }
}

// normalizePublicAction admits only supported action types and display fields from the public contract.
function normalizePublicAction(
  value: unknown,
  businessCardId: string
): PublicEntryBusinessCardApi.PublicView['contactActions'] {
  if (!isRecord(value)) return []
  const contactActionType = value.contactActionType
  const displayOrder = value.displayOrder
  if (
    !PUBLIC_ACTION_TYPES.has(contactActionType as PublicEntryBusinessCardApi.ActionType) ||
    typeof displayOrder !== 'number' ||
    !Number.isFinite(displayOrder)
  )
    return []
  return [
    {
      contactActionType: contactActionType as PublicEntryBusinessCardApi.ActionType,
      displayOrder,
      ...optionalStringField('displayValue', value.displayValue),
      ...(contactActionType === 'SAVE_VCARD'
        ? { actionUrl: resolveBusinessCardVCardUrl(businessCardId) }
        : optionalStringField('actionUrl', value.actionUrl))
    }
  ]
}

const PUBLIC_ACTION_TYPES = new Set<PublicEntryBusinessCardApi.ActionType>([
  'ADD_WECHAT',
  'CALL_PHONE',
  'OPEN_COMPANY_WEBSITE',
  'OPEN_WHATSAPP',
  'SAVE_VCARD',
  'SEND_EMAIL'
])

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function requiredString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function optionalStringField<Key extends string>(
  key: Key,
  value: unknown
): Partial<Record<Key, string>> {
  return typeof value === 'string' && value.trim() ? ({ [key]: value } as Record<Key, string>) : {}
}

// resolveBusinessCardVCardUrl returns the anonymous vCard download path.
export function resolveBusinessCardVCardUrl(businessCardId: string) {
  return `/public-entry/public/business-cards/${encodeURIComponent(businessCardId)}.vcf`
}
