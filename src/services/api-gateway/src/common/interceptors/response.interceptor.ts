import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { HttpResponse } from '@oes/common/interfaces'
import { SUCCESS } from '@oes/common/constants'
import { getTraceId } from '@oes/common/tracing'
import { getHeaderValue, HttpRequestLike } from '../http/http-request.util'

const TRACE_ID_PATTERN = /^[0-9a-f]{32}$/u
const TRACEPARENT_PATTERN = /^00-([0-9a-f]{32})-([0-9a-f]{16})-[0-9a-f]{2}$/u
const ZERO_TRACE_ID = '00000000000000000000000000000000'
const ZERO_SPAN_ID = '0000000000000000'

/** Resolves a response trace id from the active span or the normalized non-zero W3C request parent. */
export function resolveHttpResponseTraceId(
  activeTraceId: string,
  request: HttpRequestLike
): string {
  const normalizedActiveTraceId = activeTraceId.trim().toLowerCase()
  if (TRACE_ID_PATTERN.test(normalizedActiveTraceId) && normalizedActiveTraceId !== ZERO_TRACE_ID) {
    return normalizedActiveTraceId
  }

  const traceparent = getHeaderValue(request, 'traceparent')?.trim().toLowerCase()
  const match = traceparent ? TRACEPARENT_PATTERN.exec(traceparent) : null
  if (!match || match[1] === ZERO_TRACE_ID || match[2] === ZERO_SPAN_ID) {
    return 'unknown'
  }

  return match[1]
}

// Distinguishes explicit HTTP response envelopes from domain objects that happen to expose a business `code` field.
function isHttpResponseEnvelope(data: any): data is Partial<HttpResponse> {
  return (
    data &&
    typeof data === 'object' &&
    ('message' in data ||
      'messageKey' in data ||
      'meta' in data ||
      ('code' in data && 'data' in data))
  )
}

/** Wraps every successful HTTP response in a unified envelope. */
@Injectable()
export class ResponseTransformInterceptor implements NestInterceptor<any, HttpResponse> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<HttpResponse> {
    const request = context.switchToHttp().getRequest<HttpRequestLike>()
    const traceId = resolveHttpResponseTraceId(getTraceId(), request)
    const requestId = getHeaderValue(request, 'x-request-id')?.trim() || undefined
    const timestamp = new Date().toISOString()

    return next.handle().pipe(
      map((data: any): HttpResponse => {
        const envelope = isHttpResponseEnvelope(data) ? data : undefined

        return {
          code: envelope?.code || SUCCESS.subCode,
          message: envelope?.message || SUCCESS.message,
          messageKey: envelope?.messageKey || SUCCESS.messageKey,
          data: data?.data !== undefined ? data.data : data,
          meta: {
            traceId,
            requestId,
            timestamp
          }
        }
      })
    )
  }
}
