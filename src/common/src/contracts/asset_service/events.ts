/** Frozen Asset-owned Site Media availability event identity. */
export const ASSET_SITE_MEDIA_AVAILABILITY_CHANGED = 'asset.site-media.availability.changed' as const
export const ASSET_SITE_MEDIA_EVENT_VERSION = 1 as const

export type AssetSiteMediaAvailabilityChangedData = Readonly<{ assetId: string; mediaKind: string; lifecycleStatus: string; deliveryStatus: string; availabilityVersion: number; changeReasonCode: string; operationId?: string }>
export type AssetSiteMediaAvailabilityChangedEvent = Readonly<{ specversion: '1.0'; id: string; source: 'urn:oes:service:asset-service'; type: typeof ASSET_SITE_MEDIA_AVAILABILITY_CHANGED; subject: string; time: string; oeseventversion: typeof ASSET_SITE_MEDIA_EVENT_VERSION; oestenantid: string; data: AssetSiteMediaAvailabilityChangedData }>

/** Builds the immutable structured CloudEvent persisted in the Asset outbox. */
export function createAssetSiteMediaAvailabilityEvent(input: Omit<AssetSiteMediaAvailabilityChangedEvent, 'specversion' | 'source' | 'type' | 'subject' | 'oeseventversion'>): AssetSiteMediaAvailabilityChangedEvent {
  return Object.freeze({ ...input, specversion: '1.0', source: 'urn:oes:service:asset-service', type: ASSET_SITE_MEDIA_AVAILABILITY_CHANGED, subject: input.data.assetId, oeseventversion: ASSET_SITE_MEDIA_EVENT_VERSION })
}
