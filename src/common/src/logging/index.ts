// File: src/common/src/logging/index.ts

/**
 * OES Logging Module
 *
 * Provides a unified logging solution with:
 * - OpenTelemetry trace context integration
 * - NestJS LoggerService compatibility
 * - Third-party SDK compatibility (Nacos, Redis, etc.)
 * - Structured and variadic logging support
 *
 * @example Basic usage
 * ```typescript
 * import { LoggingModule, AppLogger } from '@oes/common/logging'
 *
 * // In module
 * @Module({ imports: [LoggingModule] })
 * export class AppModule {}
 *
 * // In service
 * @Injectable()
 * export class MyService {
 *   constructor(private readonly logger: AppLogger) {}
 * }
 * ```
 *
 * @example With Nacos SDK
 * ```typescript
 * import { AppLogger } from '@oes/common/logging'
 * import { NacosNamingClient } from 'nacos'
 *
 * const logger = new AppLogger({ serviceName: 'nacos-client' })
 * const client = new NacosNamingClient({
 *   serverList: 'localhost:8848',
 *   logger: logger  // AppLogger is compatible with Nacos logger interface
 * })
 * ```
 *
 * @packageDocumentation
 */

// Interfaces and types
export { OesLogger, LogMeta, LogLevel, isLogMeta } from './oes-logger.interface'

// Core logger implementation
export { PinoOtelLogger, PinoOtelLoggerOptions } from './pino-otel.logger'

// NestJS integration
export { AppLogger } from './app-logger.service'
export { LoggingModule, LOGGER_OPTIONS } from './logging.module'

// Adapters for third-party SDK compatibility
export { ConsoleLoggerAdapter } from './console-logger.adapter'
