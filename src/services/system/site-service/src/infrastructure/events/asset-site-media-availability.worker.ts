import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { createHash } from 'node:crypto'
import { assertNatsTransport, decodeCloudEvent, NatsDurablePullRunner, NatsDurablePullWorker, type NatsPullDelivery, type OesEventContract } from '@oes/common'
import { AssetSiteMediaAvailabilityConsumer, AssetSiteMediaAvailabilityEvent } from './asset-site-media-availability.consumer'
import { PrismaAssetSiteMediaInboxRepository } from '../repositories/prisma-asset-site-media-inbox.repository'

const EVENT_TYPE = 'asset.site-media.availability.changed'
const EVENT_VERSION = 1
const EVENT_SUBJECT = 'oes.events.asset.site-media.availability.changed'
const MAX_DELIVERY_ATTEMPTS = 5
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
  constructor(private readonly runner: NatsDurablePullRunner, private readonly consumer: AssetSiteMediaAvailabilityConsumer, private readonly inbox: PrismaAssetSiteMediaInboxRepository) {}
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
    } catch (error) {
      if (delivery.deliveryAttempt >= MAX_DELIVERY_ATTEMPTS) {
        try {
          await this.inbox.recordTerminalFailure(terminalFailure(delivery, error))
          await delivery.ack()
          return
        } catch { /* A failed DLQ write leaves the source delivery retryable. */ }
      }
      await delivery.nak(Math.min(300_000, 1_000 * 2 ** Math.min(delivery.deliveryAttempt, 8)))
    }
  }
}

/** terminalFailure creates a stable consumer-owned DLQ record from an immutable source delivery. */
function terminalFailure(delivery: NatsPullDelivery, error: unknown): { eventId: string; bodyDigest: string; retryCount: number; safeError: string; envelope: unknown } {
  const bytes = Buffer.from(delivery.body)
  const body = bytes.toString('utf8')
  let envelope: unknown = { rawBase64: bytes.toString('base64') }
  let eventId = createHash('sha256').update(bytes).digest('hex')
  try { const parsed = JSON.parse(body) as { id?: unknown }; envelope = parsed; if (typeof parsed.id === 'string' && parsed.id) eventId = parsed.id } catch { /* malformed raw bytes retain a deterministic synthetic identity */ }
  return { eventId, bodyDigest: createHash('sha256').update(bytes).digest('hex'), retryCount: delivery.deliveryAttempt, safeError: error instanceof Error && /^[A-Z0-9_]+$/u.test(error.message) ? error.message : 'ASSET_SITE_MEDIA_EVENT_PROCESSING_FAILED', envelope }
}
