import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { Request } from 'express'

@Injectable()
export class ResponseTransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp()
    const request = ctx.getRequest<Request>()

    return next.handle().pipe(
      map((data: any) => ({
        code: 0,
        message: 'Success',
        data: data ?? null,
        traceId: (request as any).traceId || null,
        timestamp: Date.now(),
        path: request.originalUrl,
      })),
    )
  }
}
