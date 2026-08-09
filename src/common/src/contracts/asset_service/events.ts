import { createOesCloudEvent, OesCloudEvent, OesEventContract } from '../../events'

/** Frozen Asset-owned Site Media availability event identity. */
export const ASSET_SITE_MEDIA_AVAILABILITY_CHANGED = 'asset.site-media.availability.changed' as const
export const ASSET_SITE_MEDIA_EVENT_VERSION = 1 as const

export type AssetSiteMediaAvailabilityChangedData = Readonly<{ assetId: string; mediaKind: string; lifecycleStatus: string; deliveryStatus: string; availabilityVersion: number; changeReasonCode: string; operationId?: string }>
export type AssetSiteMediaAvailabilityChangedEvent = OesCloudEvent<AssetSiteMediaAvailabilityChangedData> & Readonly<{ source: 'urn:oes:service:asset-service'; type: typeof ASSET_SITE_MEDIA_AVAILABILITY_CHANGED; oeseventversion: typeof ASSET_SITE_MEDIA_EVENT_VERSION }>

const ASSET_SITE_MEDIA_AVAILABILITY_CONTRACT: OesEventContract<AssetSiteMediaAvailabilityChangedData> = {
  eventType: ASSET_SITE_MEDIA_AVAILABILITY_CHANGED,
  eventVersion: ASSET_SITE_MEDIA_EVENT_VERSION,
  ownerService: 'asset-service',
  validateData: (value): value is AssetSiteMediaAvailabilityChangedData => typeof value === 'object' && value !== null && typeof (value as { assetId?: unknown }).assetId === 'string' && typeof (value as { availabilityVersion?: unknown }).availabilityVersion === 'number'
}

/** Builds the immutable structured CloudEvent persisted in the Asset outbox. */
export function createAssetSiteMediaAvailabilityEvent(input: Readonly<{ id: string; time: string; oestenantid: string; traceId: string; data: AssetSiteMediaAvailabilityChangedData }>): AssetSiteMediaAvailabilityChangedEvent {
  return createOesCloudEvent({
    contract: ASSET_SITE_MEDIA_AVAILABILITY_CONTRACT,
    eventId: input.id,
    occurredAt: input.time,
    tenantId: input.oestenantid,
    aggregateType: 'SITE_MEDIA_ASSET',
    aggregateId: input.data.assetId,
    traceId: input.traceId,
    data: input.data
  }) as AssetSiteMediaAvailabilityChangedEvent
}
