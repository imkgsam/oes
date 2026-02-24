import {
  CallHandler,
  ExecutionContext,
  GatewayTimeoutException,
  Injectable,
  NestInterceptor
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Observable, throwError, TimeoutError } from 'rxjs'
import { catchError, timeout } from 'rxjs/operators'

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  private readonly timeoutMs: number

  constructor(private readonly config: ConfigService) {
    this.timeoutMs = this.config.get<number>('gateway.timeout.requestMs', 10_000)
  }

  intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      timeout(this.timeoutMs),
      catchError((err) => {
        if (err instanceof TimeoutError) {
          return throwError(() => new GatewayTimeoutException('Request timeout'))
        }
        return throwError(() => err)
      })
    )
  }
}
