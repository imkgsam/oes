import { trace } from '@opentelemetry/api'

export function getTraceId(): string {
  return trace.getActiveSpan()?.spanContext().traceId ?? 'unknown'
}

export function getSpanId(): string {
  return trace.getActiveSpan()?.spanContext().spanId ?? 'unknown'
}
