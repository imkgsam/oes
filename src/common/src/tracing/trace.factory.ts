// src/common/tracing/trace.factory.ts
import { v4 as uuidv4 } from 'uuid'
import { TraceContext } from './trace-context'

export class TraceFactory {
  static createRoot(): TraceContext {
    return {
      traceId: uuidv4(),
      spanId: uuidv4(),
      timestamp: new Date().toISOString()
    }
  }

  static createChild(
    traceId: string,
    parentSpanId?: string
  ): TraceContext {
    return {
      traceId,
      parentSpanId,
      spanId: uuidv4(),
      timestamp: new Date().toISOString()
    }
  }
}
