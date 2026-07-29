import type { OesCloudEvent } from '../cloud-events/types'

/** Defines the normalized result returned to service-owned outbox relays after a provider publish attempt. */
export type EventPublishOutcome =
  | { readonly kind: 'ACKNOWLEDGED'; readonly stream: string; readonly sequence: number; readonly duplicate: boolean }
  | { readonly kind: 'RETRYABLE_FAILURE'; readonly code: string; readonly message: string }
  | { readonly kind: 'QUARANTINED_FAILURE'; readonly code: string; readonly message: string }

/** Defines the only handler outcomes that a service-owned consumer can return to the transport adapter. */
export type EventConsumeOutcome =
  | { readonly kind: 'APPLIED' }
  | { readonly kind: 'DUPLICATE' }
  | { readonly kind: 'STALE_IGNORED' }
  | { readonly kind: 'RETRYABLE_FAILURE'; readonly code: string; readonly delayMs?: number }
  | { readonly kind: 'NON_RETRYABLE_FAILURE'; readonly code: string }
  | { readonly kind: 'EVENT_ID_CONFLICT'; readonly code: string }

/** Defines the service-owned persistence seam for immutable outbox rows without prescribing a database. */
export interface EventOutboxPort {
  append(event: OesCloudEvent): Promise<void>
}

/** Defines the service-owned local transaction seam for Inbox identity and local side effects. */
export interface EventInboxPort {
  apply(event: OesCloudEvent, identity: EventInboxIdentity): Promise<EventConsumeOutcome>
}

/** Carries the immutable identity tuple and canonical-body digest required for inbox duplicate handling. */
export interface EventInboxIdentity {
  readonly consumerName: string
  readonly eventId: string
  readonly tenantId?: string
  readonly identityTuple: readonly (string | number | undefined)[]
  readonly canonicalBodyDigest: string
  readonly eventType: string
  readonly eventVersion: number
  readonly traceId: string
}

/** Provides provider-neutral trace metadata to service-owned relay and consumer observability hooks. */
export interface EventTransportTraceContext {
  readonly eventId: string
  readonly tenantId?: string
  readonly traceId: string
  readonly traceparent?: string
  readonly tracestate?: string
}

/** Receives non-business tracing lifecycle observations without altering CloudEvent identity. */
export interface EventTraceHook {
  onPublish?(context: EventTransportTraceContext): void
  onConsume?(context: EventTransportTraceContext): void
  onFailure?(context: EventTransportTraceContext, code: string): void
}

/** Defines the typed business-handler seam while keeping providers and delivery implementations private. */
export interface EventConsumer<TData> {
  handle(event: OesCloudEvent<TData>, context: Readonly<EventTransportTraceContext>): Promise<EventConsumeOutcome>
}
