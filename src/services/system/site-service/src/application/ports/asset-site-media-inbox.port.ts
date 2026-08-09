type AssetSiteMediaAvailabilityChangedEvent = Readonly<{ id: string; oestenantid: string; data: { assetId: string; availabilityVersion: number; lifecycleStatus: string; deliveryStatus: string } }>

/** AssetSiteMediaInboxPort owns durable Site-local dedupe and ordered availability projection application. */
export interface AssetSiteMediaInboxPort {
  receive(event: AssetSiteMediaAvailabilityChangedEvent): Promise<'APPLIED' | 'DUPLICATE' | 'STALE_IGNORED'>
}
