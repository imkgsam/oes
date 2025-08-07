import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { Request } from 'express'
import { StandardResponse } from '@oes/common/interfaces/httpResponse.interface'
import { SUCCESS } from '@oes/common/constants/res-codes/system.errors'

// 响应拦截器, 统一返回response结构
@Injectable()
export class ResponseTransformInterceptor<T = any>
  implements NestInterceptor<any, StandardResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>
  ): Observable<StandardResponse<T>> {
    const ctx = context.switchToHttp()
    const request = ctx.getRequest<Request>()

    const traceId =
      (request as any).traceId || request.headers['x-trace-id'] || null

    return next.handle().pipe(
      map(
        (data: T): StandardResponse<T> => ({
          code: SUCCESS.subCode,
          message: SUCCESS.message,
          messageKey: SUCCESS.messageKey,
          data: data ?? null,
          traceId: traceId,
          timestamp: new Date().toISOString(),
          path: request.originalUrl
        })
      )
    )
  }
}
