import { SiteMediaRepository } from '../../domain/repositories/site-media.repository'
import { AssetDeliveryPurgePort } from '../../domain/ports/asset-delivery-purge.port'

/** SiteMediaLifecycleOperationWorker confirms precise purge through the same availability/outbox transaction or persists bounded retry state. */
export class SiteMediaLifecycleOperationWorker {
  constructor(private readonly repository: SiteMediaRepository, private readonly purge: AssetDeliveryPurgePort) {}
  async runOnce(now = new Date()): Promise<void> { for (const operation of await this.repository.claimDuePurgeOperations(now, 50)) { if (!operation.immutableTargetUrl) { await this.repository.schedulePurgeRetry(operation.operationId, operation.attempts + 1, new Date(now.getTime() + 60000), 'TARGET_MISSING'); continue } try { const result = await this.purge.purge({ url: operation.immutableTargetUrl }); if (!result.acknowledged) throw new Error('PROVIDER_UNCONFIRMED'); await this.repository.confirmTakedownWithEvent(operation.operationId, result.providerRequestId ?? '', now) } catch { const attempts = operation.attempts + 1; await this.repository.schedulePurgeRetry(operation.operationId, attempts, new Date(now.getTime() + Math.min(300000, 1000 * 2 ** attempts)), 'PROVIDER_FAILURE') } } }
}
