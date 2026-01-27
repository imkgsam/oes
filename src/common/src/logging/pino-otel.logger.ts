// File: src/common/src/logging/pino-otel.logger.ts

import pino from 'pino'
import { trace } from '@opentelemetry/api'
import { OesLogger, LogMeta } from './oes-logger.interface'

export class PinoOtelLogger implements OesLogger {
  private readonly logger: pino.Logger
  private readonly serviceName: string

  constructor(serviceName: string) {
    this.serviceName = serviceName

    this.logger = pino({
      level: process.env.LOG_LEVEL || 'info',
      base: {
        service: serviceName,
        env: process.env.NODE_ENV
      }
    })
  }

  private enrich(meta?: LogMeta) {
    const span = trace.getActiveSpan()
    const ctx = span?.spanContext()

    return {
      traceId: ctx?.traceId,
      spanId: ctx?.spanId,
      ...meta
    }
  }

  debug(message: string, meta?: LogMeta) {
    this.logger.debug(this.enrich(meta), message)
  }

  info(message: string, meta?: LogMeta) {
    this.logger.info(this.enrich(meta), message)
  }

  warn(message: string, meta?: LogMeta) {
    this.logger.warn(this.enrich(meta), message)
  }

  error(message: string, meta?: LogMeta) {
    this.logger.error(this.enrich(meta), message)
  }
}
