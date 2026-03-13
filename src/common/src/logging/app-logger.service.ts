// File: src/common/src/logging/app-logger.service.ts

import { Injectable, LoggerService, Scope, Optional, Inject } from '@nestjs/common'
import { OesLogger, LogMeta } from './oes-logger.interface'
import { PinoOtelLogger, PinoOtelLoggerOptions } from './pino-otel.logger'
import { LOGGER_OPTIONS } from './logging.constants'

/**
 * Application logger service that integrates with NestJS DI system.
 *
 * Implements both NestJS LoggerService and OesLogger interfaces,
 * providing a unified logging solution that works with:
 * - NestJS built-in logging (app.useLogger())
 * - Application code (structured logging)
 * - Third-party SDKs (variadic logging)
 *
 * @example Using as NestJS application logger
 * ```typescript
 * const app = await NestFactory.create(AppModule, { bufferLogs: true })
 * app.useLogger(app.get(AppLogger))
 * ```
 *
 * @example Injecting in services
 * ```typescript
 * @Injectable()
 * export class UserService {
 *   constructor(private readonly logger: AppLogger) {}
 *
 *   async createUser(data: CreateUserDto) {
 *     this.logger.info('Creating user', { module: 'user', operation: 'create' })
 *   }
 * }
 * ```
 *
 * @example Using with Nacos SDK
 * ```typescript
 * const client = new NacosNamingClient({
 *   serverList: 'localhost:8848',
 *   logger: appLogger  // AppLogger is compatible with Nacos logger interface
 * })
 * ```
 */
@Injectable({ scope: Scope.DEFAULT })
export class AppLogger implements LoggerService, OesLogger {
  private readonly logger: PinoOtelLogger
  private context?: string

  constructor(@Optional() @Inject(LOGGER_OPTIONS) options?: Partial<PinoOtelLoggerOptions>) {
    const serviceName =
      options?.serviceName ??
      process.env.OTEL_SERVICE_NAME ??
      process.env.MODULE_NAME ??
      'unknown-service'

    this.logger = new PinoOtelLogger({
      serviceName,
      ...options
    })
  }



  /**
   * Set the logging context (typically the class name).
   * Used by NestJS for contextual logging.
   *
   * @param context - Context string (usually class name)
   * @returns This instance for chaining
   *
   * @example
   * ```typescript
   * private readonly logger = new AppLogger().setContext(UserService.name)
   * ```
   */
  setContext(context: string): this {
    this.context = context
    return this
  }

  /**
   * Enrich metadata with context if set.
   */
  private enrichMeta(meta?: LogMeta): LogMeta {
    if (!this.context && !meta) {
      return {}
    }

    return {
      ...(this.context && { context: this.context }),
      ...meta
    }
  }

  // ============================================
  // NestJS LoggerService Implementation
  // ============================================

  /**
   * NestJS log method (maps to info level).
   * Supports NestJS calling convention: log(message, context?)
   */
  log(message: string, context?: string): void
  log(message: string, meta?: LogMeta): void
  log(...args: unknown[]): void {
    this.handleNestJsCall('info', args)
  }

  /**
   * NestJS verbose method (maps to debug level).
   */
  verbose?(message: string, context?: string): void
  verbose?(message: string, meta?: LogMeta): void
  verbose?(...args: unknown[]): void {
    this.handleNestJsCall('debug', args)
  }

  // ============================================
  // OesLogger Implementation
  // ============================================

  /**
   * Log debug-level message.
   */
  debug(message: string, meta?: LogMeta): void
  debug(...args: unknown[]): void
  debug(...args: unknown[]): void {
    this.handleCall('debug', args)
  }

  /**
   * Log info-level message.
   */
  info(message: string, meta?: LogMeta): void
  info(...args: unknown[]): void
  info(...args: unknown[]): void {
    this.handleCall('info', args)
  }

  /**
   * Log warn-level message.
   */
  warn(message: string, meta?: LogMeta): void
  warn(...args: unknown[]): void
  warn(...args: unknown[]): void {
    this.handleCall('warn', args)
  }

  /**
   * Log error-level message.
   */
  error(message: string, meta?: LogMeta): void
  error(...args: unknown[]): void
  error(...args: unknown[]): void {
    this.handleCall('error', args)
  }

  // ============================================
  // Internal Methods
  // ============================================

  /**
   * Handle standard OesLogger calls.
   * Enriches metadata with context if available.
   */
  private handleCall(level: 'debug' | 'info' | 'warn' | 'error', args: unknown[]): void {
    // If first arg is string and second is LogMeta-like, enrich it
    if (
      args.length >= 1 &&
      typeof args[0] === 'string' &&
      (args.length === 1 || this.isLogMetaLike(args[1]))
    ) {
      const message = args[0] as string
      const meta = args[1] as LogMeta | undefined
      this.logger[level](message, this.enrichMeta(meta))
      return
    }

    // Otherwise, pass through to underlying logger
    this.logger[level](...args)
  }

  /**
   * Handle NestJS-style calls where context might be the last argument.
   * NestJS convention: log(message, context?) where context is a string
   */
  private handleNestJsCall(level: 'debug' | 'info' | 'warn' | 'error', args: unknown[]): void {
    // NestJS pattern: (message, context) where context is a string class name
    if (args.length === 2 && typeof args[0] === 'string' && typeof args[1] === 'string') {
      const message = args[0]
      const context = args[1]
      this.logger[level](message, { context })
      return
    }

    // Fall back to standard handling
    this.handleCall(level, args)
  }

  /**
   * Check if value looks like LogMeta (has known keys or is plain object).
   */
  private isLogMetaLike(value: unknown): boolean {
    if (value === null || value === undefined) {
      return true // undefined meta is valid
    }

    if (typeof value !== 'object' || Array.isArray(value)) {
      return false
    }

    // Exclude Error objects
    if (value instanceof Error) {
      return false
    }

    return true
  }

  /**
   * Create a child logger with additional bound context.
   *
   * @param bindings - Additional fields to bind to all log entries
   * @returns New AppLogger instance with bound context
   */
  child(bindings: Record<string, unknown>): AppLogger {
    const childLogger = new AppLogger()
    // @ts-expect-error - Accessing private field for child logger creation
    childLogger.logger = this.logger.child(bindings)
    childLogger.context = this.context
    return childLogger
  }

  /**
   * Get the underlying PinoOtelLogger instance.
   */
  getLogger(): PinoOtelLogger {
    return this.logger
  }
}
