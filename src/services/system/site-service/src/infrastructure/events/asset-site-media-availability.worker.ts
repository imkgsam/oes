import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { assertNatsTransport, decodeCloudEvent, NatsDurablePullRunner, NatsDurablePullWorker, type NatsPullDelivery, type OesEventContract } from '@oes/common'
import { AssetSiteMediaAvailabilityConsumer, AssetSiteMediaAvailabilityEvent } from './asset-site-media-availability.consumer'

const EVENT_TYPE = 'asset.site-media.availability.changed'
const EVENT_VERSION = 1
const EVENT_SUBJECT = 'oes.events.asset.site-media.availability.changed'
export const SITE_ASSET_MEDIA_AVAILABILITY_CONSUMER = 'site-service__asset-site-media__v1'

const contract: OesEventContract<Record<string, unknown>> = {
  eventType: EVENT_TYPE,
  eventVersion: EVENT_VERSION,
  ownerService: 'asset-service',
  validateData: (value): value is Record<string, unknown> => typeof value === 'object' && value !== null && typeof (value as { assetId?: unknown }).assetId === 'string' && Number.isInteger((value as { availabilityVersion?: unknown }).availabilityVersion)
}

/** AssetSiteMediaAvailabilityWorker consumes the exact Asset subject and settles only after Site inbox application. */
@Injectable()
export class AssetSiteMediaAvailabilityWorker implements OnModuleInit, OnModuleDestroy {
  private worker: NatsDurablePullWorker | undefined
  constructor(private readonly runner: NatsDurablePullRunner, private readonly consumer: AssetSiteMediaAvailabilityConsumer) {}
  onModuleInit(): void {
    this.worker = this.runner.start({ stream: 'OES_BUSINESS_EVENTS', consumer: SITE_ASSET_MEDIA_AVAILABILITY_CONSUMER, expiresMs: 1_000, handle: (delivery) => this.handle(delivery) })
  }
  async onModuleDestroy(): Promise<void> { await this.worker?.stop(); this.worker = undefined }
  private async handle(delivery: NatsPullDelivery): Promise<void> {
    try {
      if (delivery.subject !== EVENT_SUBJECT) throw new Error('ASSET_SITE_MEDIA_EVENT_SUBJECT_INVALID')
      const event = decodeCloudEvent(delivery.body, contract)
      assertNatsTransport({ subject: delivery.subject, headers: delivery.headers, event, contract })
      await this.consumer.consume(event as unknown as AssetSiteMediaAvailabilityEvent)
      await delivery.ack()
    } catch {
      await delivery.nak(Math.min(300_000, 1_000 * 2 ** Math.min(delivery.deliveryAttempt, 8)))
    }
  }
}
