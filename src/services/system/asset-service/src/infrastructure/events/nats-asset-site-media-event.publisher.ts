import { NatsJetStreamPublisher, OesCloudEvent, OesEventContract } from '@oes/common/events'
import { AssetOutboxClaim } from './prisma-asset-site-media-outbox.store'

/** Publishes immutable Asset Site Media CloudEvents through the configured shared JetStream runtime. */
export class NatsAssetSiteMediaEventPublisher {
  constructor(private readonly publisher: NatsJetStreamPublisher) {}

  async publish(claim: AssetOutboxClaim): Promise<void> {
    if (!isCloudEvent(claim.payload)) throw new Error('ASSET_OUTBOX_ENVELOPE_INVALID')
    const contract: OesEventContract<Record<string, unknown>> = { eventType: claim.eventType, eventVersion: claim.payload.oeseventversion, ownerService: 'asset-service', validateData: isRecord }
    const outcome = await this.publisher.publish(claim.payload, contract)
    if (outcome.kind !== 'ACKNOWLEDGED') throw new Error(`ASSET_EVENT_BROKER_${outcome.kind}`)
  }
}

/** isRecord accepts only immutable JSON-object event data. */
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value) }

/** isCloudEvent rejects non-envelope outbox rows before they reach the broker. */
function isCloudEvent(value: unknown): value is OesCloudEvent<Record<string, unknown>> {
  return isRecord(value) && value.specversion === '1.0' && typeof value.id === 'string' && typeof value.type === 'string' && isRecord(value.data) && typeof value.oeseventversion === 'number'
}
