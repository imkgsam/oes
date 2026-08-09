import { SiteMediaRepository } from '../../domain/repositories/site-media.repository'
import { AssetDeliveryPurgePort } from '../../domain/ports/asset-delivery-purge.port'
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'

/** SiteMediaLifecycleOperationWorker confirms precise purge through the same availability/outbox transaction or persists bounded retry state. */
@Injectable()
export class SiteMediaLifecycleOperationWorker implements OnModuleInit, OnModuleDestroy {
  private timer: NodeJS.Timeout | undefined
  private inFlight = false
  private failures = 0
  private nextRunAt = 0
  constructor(private readonly repository: SiteMediaRepository, private readonly purge: AssetDeliveryPurgePort) {}
  onModuleInit(): void { const interval = requiredInterval(process.env.ASSET_MEDIA_LIFECYCLE_INTERVAL_MS); this.timer = setInterval(() => { void this.tick(interval) }, interval); void this.tick(interval) }
  async onModuleDestroy(): Promise<void> { if (this.timer) clearInterval(this.timer); this.timer = undefined }
  async runOnce(now = new Date()): Promise<void> { for (const operation of await this.repository.claimDuePurgeOperations(now, 50)) { if (!operation.immutableTargetUrl) { await this.repository.schedulePurgeRetry(operation.operationId, operation.attempts + 1, new Date(now.getTime() + 60000), 'TARGET_MISSING'); continue } try { const result = await this.purge.purge({ url: operation.immutableTargetUrl }); if (!result.acknowledged) throw new Error('PROVIDER_UNCONFIRMED'); await this.repository.confirmTakedownWithEvent(operation.operationId, result.providerRequestId ?? '', now) } catch { const attempts = operation.attempts + 1; await this.repository.schedulePurgeRetry(operation.operationId, attempts, new Date(now.getTime() + Math.min(300000, 1000 * 2 ** attempts)), 'PROVIDER_FAILURE') } } }
  private async tick(interval: number): Promise<void> { if (this.inFlight || Date.now() < this.nextRunAt) return; this.inFlight = true; try { await this.runOnce(); this.failures = 0; this.nextRunAt = Date.now() + interval } catch { this.failures += 1; this.nextRunAt = Date.now() + Math.min(300_000, interval * 2 ** Math.min(this.failures, 8)) } finally { this.inFlight = false } }
}

/** requiredInterval rejects missing or unsafe lifecycle worker scheduling configuration. */
function requiredInterval(value: string | undefined): number { const interval = Number(value); if (!Number.isSafeInteger(interval) || interval < 100 || interval > 300_000) throw new Error('ASSET_MEDIA_LIFECYCLE_INTERVAL_REQUIRED'); return interval }
