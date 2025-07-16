// src/common/trace/rpc-trace.interceptor.ts

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { v4 as uuidv4 } from 'uuid'
import { traceStorage } from './trace-context'

@Injectable()
export class RpcTraceInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const rpcCtx = context.switchToRpc()
    const data = rpcCtx.getData()
    const traceId = data?.traceId || uuidv4()

    return new Observable((subscriber) => {
      traceStorage.run({ traceId }, () => {
        next.handle().subscribe({
          next: (val) => subscriber.next(val),
          error: (err) => subscriber.error(err),
          complete: () => subscriber.complete(),
        })
      })
    })
  }
}
