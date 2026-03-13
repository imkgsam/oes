// File: src/common/src/logging/pino-otel.logger.ts

import pino, { Logger as PinoLogger, LoggerOptions } from 'pino'
import { trace, SpanContext } from '@opentelemetry/api'
import { OesLogger, LogMeta, isLogMeta } from './oes-logger.interface'
import { isDevelopment } from '../core/helpers/env.helper'

/**
 * Configuration options for PinoOtelLogger.
 */
export interface PinoOtelLoggerOptions {
  /** Service name for log identification */
  serviceName: string
  /** Log level (default: 'info' or LOG_LEVEL env var) */
  level?: string
  /** Additional base fields to include in every log */
  baseFields?: Record<string, unknown>
  /** Custom pino options for advanced configuration */
  pinoOptions?: Partial<LoggerOptions>
}

/**
 * Pino-based logger with OpenTelemetry trace context integration.
 *
 * Features:
 * - Automatic trace context injection (traceId, spanId)
 * - Support for both structured and variadic logging
 * - Printf-style format string support
 * - High-performance JSON logging via Pino
 *
 * @example Basic usage
 * ```typescript
 * const logger = new PinoOtelLogger({ serviceName: 'api-gateway' })
 * logger.info('Server started', { module: 'http', operation: 'startup' })
 * ```
 *
 * @example Third-party SDK compatibility
 * ```typescript
 * const nacosClient = new NacosNamingClient({
 *   serverList: 'localhost:8848',
 *   logger: new PinoOtelLogger({ serviceName: 'nacos-client' })
 * })
 * ```
 */
export class PinoOtelLogger implements OesLogger {
  private readonly logger: PinoLogger
  private readonly serviceName: string

  constructor(options: PinoOtelLoggerOptions | string) {
    // Support legacy string constructor for backward compatibility
    const opts = typeof options === 'string' ? { serviceName: options } : options

    this.serviceName = opts.serviceName

    this.logger = pino({
      level: opts.level ?? process.env.LOG_LEVEL ?? 'info',
      base: {
        service: this.serviceName,
        env: process.env.NODE_ENV,
        ...opts.baseFields
      },
      // Optimize for production: disable pretty print, use fast serializers
      formatters: {
        level: (label) => ({ level: label.toUpperCase() })
      },
      // 测试开发中，启用 pino-pretty 以便于阅读；生产环境中使用默认 JSON 输出
      transport: isDevelopment()
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'yyyy-mm-dd HH:MM:ss',
              ignore: 'pid,hostname',
              singleLine: true
            }
          }
        : undefined,
      // Merge custom pino options
      ...opts.pinoOptions
    })
  }

  /**
   * Enrich log entry with OpenTelemetry trace context.
   * Extracts traceId and spanId from the active span if available.
   *
   * @param meta - Optional structured metadata to merge
   * @returns Enriched metadata object
   */
  private enrichWithTraceContext(meta?: LogMeta): Record<string, unknown> {
    const span = trace.getActiveSpan()
    const ctx: SpanContext | undefined = span?.spanContext()

    return {
      ...(ctx?.traceId && { traceId: ctx.traceId }),
      ...(ctx?.spanId && { spanId: ctx.spanId }),
      ...meta
    }
  }

  /**
   * Parse variadic arguments into message and metadata.
   * Supports multiple calling conventions:
   *
   * 1. Structured: (message: string, meta?: LogMeta)
   * 2. Variadic: (...args: unknown[])
   * 3. Printf: (format: string, ...values: unknown[])
   *
   * @param args - Arguments passed to log method
   * @returns Tuple of [message, metadata]
   */
  private parseArgs(args: unknown[]): [string, LogMeta | undefined] {
    if (args.length === 0) {
      return ['', undefined]
    }

    const first = args[0]

    // Case 1: Single string message
    if (args.length === 1 && typeof first === 'string') {
      return [first, undefined]
    }

    // Case 2: String message with LogMeta
    if (typeof first === 'string' && args.length === 2 && isLogMeta(args[1])) {
      return [first, args[1] as LogMeta]
    }

    // Case 3: Printf-style format string (contains % placeholders)
    if (typeof first === 'string' && first.includes('%') && args.length > 1) {
      return [this.formatPrintf(first, args.slice(1)), undefined]
    }

    // Case 4: Variadic arguments (console-style)
    // Join all arguments into a single message
    const message = args.map((arg) => this.stringify(arg)).join(' ')

    return [message, undefined]
  }

  /**
   * Format printf-style string with arguments.
   * Supports: %s (string), %d/%i (integer), %f (float), %j (JSON), %o (object)
   *
   * @param format - Format string with placeholders
   * @param values - Values to substitute
   * @returns Formatted string
   */
  private formatPrintf(format: string, values: unknown[]): string {
    let index = 0

    return format.replace(/%([sdifjo%])/g, (match, specifier: string) => {
      if (specifier === '%') {
        return '%'
      }

      if (index >= values.length) {
        return match
      }

      const value = values[index++]

      switch (specifier) {
        case 's':
          return String(value)
        case 'd':
        case 'i':
          return Number.isFinite(value) ? Math.floor(Number(value)).toString() : 'NaN'
        case 'f':
          return Number.isFinite(value) ? Number(value).toString() : 'NaN'
        case 'j':
        case 'o':
          return this.stringify(value)
        default:
          return match
      }
    })
  }

  /**
   * Safely stringify a value for logging.
   * Handles circular references and special objects.
   *
   * @param value - Value to stringify
   * @returns String representation
   */
  private stringify(value: unknown): string {
    if (value === null) {
      return 'null'
    }

    if (value === undefined) {
      return 'undefined'
    }

    if (typeof value === 'string') {
      return value
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value)
    }

    if (value instanceof Error) {
      return value.stack ?? value.message
    }

    if (typeof value === 'object') {
      try {
        return JSON.stringify(value)
      } catch {
        // Handle circular references
        return '[Circular]'
      }
    }

    return String(value)
  }

  /**
   * Internal log method that handles all log levels.
   *
   * @param level - Pino log level method
   * @param args - Arguments passed to public log method
   */
  private logInternal(level: 'debug' | 'info' | 'warn' | 'error', args: unknown[]): void {
    const [message, meta] = this.parseArgs(args)
    const enrichedMeta = this.enrichWithTraceContext(meta)

    // Pino signature: logger.level(mergingObject, message)
    this.logger[level](enrichedMeta, message)
  }

  /**
   * Log debug-level message.
   */
  debug(...args: unknown[]): void {
    this.logInternal('debug', args)
  }

  /**
   * Log info-level message.
   */
  info(...args: unknown[]): void {
    this.logInternal('info', args)
  }

  /**
   * Log warn-level message.
   */
  warn(...args: unknown[]): void {
    this.logInternal('warn', args)
  }

  /**
   * Log error-level message.
   */
  error(...args: unknown[]): void {
    this.logInternal('error', args)
  }

  /**
   * Create a child logger with additional bound context.
   * Useful for request-scoped logging or module-specific loggers.
   *
   * @param bindings - Additional fields to bind to all log entries
   * @returns New PinoOtelLogger instance with bound context
   *
   * @example
   * ```typescript
   * const requestLogger = logger.child({ requestId: 'abc-123' })
   * requestLogger.info('Processing request') // includes requestId
   * ```
   */
  child(bindings: Record<string, unknown>): PinoOtelLogger {
    const childLogger = new PinoOtelLogger({
      serviceName: this.serviceName,
      baseFields: bindings
    })

    // Replace internal logger with pino child
    // @ts-expect-error - Accessing private field for child logger creation
    childLogger.logger = this.logger.child(bindings)

    return childLogger
  }

  /**
   * Get the underlying Pino logger instance.
   * Use with caution - prefer the OesLogger interface methods.
   *
   * @returns Raw Pino logger instance
   */
  getPinoInstance(): PinoLogger {
    return this.logger
  }
}
