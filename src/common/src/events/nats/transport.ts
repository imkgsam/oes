import { CLOUD_EVENTS_CONTENT_TYPE, EventContractError, encodeCloudEvent, subjectForEventType, validateCloudEvent, type W3cTraceHeaders } from '../cloud-events/codec'
import type { OesCloudEvent, OesEventContract } from '../cloud-events/types'

/** Represents the provider-neutral header form required by the NATS adapter boundary. */
export type EventHeaders = readonly (readonly [string, string])[]

/** Captures transport material delivered by a provider without exposing provider client types to handlers. */
export interface NatsTransportInput<TData> {
  readonly subject: string
  readonly headers: EventHeaders
  readonly event: OesCloudEvent<TData>
  readonly contract: OesEventContract<TData>
}

/** States whether transport input is safe to publish or consume under the frozen mapping. */
export type TransportValidation = { readonly ok: true } | { readonly ok: false; readonly code: string }

/** Validates exact subject/header/envelope consistency and never repairs a conflicting transport message. */
export function validateNatsTransport<TData>(input: NatsTransportInput<TData>): TransportValidation {
  if (input.subject !== subjectForEventType(input.event.type)) return { ok: false, code: 'EVENT_SUBJECT_MISMATCH' }
  if (input.event.type !== input.contract.eventType) return { ok: false, code: 'EVENT_TYPE_MISMATCH' }
  if (input.event.oeseventversion !== input.contract.eventVersion) return { ok: false, code: 'EVENT_VERSION_UNSUPPORTED' }
  if (input.event.source !== `urn:oes:service:${input.contract.ownerService}`) return { ok: false, code: 'EVENT_OWNER_MISMATCH' }
  const headers = normalizeHeaders(input.headers)
  if (!headers.ok) return headers
  if (headers.values['nats-msg-id'] !== input.event.id) return { ok: false, code: 'EVENT_MESSAGE_ID_MISMATCH' }
  if (headers.values['content-type'] !== CLOUD_EVENTS_CONTENT_TYPE) return { ok: false, code: 'EVENT_CONTENT_TYPE_INVALID' }
  if (headers.values['oes-transport-version'] !== '1') return { ok: false, code: 'EVENT_TRANSPORT_VERSION_UNSUPPORTED' }
  return { ok: true }
}

/** Builds the exact publish subject, headers, and immutable body consumed by a JetStream publish client. */
export function toNatsPublishRequest<TData>(event: OesCloudEvent<TData>, contract: OesEventContract<TData>, traceHeaders?: W3cTraceHeaders): { readonly subject: string; readonly headers: EventHeaders; readonly body: Uint8Array } {
  const validatedEvent = validateCloudEvent(event, contract)
  const encoded = encodeCloudEvent(validatedEvent, traceHeaders)
  const subject = subjectForEventType(validatedEvent.type)
  assertNatsTransport({ subject, headers: encoded.headers, event: validatedEvent, contract })
  return { subject, headers: encoded.headers, body: encoded.body }
}

/** Normalizes required headers case-insensitively while failing closed on duplicates, empties, and variants. */
function normalizeHeaders(headers: EventHeaders): TransportValidation & { readonly values?: Record<string, string> } {
  const values: Record<string, string> = {}
  const required = new Set(['nats-msg-id', 'content-type', 'oes-transport-version'])
  const observed = new Set([...required, 'traceparent', 'tracestate'])
  for (const [name, value] of headers) {
    const normalized = name.toLowerCase()
    if (!observed.has(normalized)) continue
    if (!value || Object.prototype.hasOwnProperty.call(values, normalized)) return { ok: false, code: 'EVENT_REQUIRED_HEADER_INVALID' }
    values[normalized] = value
  }
  for (const name of required) if (!values[name]) return { ok: false, code: 'EVENT_REQUIRED_HEADER_MISSING' }
  if (values.tracestate && !values.traceparent) return { ok: false, code: 'EVENT_W3C_TRACEPARENT_REQUIRED' }
  if (values.traceparent && !/^\d{2}-[0-9a-f]{32}-[0-9a-f]{16}-[0-9a-f]{2}$/i.test(values.traceparent)) return { ok: false, code: 'EVENT_TRACEPARENT_INVALID' }
  return { ok: true, values }
}

/** Raises a contract error from a fail-closed transport validation result. */
export function assertNatsTransport<TData>(input: NatsTransportInput<TData>): void {
  const result = validateNatsTransport(input)
  if (result.ok === false) throw new EventContractError(result.code)
}
