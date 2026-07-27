import { createHash } from 'node:crypto'

import type { CreateOesCloudEventInput, OesCloudEvent, OesEventContract } from './types'

/** Names the fixed CloudEvents media type required by the transport contract. */
export const CLOUD_EVENTS_CONTENT_TYPE = 'application/cloudevents+json' as const
/** Sets the frozen first-release maximum UTF-8 structured-event size. */
export const DEFAULT_EVENT_BODY_LIMIT_BYTES = 256 * 1024

/** Holds the optional W3C context that travels in transport headers while OES trace identity remains in the body. */
export interface W3cTraceHeaders {
  readonly traceparent?: string
  readonly tracestate?: string
}

/** Represents a deterministic validation rejection without transport-provider details. */
export class EventContractError extends Error {
  /** Creates an error whose code can be mapped to quarantine or consumer DLQ behavior. */
  constructor(readonly code: string, message = code) {
    super(message)
    this.name = 'EventContractError'
  }
}

/** Creates a canonical owner source URN from the contract service identity. */
export function sourceForOwner(ownerService: string): string {
  return `urn:oes:service:${ownerService}`
}

/** Creates the stable first-release data-schema identity for a contract version. */
export function dataSchemaForContract(contract: Pick<OesEventContract, 'eventType' | 'eventVersion'>): string {
  return `urn:oes:event:${contract.eventType}:v${contract.eventVersion}`
}

/** Maps a frozen business event type to its stable NATS business-event subject. */
export function subjectForEventType(eventType: string): string {
  return `oes.events.${eventType}`
}

/** Builds a complete immutable Structured CloudEvent before service-owned outbox persistence. */
export function createOesCloudEvent<TData>(input: CreateOesCloudEventInput<TData>): OesCloudEvent<TData> {
  assertContract(input.contract)
  assertNonBlank(input.eventId, 'EVENT_ID_REQUIRED')
  assertUtcTimestamp(input.occurredAt)
  assertNonBlank(input.tenantId, 'EVENT_TENANT_REQUIRED')
  assertNonBlank(input.aggregateType, 'EVENT_AGGREGATE_TYPE_REQUIRED')
  assertNonBlank(input.aggregateId, 'EVENT_AGGREGATE_ID_REQUIRED')
  assertNonBlank(input.traceId, 'EVENT_TRACE_REQUIRED')
  assertOptionalNonBlank(input.actorAccountId, 'EVENT_ACTOR_INVALID')
  assertOptionalNonBlank(input.causationId, 'EVENT_CAUSATION_INVALID')
  assertOptionalNonBlank(input.auditRef, 'EVENT_AUDIT_REF_INVALID')
  if (!input.contract.validateData(input.data)) {
    throw new EventContractError('EVENT_DATA_INVALID')
  }

  const event: OesCloudEvent<TData> = {
    specversion: '1.0',
    id: input.eventId,
    source: sourceForOwner(input.contract.ownerService),
    type: input.contract.eventType,
    subject: input.aggregateId,
    time: input.occurredAt,
    datacontenttype: 'application/json',
    dataschema: dataSchemaForContract(input.contract),
    oeseventversion: input.contract.eventVersion,
    oestenantid: input.tenantId,
    ...(input.orgId !== undefined ? { oesorgid: input.orgId } : {}),
    oesaggregatetype: input.aggregateType,
    oesaggregateid: input.aggregateId,
    oestraceid: input.traceId,
    ...(input.actorAccountId !== undefined ? { oesactoraccountid: input.actorAccountId } : {}),
    ...(input.correlationId !== undefined ? { oescorrelationid: input.correlationId } : {}),
    ...(input.causationId !== undefined ? { oescausationid: input.causationId } : {}),
    ...(input.auditRef !== undefined ? { oesauditref: input.auditRef } : {}),
    data: cloneJson(input.data),
  }
  assertWithinBodyLimit(event)
  return deepFreeze(event)
}

/** Encodes an immutable Structured CloudEvent and its exact required NATS transport headers. */
export function encodeCloudEvent(event: OesCloudEvent, traceHeaders: W3cTraceHeaders = {}): { readonly body: Uint8Array; readonly headers: readonly (readonly [string, string])[] } {
  const body = Buffer.from(JSON.stringify(event), 'utf8')
  if (body.byteLength > DEFAULT_EVENT_BODY_LIMIT_BYTES) {
    throw new EventContractError('EVENT_BODY_TOO_LARGE')
  }
  const headers: [string, string][] = [
    ['Nats-Msg-Id', event.id],
    ['Content-Type', CLOUD_EVENTS_CONTENT_TYPE],
    ['Oes-Transport-Version', '1'],
  ]
  appendW3cTraceHeaders(headers, traceHeaders)
  return {
    body,
    headers,
  }
}

/** Preserves valid W3C context in headers and rejects unpaired or malformed values rather than silently dropping them. */
function appendW3cTraceHeaders(headers: [string, string][], traceHeaders: W3cTraceHeaders): void {
  if (!traceHeaders.traceparent && !traceHeaders.tracestate) return
  if (!traceHeaders.traceparent || !/^\d{2}-[0-9a-f]{32}-[0-9a-f]{16}-[0-9a-f]{2}$/i.test(traceHeaders.traceparent)) {
    throw new EventContractError('EVENT_TRACEPARENT_INVALID')
  }
  headers.push(['traceparent', traceHeaders.traceparent])
  if (traceHeaders.tracestate) headers.push(['tracestate', traceHeaders.tracestate])
}

/** Decodes and validates a Structured CloudEvent against the exact owner-approved code contract. */
export function decodeCloudEvent<TData>(body: Uint8Array, contract: OesEventContract<TData>): OesCloudEvent<TData> {
  if (body.byteLength > DEFAULT_EVENT_BODY_LIMIT_BYTES) {
    throw new EventContractError('EVENT_BODY_TOO_LARGE')
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(Buffer.from(body).toString('utf8'))
  } catch {
    throw new EventContractError('EVENT_BODY_INVALID_JSON')
  }
  return validateCloudEvent(parsed, contract)
}

/** Validates all required envelope identities without modifying malformed wire input. */
export function validateCloudEvent<TData>(value: unknown, contract: OesEventContract<TData>): OesCloudEvent<TData> {
  assertContract(contract)
  if (!isRecord(value)) {
    throw new EventContractError('EVENT_ENVELOPE_INVALID')
  }
  const event = value as Partial<OesCloudEvent<TData>>
  if (event.specversion !== '1.0') throw new EventContractError('EVENT_SPECVERSION_UNSUPPORTED')
  if (event.type !== contract.eventType) throw new EventContractError('EVENT_TYPE_MISMATCH')
  if (event.oeseventversion !== contract.eventVersion) throw new EventContractError('EVENT_VERSION_UNSUPPORTED')
  if (event.source !== sourceForOwner(contract.ownerService)) throw new EventContractError('EVENT_OWNER_MISMATCH')
  if (event.dataschema !== dataSchemaForContract(contract)) throw new EventContractError('EVENT_DATASCHEMA_MISMATCH')
  if (event.datacontenttype !== 'application/json') throw new EventContractError('EVENT_DATACONTENTTYPE_INVALID')
  for (const [valueToCheck, code] of [
    [event.id, 'EVENT_ID_REQUIRED'], [event.subject, 'EVENT_SUBJECT_REQUIRED'], [event.time, 'EVENT_TIME_REQUIRED'],
    [event.oestenantid, 'EVENT_TENANT_REQUIRED'], [event.oesaggregatetype, 'EVENT_AGGREGATE_TYPE_REQUIRED'],
    [event.oesaggregateid, 'EVENT_AGGREGATE_ID_REQUIRED'], [event.oestraceid, 'EVENT_TRACE_REQUIRED'],
  ] as const) assertNonBlank(valueToCheck, code)
  assertOptionalNonBlank(event.oesactoraccountid, 'EVENT_ACTOR_INVALID')
  assertOptionalNonBlank(event.oescausationid, 'EVENT_CAUSATION_INVALID')
  assertOptionalNonBlank(event.oesauditref, 'EVENT_AUDIT_REF_INVALID')
  assertUtcTimestamp(event.time as string)
  if (event.subject !== event.oesaggregateid) throw new EventContractError('EVENT_AGGREGATE_SUBJECT_MISMATCH')
  if (!contract.validateData(event.data)) throw new EventContractError('EVENT_DATA_INVALID')
  return deepFreeze(cloneJson(event) as OesCloudEvent<TData>)
}

/** Produces the canonical body digest used by service-owned inbox identity comparisons. */
export function digestCanonicalBody(body: Uint8Array): string {
  return createHash('sha256').update(body).digest('hex')
}

/** Ensures contract descriptors are structurally safe before they are trusted by common infrastructure. */
function assertContract(contract: OesEventContract): void {
  assertNonBlank(contract?.eventType, 'EVENT_CONTRACT_TYPE_REQUIRED')
  assertNonBlank(contract?.ownerService, 'EVENT_CONTRACT_OWNER_REQUIRED')
  if (!Number.isInteger(contract?.eventVersion) || (contract?.eventVersion ?? 0) < 1) {
    throw new EventContractError('EVENT_CONTRACT_VERSION_INVALID')
  }
  if (typeof contract?.validateData !== 'function') throw new EventContractError('EVENT_CONTRACT_VALIDATOR_REQUIRED')
}

/** Rejects empty identities instead of inventing fallback metadata. */
function assertNonBlank(value: unknown, code: string): asserts value is string {
  if (typeof value !== 'string' || value.trim().length === 0) throw new EventContractError(code)
}

/** Validates supplied optional envelope attributes without inventing absent or null owner values. */
function assertOptionalNonBlank(value: unknown, code: string): void {
  if (value !== undefined && value !== null) assertNonBlank(value, code)
}

/** Enforces UTC RFC3339 timestamps so broker receive time cannot become event occurrence time. */
function assertUtcTimestamp(value: string): void {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value) || Number.isNaN(Date.parse(value))) {
    throw new EventContractError('EVENT_TIME_INVALID')
  }
}

/** Enforces the frozen body size limit at every codec boundary. */
function assertWithinBodyLimit(event: OesCloudEvent): void {
  if (Buffer.byteLength(JSON.stringify(event), 'utf8') > DEFAULT_EVENT_BODY_LIMIT_BYTES) {
    throw new EventContractError('EVENT_BODY_TOO_LARGE')
  }
}

/** Clones JSON data so the stored body cannot be mutated through a caller-owned reference. */
function cloneJson<T>(value: T): T {
  try {
    return JSON.parse(JSON.stringify(value)) as T
  } catch {
    throw new EventContractError('EVENT_DATA_NOT_JSON')
  }
}

/** Recursively freezes the event body and nested payload to preserve outbox immutability. */
function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child)
  }
  return value
}

/** Narrows unknown JSON parse output to an object record. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
