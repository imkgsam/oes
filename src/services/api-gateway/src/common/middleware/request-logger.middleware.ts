import { Injectable, NestMiddleware } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'
import { AppLogger } from '@oes/common/logging'
import { getTraceId } from '@oes/common/tracing'
import { randomBytes, randomUUID } from 'crypto'

const TRACEPARENT_PATTERN = /^00-[0-9a-f]{32}-[0-9a-f]{16}-[0-9a-f]{2}$/u

/** RequestLoggerMiddleware records gateway HTTP access logs and exposes a request id for downstream propagation. */
@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: AppLogger) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const start = Date.now()
    const { method, originalUrl, ip } = req
    const requestId = req.get('x-request-id')?.trim() || randomUUID()
    if (req.headers) {
      req.headers['x-request-id'] = requestId
      const inboundTraceparent = req.get('traceparent')?.trim().toLowerCase()
      req.headers.traceparent = isValidTraceparent(inboundTraceparent)
        ? inboundTraceparent
        : createTraceparent()
    }

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

/** Establishes a non-zero W3C trace root at the Gateway boundary for requests without a valid parent. */
function createTraceparent(): string {
  return `00-${randomBytes(16).toString('hex')}-${randomBytes(8).toString('hex')}-01`
}

/** Accepts only a canonical non-zero W3C v00 parent before it becomes downstream correlation. */
function isValidTraceparent(value: string | undefined): value is string {
  return Boolean(
    value &&
      TRACEPARENT_PATTERN.test(value) &&
      !value.startsWith('00-00000000000000000000000000000000-') &&
      !value.includes('-0000000000000000-')
  )
}
