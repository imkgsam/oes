import { Injectable, NestMiddleware } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'
import { AppLogger } from '@oes/common/logging/app-logger.service'
import { getTraceId } from '@oes/common/tracing/trace-context'

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: AppLogger) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const start = Date.now()
    const { method, originalUrl, ip } = req

    res.on('finish', () => {
      this.logger.log('HTTP Request', {
        method,
        path: originalUrl,
        statusCode: res.statusCode,
        durationMs: Date.now() - start,
        ip,
        userAgent: req.get('user-agent'),
        traceId: getTraceId()
      })
    })

    next()
  }
}
