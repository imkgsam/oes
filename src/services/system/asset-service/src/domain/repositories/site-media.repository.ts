import { SiteMediaDeliveryBinding } from '../entities/site-media-delivery-binding.entity'
import { SiteMediaLifecycleOperation } from '../entities/site-media-lifecycle-operation.entity'

/** SiteMediaRecord is the typed persistence projection owned by Asset for one uploaded media asset. */
export interface SiteMediaRecord {
  readonly assetId: string
  readonly tenantId: string
  readonly siteId: string
  readonly ownerSubject: string
  readonly mediaKind: string
  readonly lifecycleStatus: string
  readonly deliveryStatus: string
  readonly storageKey: string
  readonly immutablePublicUrl: string | null
  readonly checksum: string
  readonly requestHash: string
  readonly size: number
  readonly contentType: string
  readonly availabilityVersion: string
  readonly protectedReferenceCount: number
  readonly createdAt: Date
}

/** SiteMediaListResult is the stable typed page returned by the Asset read model. */
export interface SiteMediaListResult {
  readonly assets: readonly SiteMediaRecord[]
  readonly nextPageToken: string
}

/** SiteMediaDeliveryStatus is the typed lifecycle projection used by status calls. */
export interface SiteMediaDeliveryStatus {
  readonly assetId: string
  readonly lifecycleStatus: string
  readonly deliveryStatus: string
  readonly availabilityVersion: string
  readonly lastOperationId: string
}

/** SiteMediaRepository isolates Site Media persistence and idempotency ownership. */
export interface SiteMediaRepository {
  findSiteMediaByUploadIdentity(input: { tenantId: string; siteId: string; idempotencyKey: string }): Promise<SiteMediaRecord | null>
  createSiteMediaAsset(input: {
    tenantId: string
    siteId: string
    ownerSubject: string
    mediaKind: string
    storageKey: string
    checksum: string
    size: number
    contentType: string
    idempotencyKey: string
    requestHash: string
  }): Promise<SiteMediaRecord>
  listAuthorizedMedia(input: { tenantId: string; siteId: string; ownerSubject: string; query?: string; mediaKindFilter?: string; includeArchived?: boolean; pageSize?: number; pageToken?: string }): Promise<SiteMediaListResult>
  resolveSiteMedia(input: { tenantId: string; siteId: string; assetId: string }): Promise<SiteMediaRecord | null>
  protectPublicationReferences(input: { tenantId: string; siteId: string; publishVersion: string; assetIds: readonly string[]; operationId: string }): Promise<readonly string[]>
  releasePublicationReferences(input: { tenantId: string; siteId: string; publishVersion: string; operationId: string }): Promise<readonly string[]>
  archiveSiteMedia(input: { tenantId: string; assetId: string; ownerSubject: string; operationId: string }): Promise<SiteMediaRecord>
  getImmutableDeliveryUrl(input: { tenantId: string; assetId: string }): Promise<string | null>
  getSiteMediaDeliveryStatus(input: { tenantId: string; assetId: string }): Promise<SiteMediaDeliveryStatus | null>
  deleteSiteMedia(input: { tenantId: string; assetId: string; ownerSubject: string; operationId: string }): Promise<{ operationId: string; deletionStatus: string }>
  findBinding(input: { tenantId: string; siteId: string }): Promise<SiteMediaDeliveryBinding | null>
  saveBinding(binding: SiteMediaDeliveryBinding): Promise<void>
  findOperation(input: { tenantId: string; assetId: string; idempotencyKey: string }): Promise<SiteMediaLifecycleOperation | null>
  saveOperation(operation: SiteMediaLifecycleOperation): Promise<void>
  claimDuePurgeOperations(now: Date, limit: number): Promise<readonly SiteMediaLifecycleOperation[]>
  acknowledgePurge(operationId: string, providerRequestId: string, confirmedAt: Date): Promise<void>
  schedulePurgeRetry(operationId: string, attempts: number, nextAttemptAt: Date, safeError: string): Promise<void>
}
