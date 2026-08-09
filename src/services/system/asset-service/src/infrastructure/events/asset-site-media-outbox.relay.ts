import { AssetOutboxClaim, PrismaAssetSiteMediaOutboxStore } from './prisma-asset-site-media-outbox.store'
export interface AssetSiteMediaEventPublisher { publish(event: AssetOutboxClaim): Promise<void> }
/** AssetSiteMediaOutboxRelay publishes stored envelopes and schedules bounded retry after broker failure. */
export class AssetSiteMediaOutboxRelay {
  constructor(private readonly store: PrismaAssetSiteMediaOutboxStore, private readonly publisher: AssetSiteMediaEventPublisher) {}
  async relay(now = new Date()): Promise<void> { for (const event of await this.store.claim(now, 50)) { try { await this.publisher.publish(event); await this.store.acknowledge(event.eventId, now) } catch { const attempts = event.attempts + 1; await this.store.retry(event.eventId, attempts, new Date(now.getTime() + Math.min(300000, 1000 * 2 ** attempts))) } } }
}
