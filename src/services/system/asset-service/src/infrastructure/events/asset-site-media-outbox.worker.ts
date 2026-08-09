import { AssetSiteMediaOutboxRelay } from './asset-site-media-outbox.relay'
/** AssetSiteMediaOutboxWorker runs bounded relay batches without acknowledging unpublished events. */
export class AssetSiteMediaOutboxWorker { constructor(private readonly relay: AssetSiteMediaOutboxRelay) {} async runOnce(): Promise<void> { await this.relay.relay() } }
