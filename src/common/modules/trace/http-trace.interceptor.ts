// File: src/common/modules/trace/http-trace.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { Observable } from 'rxjs'
import { v4 as uuidv4 } from 'uuid'
import { runWithTraceContext } from './trace-context'
import { Request, Response } from 'express' // 添加 Express 类型导入

@Injectable()
export class HttpTraceInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req: Request = context.switchToHttp().getRequest()
    const res: Response = context.switchToHttp().getResponse()
    const traceId = (req.headers['x-trace-id'] as string) || uuidv4()
    const spanId = uuidv4() // 当前 HTTP 请求 spanId
    // 设置响应头
    res.setHeader('X-Trace-Id', traceId)
    return runWithTraceContext({ traceId, spanId }, () => next.handle())
  }
}
