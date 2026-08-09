import { PrismaAssetSiteMediaInboxRepository } from '../repositories/prisma-asset-site-media-inbox.repository'

const ASSET_SITE_MEDIA_AVAILABILITY_CHANGED = 'asset.site-media.availability.changed'
const ASSET_SITE_MEDIA_EVENT_VERSION = 1

/** AssetSiteMediaAvailabilityConsumer validates frozen CloudEvents before Site-local inbox application. */
export class AssetSiteMediaAvailabilityConsumer {
  constructor(private readonly inbox: PrismaAssetSiteMediaInboxRepository) {}
  async consume(event: any): Promise<'APPLIED' | 'DUPLICATE' | 'STALE_IGNORED'> {
    if (event?.specversion !== '1.0' || event?.type !== ASSET_SITE_MEDIA_AVAILABILITY_CHANGED || event?.oeseventversion !== ASSET_SITE_MEDIA_EVENT_VERSION || typeof event?.id !== 'string' || !event.id.trim() || typeof event?.oestenantid !== 'string' || !event.oestenantid.trim() || typeof event?.data?.assetId !== 'string' || !event.data.assetId.trim() || !Number.isInteger(event?.data?.availabilityVersion) || event.data.availabilityVersion < 1) throw new Error('ASSET_SITE_MEDIA_EVENT_INVALID')
    return this.inbox.receive(event)
  }
}
