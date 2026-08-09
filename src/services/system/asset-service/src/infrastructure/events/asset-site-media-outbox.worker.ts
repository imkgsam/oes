import { AssetSiteMediaOutboxRelay } from './asset-site-media-outbox.relay'
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'

/** AssetSiteMediaOutboxWorker runs bounded relay ticks with fail-closed configuration and overlap prevention. */
@Injectable()
export class AssetSiteMediaOutboxWorker implements OnModuleInit, OnModuleDestroy {
  private timer: NodeJS.Timeout | undefined
  private inFlight = false
  private failures = 0
  private nextRunAt = 0
  constructor(private readonly relay: AssetSiteMediaOutboxRelay) {}
  async runOnce(): Promise<void> { await this.relay.relay() }
  onModuleInit(): void {
    const intervalMs = requiredInterval(process.env.ASSET_MEDIA_OUTBOX_INTERVAL_MS)
    this.timer = setInterval(() => { void this.tick(intervalMs) }, intervalMs)
    void this.tick(intervalMs)
  }
  async onModuleDestroy(): Promise<void> { if (this.timer) clearInterval(this.timer); this.timer = undefined }
  private async tick(intervalMs: number): Promise<void> {
    if (this.inFlight || Date.now() < this.nextRunAt) return
    this.inFlight = true
    try { await this.runOnce(); this.failures = 0; this.nextRunAt = Date.now() + intervalMs }
    catch { this.failures += 1; this.nextRunAt = Date.now() + Math.min(300_000, intervalMs * 2 ** Math.min(this.failures, 8)) }
    finally { this.inFlight = false }
  }
}

/** requiredInterval rejects missing or unsafe worker scheduling configuration. */
function requiredInterval(value: string | undefined): number {
  const interval = Number(value)
  if (!Number.isSafeInteger(interval) || interval < 100 || interval > 300_000) throw new Error('ASSET_MEDIA_OUTBOX_INTERVAL_REQUIRED')
  return interval
}
