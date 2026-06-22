import { requestClient } from '#/api/request'

export namespace PublicEntryShortLinkApi {
  export type TargetKind = 'EXTERNAL_URL' | 'INTERNAL_REF'
  export type Status = 'ACTIVE' | 'ARCHIVED' | 'DISABLED'

  export interface ShortLinkTarget {
    targetKind: TargetKind
    targetResourceId?: string
    targetType?: string
    targetUrl?: string
  }

  export interface ShortLinkRecord {
    campaignRef?: string
    createdAt: string
    createdBy?: string
    displayName: string
    entryPurpose: string
    expiresAt?: string
    id: string
    publicUrl: string
    shortCode: string
    sourcePlacement: string
    status: Status
    targetKind: TargetKind
    targetResourceId?: string
    targetType?: string
    targetUrl?: string
    tenantId: string
    updatedAt: string
    updatedBy?: string
  }

  export interface CreatePayload {
    campaignRef?: string
    displayName: string
    entryPurpose: string
    expiresAt?: string
    sourcePlacement: string
    target: ShortLinkTarget
  }

  export interface CreateResult {
    shortLink: ShortLinkRecord
  }

  export interface ListByTargetQuery {
    page?: number
    pageSize?: number
    targetResourceId: string
    targetType: string
  }

  export interface ListByTargetResult {
    items: ShortLinkRecord[]
    page: number
    pageSize: number
    total: number
  }

  export interface ListQuery {
    page?: number
    pageSize?: number
    targetKind?: 'ALL' | TargetKind
    targetType?: string
  }

  export interface ListResult {
    items: ShortLinkRecord[]
    page: number
    pageSize: number
    total: number
  }

  export interface UpdateTargetPayload {
    reason?: string
    target: ShortLinkTarget
  }

  export interface UpdateMetadataPayload {
    campaignRef?: string
    displayName?: string
    entryPurpose?: string
    expiresAt?: string
    sourcePlacement?: string
  }

  export interface ChangeStatusPayload {
    reason?: string
    targetStatus: Status
  }

  export interface CountBucket {
    count: number
    key: string
  }

  export interface StatsResult {
    byDetectedChannel: CountBucket[]
    byDeviceType: CountBucket[]
    byReferrer: CountBucket[]
    byResultStatus: CountBucket[]
    lastVisitedAt?: string
    shortLinkId: string
    totalVisits: number
  }

  export interface QrResult {
    content: string
    format: 'PNG'
    imageBase64: string
    shortLinkId: string
  }
}

const basePath = (tenantId: string) => `/public-entry/tenants/${tenantId}/short-links`

// createPublicEntryShortLinkApi creates a tenant-scoped ShortLink through the admin BFF.
export function createPublicEntryShortLinkApi(
  tenantId: string,
  payload: PublicEntryShortLinkApi.CreatePayload
) {
  return requestClient.post<PublicEntryShortLinkApi.CreateResult>(basePath(tenantId), payload)
}

// getPublicEntryShortLinkApi reads one tenant-scoped ShortLink detail.
export function getPublicEntryShortLinkApi(tenantId: string, shortLinkId: string) {
  return requestClient.get<{ shortLink: PublicEntryShortLinkApi.ShortLinkRecord }>(
    `${basePath(tenantId)}/${shortLinkId}`
  )
}

// listPublicEntryShortLinksApi lists tenant ShortLinks without requiring a target resource id.
export function listPublicEntryShortLinksApi(
  tenantId: string,
  query: PublicEntryShortLinkApi.ListQuery = {}
) {
  const { targetKind, ...rest } = query
  return requestClient.get<PublicEntryShortLinkApi.ListResult>(basePath(tenantId), {
    params: {
      ...rest,
      targetKind: targetKind === 'ALL' ? undefined : targetKind
    }
  })
}

// listPublicEntryShortLinksByTargetApi lists ShortLinks attached to one internal target reference.
export function listPublicEntryShortLinksByTargetApi(
  tenantId: string,
  query: PublicEntryShortLinkApi.ListByTargetQuery
) {
  return requestClient.get<PublicEntryShortLinkApi.ListByTargetResult>(
    `${basePath(tenantId)}/by-target`,
    {
      params: query
    }
  )
}

// updatePublicEntryShortLinkTargetApi migrates one ShortLink target without changing publicUrl.
export function updatePublicEntryShortLinkTargetApi(
  tenantId: string,
  shortLinkId: string,
  payload: PublicEntryShortLinkApi.UpdateTargetPayload
) {
  return requestClient.post(`${basePath(tenantId)}/${shortLinkId}/target`, payload)
}

// updatePublicEntryShortLinkMetadataApi updates ShortLink display metadata and expiry fields.
export function updatePublicEntryShortLinkMetadataApi(
  tenantId: string,
  shortLinkId: string,
  payload: PublicEntryShortLinkApi.UpdateMetadataPayload
) {
  return requestClient.post(`${basePath(tenantId)}/${shortLinkId}/metadata`, payload)
}

// changePublicEntryShortLinkStatusApi changes ShortLink lifecycle status.
export function changePublicEntryShortLinkStatusApi(
  tenantId: string,
  shortLinkId: string,
  payload: PublicEntryShortLinkApi.ChangeStatusPayload
) {
  return requestClient.post(`${basePath(tenantId)}/${shortLinkId}/status`, payload)
}

// getPublicEntryShortLinkStatsApi reads VisitEvent-derived aggregate statistics.
export function getPublicEntryShortLinkStatsApi(
  tenantId: string,
  shortLinkId: string,
  query?: { from?: string; to?: string }
) {
  return requestClient.get<PublicEntryShortLinkApi.StatsResult>(
    `${basePath(tenantId)}/${shortLinkId}/stats`,
    {
      params: query
    }
  )
}

// getPublicEntryShortLinkQrApi reads the base64 QR payload for preview.
export function getPublicEntryShortLinkQrApi(tenantId: string, shortLinkId: string) {
  return requestClient.get<PublicEntryShortLinkApi.QrResult>(
    `${basePath(tenantId)}/${shortLinkId}/qr`
  )
}

// resolvePublicEntryShortLinkQrDownloadUrl returns the direct PNG download path for browser download.
export function resolvePublicEntryShortLinkQrDownloadUrl(tenantId: string, shortLinkId: string) {
  return `${basePath(tenantId)}/${shortLinkId}/qr.png`
}
