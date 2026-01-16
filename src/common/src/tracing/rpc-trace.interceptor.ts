// File: src/common/modules/trace/http-trace.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { Observable } from 'rxjs'
import { v4 as uuidv4 } from 'uuid'
import { runWithTraceContext } from './trace-context'
import { RpcRequest } from '../../final/core/interfaces/rpc.interface'

@Injectable()
export class RpcTraceInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const rpcCtx = context.switchToRpc()
    const data: RpcRequest<any> = rpcCtx.getData()

    const traceId = data?.meta?.traceId || uuidv4()
    const parentSpanId = data?.meta?.spanId || undefined //如果调用方未传递，则未undefined
    const spanId = uuidv4()

    return runWithTraceContext({ traceId, spanId, parentSpanId }, () => next.handle())
  }
}
