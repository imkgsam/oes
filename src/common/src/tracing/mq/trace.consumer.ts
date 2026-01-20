// src/common/tracing/mq/trace.consumer.ts
import { TraceFactory } from '../trace.factory'
import { runWithTraceContext } from '../trace-context'

export async function withTrace<T>(payload: any, handler: () => Promise<T>) {
  const traceId = payload?.traceId
  const parentSpanId = payload?.spanId

  const ctx = traceId ? TraceFactory.createChild(traceId, parentSpanId) : TraceFactory.createRoot()

  payload.traceId = ctx.traceId
  payload.spanId = ctx.spanId

  return runWithTraceContext(ctx, handler)
}
