import { Injectable, LoggerService } from '@nestjs/common'
import { OesLogger, LogMeta } from './oes-logger.interface'
import { PinoOtelLogger } from './pino-otel.logger'

@Injectable()
export class AppLogger implements LoggerService, OesLogger {
  private readonly logger: PinoOtelLogger

  constructor() {
    this.logger = new PinoOtelLogger(process.env.OTEL_SERVICE_NAME || 'unknown-service')
  }

  debug(message: string, meta?: LogMeta) {
    this.logger.debug(message, meta)
  }

  log(message: string, meta?: LogMeta) {
    this.logger.info(message, meta)
  }

  info(message: string, meta?: LogMeta) {
    this.logger.info(message, meta)
  }

  warn(message: string, meta?: LogMeta) {
    this.logger.warn(message, meta)
  }

  error(message: string, meta?: LogMeta) {
    this.logger.error(message, meta)
  }
}
