// src/common/tracing/trace.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { Observable } from 'rxjs'
import { runWithTraceContext } from './trace-context'
import { TraceFactory } from './trace.factory'
import { Metadata } from '@grpc/grpc-js'

@Injectable()
export class TraceInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    type protocalTypes = 'http' | 'rpc' | 'ws'
    const type = context.getType<protocalTypes>()

    // 处理http请求
    if (type === 'http') {
      return this.handleHttp(context, next)
    }

    // 处理rpc请求
    if (type === 'rpc') {
      return this.handleRpc(context, next)
    }

    // 其他类型请求，直接放行
    return next.handle()
  }

  /**
   * 处理 http request
   * @param context
   * @param next
   * @returns
   */
  private handleHttp(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest()
    const res = context.switchToHttp().getResponse()

    const traceId = req.headers['x-trace-id'] as string | undefined

    const ctx = traceId ? TraceFactory.createChild(traceId) : TraceFactory.createRoot()

    req.traceId = ctx.traceId
    res?.setHeader?.('X-Trace-Id', ctx.traceId)

    return runWithTraceContext(ctx, () => next.handle())
  }

  // ---------- RPC / TCP / gRPC ----------
  private handleRpc(context: ExecutionContext, next: CallHandler): Observable<any> {
    const rpcCtx = context.switchToRpc()
    const data: any = rpcCtx.getData()
    const transportCtx = rpcCtx.getContext()

    // ---------- gRPC ----------
    if (transportCtx?.metadata instanceof Metadata) {
      const metadata = transportCtx.metadata
      let traceId = metadata.get('x-trace-id')[0] as string | undefined
      let parentSpanId = metadata.get('x-span-id')[0] as string | undefined

      const ctx = traceId
        ? TraceFactory.createChild(traceId, parentSpanId)
        : TraceFactory.createRoot()

      metadata.set('x-trace-id', ctx.traceId)
      metadata.set('x-span-id', ctx.spanId)

      return runWithTraceContext(ctx, () => next.handle())
    }

    // ---------- TCP / Custom RPC ----------
    const traceId = data?.meta?.traceId
    const parentSpanId = data?.meta?.spanId

    const ctx = traceId
      ? TraceFactory.createChild(traceId, parentSpanId)
      : TraceFactory.createRoot()

    if (data?.meta) {
      data.meta.traceId = ctx.traceId
      data.meta.spanId = ctx.spanId
    }

    return runWithTraceContext(ctx, () => next.handle())
  }
}
