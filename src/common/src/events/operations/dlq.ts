import { createHash } from 'node:crypto'

import type { OesCloudEvent, ImmutableEventMessage } from '../cloud-events/types'
import type { EventPublishOutcome } from '../contracts/ports'

/** Represents the immutable failure snapshot persisted on a consumer-specific DLQ subject. */
export interface DlqRecord {
  readonly dlqRecordId: string
  readonly consumerName: string
  readonly subscriptionConfigVersion: number
  readonly eventId: string
  readonly tenantId?: string
  readonly eventType: string
  readonly eventVersion: number
  readonly traceId: string
  readonly streamSequence: number
  readonly consumerSequence: number
  readonly errorClass: 'NON_RETRYABLE' | 'EVENT_ID_CONFLICT'
  readonly stableErrorCode: string
  readonly sanitizedErrorSummary: string
  readonly deliveryAttempts: number
  readonly firstFailedAt: string
  readonly lastFailedAt: string
  readonly original: ImmutableEventMessage
}

/** Supplies the inputs required to create one deterministic immutable DLQ transfer record. */
export interface CreateDlqRecordInput {
  readonly consumerName: string
  readonly event: OesCloudEvent
  readonly original: ImmutableEventMessage
  readonly errorClass: DlqRecord['errorClass']
  readonly stableErrorCode: string
  readonly sanitizedErrorSummary: string
  readonly deliveryAttempts: number
  readonly firstFailedAt: string
  readonly lastFailedAt: string
  readonly streamSequence: number
  readonly consumerSequence: number
}

/** Builds a deterministic DLQ record from an immutable original body without consumer mutable resolution state. */
export function createDlqRecord(input: CreateDlqRecordInput): DlqRecord {
  const parsed = parseConsumerName(input.consumerName)
  return Object.freeze({
    dlqRecordId: createDlqRecordId(input.consumerName, parsed.version, input.event.id),
    consumerName: input.consumerName,
    subscriptionConfigVersion: parsed.version,
    eventId: input.event.id,
    tenantId: input.event.oestenantid,
    eventType: input.event.type,
    eventVersion: input.event.oeseventversion,
    traceId: input.event.oestraceid,
    streamSequence: input.streamSequence,
    consumerSequence: input.consumerSequence,
    errorClass: input.errorClass,
    stableErrorCode: input.stableErrorCode,
    sanitizedErrorSummary: sanitizeSummary(input.sanitizedErrorSummary),
    deliveryAttempts: input.deliveryAttempts,
    firstFailedAt: input.firstFailedAt,
    lastFailedAt: input.lastFailedAt,
    original: Object.freeze({ ...input.original, headers: Object.freeze([...input.original.headers]), body: new Uint8Array(input.original.body) }),
  })
}

/** Creates the stable consumer/config/event idempotency key required by the DLQ contract. */
export function createDlqRecordId(consumerName: string, subscriptionConfigVersion: number, eventId: string): string {
  return `dlq_${createHash('sha256').update(`${consumerName}|${subscriptionConfigVersion}|${eventId}`).digest('hex')}`
}

/** Maps a frozen durable consumer name to its exclusive DLQ subject. */
export function dlqSubjectForConsumer(consumerName: string): string {
  const parsed = parseConsumerName(consumerName)
  return `oes.dlq.${parsed.service}.${parsed.purpose}.v${parsed.version}`
}

/** Publishes the immutable DLQ record before terminating original delivery so failures cannot disappear. */
export async function transferToDlqThenTerm(input: {
  readonly record: DlqRecord
  readonly publishDlq: (record: DlqRecord, subject: string) => Promise<EventPublishOutcome>
  readonly term: () => Promise<void>
}): Promise<{ readonly kind: 'TERMINATED' } | { readonly kind: 'DLQ_RETRY_REQUIRED'; readonly outcome: EventPublishOutcome }> {
  const outcome = await input.publishDlq(input.record, dlqSubjectForConsumer(input.record.consumerName))
  if (outcome.kind !== 'ACKNOWLEDGED') return { kind: 'DLQ_RETRY_REQUIRED', outcome }
  await input.term()
  return { kind: 'TERMINATED' }
}

/** Parses only the frozen durable consumer format and rejects accidental global or ambiguous DLQ names. */
function parseConsumerName(consumerName: string): { readonly service: string; readonly purpose: string; readonly version: number } {
  const match = /^([a-z0-9-]+)__([a-z0-9-]+)__v([1-9]\d*)$/.exec(consumerName)
  if (!match) throw new Error('DLQ_CONSUMER_NAME_INVALID')
  return { service: match[1], purpose: match[2], version: Number(match[3]) }
}

/** Removes multiline and oversized diagnostic content before it can become ungoverned DLQ sensitive data. */
function sanitizeSummary(value: string): string {
  return value.replace(/[\r\n]+/g, ' ').slice(0, 512)
}
