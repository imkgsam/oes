import { SpanStatusCode, trace } from '@opentelemetry/api'

export function recordExceptionToActiveSpan(exception: unknown): void {
  const activeSpan = trace.getActiveSpan()

  if (!activeSpan) return

  if (exception instanceof Error) {
    activeSpan.recordException(exception)
  } else if (typeof exception === 'string') {
    activeSpan.recordException(new Error(exception))
  } else {
    activeSpan.recordException(new Error(JSON.stringify(exception)))
  }

  activeSpan.setStatus({ code: SpanStatusCode.ERROR })
}
