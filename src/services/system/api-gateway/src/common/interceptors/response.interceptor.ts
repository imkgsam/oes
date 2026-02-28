import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { Request } from 'express'
import { HttpResponse } from '@oes/common/core/interfaces/http.interface'
import { SUCCESS } from '@oes/common/constants/errors/system.errors'
import { getSpanId, getTraceId } from '@oes/common/tracing/trace-context'

/** Wraps every successful HTTP response in a unified envelope. */
@Injectable()
export class ResponseTransformInterceptor implements NestInterceptor<any, HttpResponse> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<HttpResponse> {
    const request: Request = context.switchToHttp().getRequest()
    const traceId = getTraceId()
    const spanId = getSpanId()

    return next.handle().pipe(
      map(
        (data: any): HttpResponse => ({
          code: data?.code || SUCCESS.subCode,
          message: data?.message || SUCCESS.message,
          messageKey: data?.messageKey || SUCCESS.messageKey,
          data: data?.data !== undefined ? data.data : data
        })
      )
    )
  }
}
