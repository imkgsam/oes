import { Injectable, NestMiddleware } from '@nestjs/common'
import { v4 as uuidv4 } from 'uuid'
import { Request, Response, NextFunction } from 'express'

const TRACE_ID_HEADER = 'x-trace-id'

@Injectable()
export class TraceIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    let traceId = req.headers[TRACE_ID_HEADER]
    // 只允许字符串类型
    if (typeof traceId !== 'string' || !traceId.trim()) {
      traceId = uuidv4()
    }
    // 挂载 traceId 到 req 对象，供业务使用
    ;(req as any).traceId = traceId
    // 保证 response headers 也包含 traceId，前端方便追踪
    res.setHeader('X-Trace-Id', traceId)
    next()
  }
}
