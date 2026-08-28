import { Injectable } from '@nestjs/common'
import {
  NatsConsumerDlqBinding,
  createDlqRecord,
  type NatsPullDelivery,
  type OesCloudEvent
} from '@oes/common'
import type { NotificationEventDlqPort } from './collaboration-task-event.consumer'

/** Transfers a Notification consumer failure to its exact DLQ before the shared runtime can terminate the source delivery. */
@Injectable()
export class NotificationEventDlqTransfer implements NotificationEventDlqPort {
  /** Creates the service-owned binding with the shared ACL-scoped NATS runtime. */
  constructor(private readonly binding: NatsConsumerDlqBinding) {}

  /** Builds the deterministic immutable DLQ record from a durable delivery and delegates publish-before-TERM to common. */
  async transfer(input: {
    readonly delivery: NatsPullDelivery
    readonly event?: OesCloudEvent
    readonly errorClass: 'NON_RETRYABLE' | 'EVENT_ID_CONFLICT'
    readonly code: string
  }): Promise<{ readonly kind: 'TERMINATED' | 'DLQ_RETRY_REQUIRED' }> {
    const event = input.event ?? extractEnvelopeForDlq(input.delivery.body)
    if (!event) return { kind: 'DLQ_RETRY_REQUIRED' }
    return this.binding.transfer(
      createDlqRecord({
        consumerName: 'notification-service__collaboration-task__v1',
        event,
        original: {
          subject: input.delivery.subject,
          headers: input.delivery.headers,
          body: input.delivery.body
        },
        errorClass: input.errorClass,
        stableErrorCode: input.code,
        sanitizedErrorSummary: input.code,
        deliveryAttempts: input.delivery.deliveryAttempt,
        firstFailedAt: new Date().toISOString(),
        lastFailedAt: new Date().toISOString(),
        streamSequence: input.delivery.metadata.streamSequence,
        consumerSequence: input.delivery.metadata.consumerSequence
      }),
      input.delivery
    )
  }
}

/** Extracts only a JSON envelope for immutable DLQ preservation when contract decoding has already failed closed. */
function extractEnvelopeForDlq(body: Uint8Array): OesCloudEvent | undefined {
  try {
    const value: unknown = JSON.parse(Buffer.from(body).toString('utf8'))
    if (!hasOriginalDlqIdentity(value)) return undefined
    return value as OesCloudEvent
  } catch {
    return undefined
  }
}

/** Requires every original identity field consumed by the immutable DLQ record without inventing defaults. */
function hasOriginalDlqIdentity(value: unknown): value is OesCloudEvent {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  const event = value as Record<string, unknown>
  return (
    isNonBlank(event.id) &&
    isNonBlank(event.source) &&
    isNonBlank(event.type) &&
    isNonBlank(event.time) &&
    Number.isSafeInteger(event.oeseventversion) &&
    (event.oeseventversion as number) > 0 &&
    isNonBlank(event.oestenantid) &&
    isNonBlank(event.oestraceid)
  )
}

/** Recognizes one supplied nonblank string while preserving the original value byte-for-byte. */
function isNonBlank(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}
