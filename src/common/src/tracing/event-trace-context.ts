import { getSpanId, getTraceId } from './trace-context'

/**
 * EventTraceContext carries the active trace identifiers into local or future async event payloads.
 */
export interface EventTraceContext {
  traceId: string | null
  spanId: string | null
}

/**
 * captureEventTraceContext snapshots the current active span so emitted events keep correlation identifiers.
 */
export function captureEventTraceContext(): EventTraceContext {
  const traceId = getTraceId()
  const spanId = getSpanId()

  return {
    traceId: traceId === 'unknown' ? null : traceId,
    spanId: spanId === 'unknown' ? null : spanId
  }
}
