// File: src/common/src/logging/index.ts

// Interfaces and types
export { OesLogger, LogMeta, LogLevel, isLogMeta } from './oes-logger.interface'

// Core logger implementation
export { PinoOtelLogger, PinoOtelLoggerOptions } from './pino-otel.logger'

// NestJS integration
export { AppLogger } from './app-logger.service'
export { LoggingModule } from './logging.module'
export { LOGGER_OPTIONS } from './logging.constants'
export { sanitizeLogMeta, REDACTED } from './log-redaction'
export { GrpcAccessLogInterceptor } from './interceptors'

// Adapters for third-party SDK compatibility
export { ConsoleLoggerAdapter } from './console-logger.adapter'
