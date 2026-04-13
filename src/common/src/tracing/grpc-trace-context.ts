import { context, createTraceState, isSpanContextValid, SpanContext, trace, TraceFlags } from '@opentelemetry/api'
import { Metadata } from '@grpc/grpc-js'
import { TRACEPARENT_METADATA_KEY, TRACESTATE_METADATA_KEY } from '../authorization/constants'
import { getGrpcMetadataValue } from '../authorization/utils'

/** This helper writes the active OTel span context into gRPC metadata using W3C trace headers. */
export function injectGrpcTraceContext(metadata: Metadata, sourceContext = context.active()): void {
  const spanContext = trace.getSpan(sourceContext)?.spanContext()
  if (!spanContext || !isSpanContextValid(spanContext)) {
    return
  }

  metadata.set(TRACEPARENT_METADATA_KEY, formatTraceparent(spanContext))

  const traceState = spanContext.traceState?.serialize()
  if (traceState) {
    metadata.set(TRACESTATE_METADATA_KEY, traceState)
  }
}

/** This helper rebuilds an OTel context from gRPC metadata so tests and future interceptors can restore distributed tracing. */
export function extractGrpcTraceContext(metadata: Metadata, baseContext = context.active()) {
  const spanContext = parseGrpcTraceContext(metadata)
  if (!spanContext) {
    return baseContext
  }

  return trace.setSpan(baseContext, trace.wrapSpanContext(spanContext))
}

/** This helper parses W3C trace headers from gRPC metadata into an OTel span context. */
export function parseGrpcTraceContext(metadata: Metadata): SpanContext | undefined {
  const traceparent = getGrpcMetadataValue(metadata, TRACEPARENT_METADATA_KEY)
  if (!traceparent) {
    return undefined
  }

  const match = TRACEPARENT_PATTERN.exec(traceparent.trim())
  if (!match) {
    return undefined
  }

  const [, , traceId, spanId, traceFlagsHex] = match
  const traceStateHeader = getGrpcMetadataValue(metadata, TRACESTATE_METADATA_KEY)
  const spanContext: SpanContext = {
    traceId,
    spanId,
    traceFlags: parseInt(traceFlagsHex, 16) as TraceFlags,
    isRemote: true,
    traceState: traceStateHeader ? createTraceState(traceStateHeader) : undefined
  }

  return isSpanContextValid(spanContext) ? spanContext : undefined
}

/** This helper serializes an OTel span context into the canonical W3C traceparent header format. */
function formatTraceparent(spanContext: SpanContext): string {
  return `00-${spanContext.traceId}-${spanContext.spanId}-${spanContext.traceFlags.toString(16).padStart(2, '0')}`
}

const TRACEPARENT_PATTERN =
  /^([0-9a-f]{2})-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/i
