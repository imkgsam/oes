// File: src/common/modules/trace/trace-context.ts
import { AsyncLocalStorage } from 'async_hooks'
interface TraceContext {
  traceId: string
  spanId: string
  parentSpanId?: string
  caller?: string
  timestamp?: string
}

export const traceStorage = new AsyncLocalStorage<TraceContext>()

export function runWithTraceContext<T>(ctx: TraceContext, fn: () => T): T {
  return traceStorage.run(ctx, fn)
}

export function getTraceId(): string | undefined {
  return traceStorage.getStore()?.traceId
}

export function getSpanId(): string | undefined {
  return traceStorage.getStore()?.spanId
}

export function getParentSpanId(): string | undefined {
  return traceStorage.getStore()?.parentSpanId
}

export function getCaller(): string | undefined {
  return traceStorage.getStore()?.caller
}

export function getTraceContext(): TraceContext | undefined {
  return traceStorage.getStore()
}
