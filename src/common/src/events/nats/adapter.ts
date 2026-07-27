import { EventContractError, decodeCloudEvent, digestCanonicalBody, type W3cTraceHeaders } from '../cloud-events/codec'
import type { OesCloudEvent, OesEventContract } from '../cloud-events/types'
import type { EventConsumeOutcome, EventPublishOutcome, EventTraceHook } from '../contracts/ports'
import { assertNatsTransport, toNatsPublishRequest, type EventHeaders } from './transport'

/** Is the narrow structural boundary implemented by the NATS client integration, not by application code. */
export interface JetStreamPublishClient {
  publish(request: { readonly subject: string; readonly headers: EventHeaders; readonly body: Uint8Array }): Promise<{ readonly stream: string; readonly sequence: number; readonly duplicate?: boolean }>
}

/** Is the narrow structural delivery boundary that avoids exposing NATS message objects to handlers. */
export interface JetStreamDelivery {
  readonly subject: string
  readonly headers: EventHeaders
  readonly body: Uint8Array
  readonly deliveryAttempt: number
  ack(): Promise<void>
  nak(delayMs?: number): Promise<void>
  term(): Promise<void>
}

/** Adapts NATS JetStream publish and delivery material into the provider-neutral common event API. */
export class NatsJetStreamAdapter {
  /** Creates an adapter with an injected NATS integration and optional non-business tracing hooks. */
  constructor(private readonly client: JetStreamPublishClient, private readonly traceHook?: EventTraceHook) {}

  /** Validates an immutable CloudEvent against its trusted owner contract before provider publish. */
  async publish<TData>(event: OesCloudEvent<TData>, contract: OesEventContract<TData>, traceHeaders?: W3cTraceHeaders): Promise<EventPublishOutcome> {
    let headers: EventHeaders = []
    try {
      const request = toNatsPublishRequest(event, contract, traceHeaders)
      headers = request.headers
      const ack = await this.client.publish(request)
      this.traceHook?.onPublish(traceContext(event, request.headers))
      return { kind: 'ACKNOWLEDGED', stream: ack.stream, sequence: ack.sequence, duplicate: ack.duplicate === true }
    } catch (error) {
      const outcome = normalizePublishFailure(error)
      if (outcome.kind !== 'ACKNOWLEDGED') this.traceHook?.onFailure?.(traceContext(event, headers), outcome.code)
      return outcome
    }
  }

  /** Decodes and validates a provider delivery before it reaches a service-owned typed handler. */
  decodeDelivery<TData>(delivery: JetStreamDelivery, contract: OesEventContract<TData>): { readonly event: OesCloudEvent<TData>; readonly bodyDigest: string; readonly deliveryAttempt: number } {
    const event = decodeCloudEvent(delivery.body, contract)
    assertNatsTransport({ subject: delivery.subject, headers: delivery.headers, event, contract })
    this.traceHook?.onConsume?.(traceContext(event, delivery.headers))
    return { event, bodyDigest: digestCanonicalBody(delivery.body), deliveryAttempt: delivery.deliveryAttempt }
  }

  /** Applies a typed handler outcome through explicit ACK, delayed NAK, or caller-owned durable DLQ transfer. */
  async settleDelivery(delivery: JetStreamDelivery, outcome: EventConsumeOutcome): Promise<'ACKED' | 'RETRY_SCHEDULED' | 'REQUIRES_DLQ'> {
    if (outcome.kind === 'APPLIED' || outcome.kind === 'DUPLICATE' || outcome.kind === 'STALE_IGNORED') {
      await delivery.ack()
      return 'ACKED'
    }
    if (outcome.kind === 'RETRYABLE_FAILURE') {
      await delivery.nak(outcome.delayMs)
      return 'RETRY_SCHEDULED'
    }
    return 'REQUIRES_DLQ'
  }
}

/** Classifies provider failures into the frozen relay outcome vocabulary without leaking transport errors. */
export function normalizePublishFailure(error: unknown): EventPublishOutcome {
  if (error instanceof EventContractError) return { kind: 'QUARANTINED_FAILURE', code: error.code, message: error.message }
  const code = errorCode(error)
  if (['MAX_PAYLOAD_EXCEEDED', 'PERMISSIONS_VIOLATION', 'BAD_REQUEST', 'INVALID_SUBJECT'].includes(code)) {
    return { kind: 'QUARANTINED_FAILURE', code, message: errorMessage(error) }
  }
  return { kind: 'RETRYABLE_FAILURE', code, message: errorMessage(error) }
}

/** Extracts trace headers without letting W3C context overwrite the OES trace identity. */
function traceContext(event: OesCloudEvent, headers: EventHeaders) {
  const header = (name: string) => headers.find(([key]) => key.toLowerCase() === name)?.[1]
  return {
    eventId: event.id,
    tenantId: event.oestenantid,
    traceId: event.oestraceid,
    traceparent: header('traceparent'),
    tracestate: header('tracestate'),
  }
}

/** Safely reads a provider error code for outcome normalization. */
function errorCode(error: unknown): string {
  return typeof error === 'object' && error !== null && typeof (error as { code?: unknown }).code === 'string' ? (error as { code: string }).code : 'EVENT_PUBLISH_FAILED'
}

/** Safely reads a provider error message without serializing credentials or stack traces. */
function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'event publish failed'
}
