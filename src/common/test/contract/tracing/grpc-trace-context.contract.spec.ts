import { context, trace, TraceFlags } from '@opentelemetry/api'
import { Metadata } from '@grpc/grpc-js'
import { TRACEPARENT_METADATA_KEY, TRACESTATE_METADATA_KEY } from '../../../src/authorization/constants'
import { extractGrpcTraceContext, injectGrpcTraceContext } from '../../../src/tracing/grpc-trace-context'

describe('grpc-trace-context', () => {
  /** This test ensures the active OTel span context is serialized into standard gRPC trace metadata. */
  it('should inject W3C trace headers from the active span', () => {
    const metadata = new Metadata()
    const activeContext = context.active()
    const spanContext = trace.wrapSpanContext({
      traceId: '1234567890abcdef1234567890abcdef',
      spanId: '1234567890abcdef',
      traceFlags: TraceFlags.SAMPLED
    })

    injectGrpcTraceContext(metadata, trace.setSpan(activeContext, spanContext))

    expect(metadata.get(TRACEPARENT_METADATA_KEY)[0]).toBe(
      '00-1234567890abcdef1234567890abcdef-1234567890abcdef-01'
    )
    expect(metadata.get(TRACESTATE_METADATA_KEY)).toEqual([])
  })

  /** This test ensures standard gRPC trace metadata can be reconstructed into a remote OTel span context. */
  it('should extract a remote span context from W3C trace headers', () => {
    const metadata = new Metadata()
    metadata.set(TRACEPARENT_METADATA_KEY, '00-1234567890abcdef1234567890abcdef-1234567890abcdef-01')
    metadata.set(TRACESTATE_METADATA_KEY, 'vendor=value')

    const extractedContext = extractGrpcTraceContext(metadata)
    const extractedSpan = trace.getSpan(extractedContext)

    expect(extractedSpan?.spanContext()).toMatchObject({
      traceId: '1234567890abcdef1234567890abcdef',
      spanId: '1234567890abcdef',
      traceFlags: TraceFlags.SAMPLED,
      isRemote: true
    })
    expect(extractedSpan?.spanContext().traceState?.serialize()).toBe('vendor=value')
  })
})
