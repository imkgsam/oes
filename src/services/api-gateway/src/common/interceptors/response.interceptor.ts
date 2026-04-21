import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { HttpResponse } from '@oes/common/interfaces'
import { SUCCESS } from '@oes/common/constants'
import { getTraceId } from '@oes/common/tracing'
import { getHeaderValue, HttpRequestLike } from '../http/http-request.util'

// Distinguishes explicit HTTP response envelopes from domain objects that happen to expose a business `code` field.
function isHttpResponseEnvelope(data: any): data is Partial<HttpResponse> {
  return (
    data &&
    typeof data === 'object' &&
    (
      'message' in data ||
      'messageKey' in data ||
      'meta' in data ||
      ('code' in data && 'data' in data)
    )
  )
}

/** Wraps every successful HTTP response in a unified envelope. */
@Injectable()
export class ResponseTransformInterceptor implements NestInterceptor<any, HttpResponse> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<HttpResponse> {
    const request = context.switchToHttp().getRequest<HttpRequestLike>()
    const traceId = getTraceId()
    const requestId = getHeaderValue(request, 'x-request-id')?.trim() || undefined
    const timestamp = new Date().toISOString()

    return next.handle().pipe(
      map(
        (data: any): HttpResponse => {
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
        }
      )
    )
  }
}
