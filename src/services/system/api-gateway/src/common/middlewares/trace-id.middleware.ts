// src/common/middleware/trace-id.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common'
import { v4 as uuidv4 } from 'uuid'
import { Request, Response, NextFunction } from 'express'

@Injectable()
export class TraceIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const traceId = req.headers['x-trace-id'] || uuidv4()
    req.headers['x-trace-id'] = traceId.toString()
    // 方便日志全链路追踪挂载
    ;(req as any).traceId = traceId
    res.setHeader('X-Trace-Id', traceId)
    next()
  }
}
