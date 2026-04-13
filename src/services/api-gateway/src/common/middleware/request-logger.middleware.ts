import { Injectable, NestMiddleware } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'
import { AppLogger } from '@oes/common/logging'
import { getTraceId } from '@oes/common/tracing'
import { randomUUID } from 'crypto'

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: AppLogger) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const start = Date.now()
    const { method, originalUrl, ip } = req
    const requestId = req.get('x-request-id')?.trim() || randomUUID()

    res.on('finish', () => {
      const durationMs = Date.now() - start
      const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info'

      this.logger[level]('HTTP request completed', {
        module: 'http',
        operation: 'request.complete',
        requestId,
        traceId: getTraceId(),
        method,
        details: {
          protocol: 'http',
          method,
          path: originalUrl,
          statusCode: res.statusCode,
          durationMs,
          clientIp: ip,
          userAgent: req.get('user-agent')
        }
      })
    })

    next()
  }
}
