import { Logger as PinoLogger, LoggerOptions } from 'pino';
import { OesLogger } from './oes-logger.interface';
/**
 * Configuration options for PinoOtelLogger.
 */
export interface PinoOtelLoggerOptions {
    /** Service name for log identification */
    serviceName: string;
    /** Log level (default: 'info' or LOG_LEVEL env var) */
    level?: string;
    /** Additional base fields to include in every log */
    baseFields?: Record<string, unknown>;
    /** Custom pino options for advanced configuration */
    pinoOptions?: Partial<LoggerOptions>;
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
export declare class PinoOtelLogger implements OesLogger {
    private readonly logger;
    private readonly serviceName;
    constructor(options: PinoOtelLoggerOptions | string);
    /**
     * getServiceName exposes the bound service name for infrastructure code that needs consistent log tags.
     */
    getServiceName(): string;
    /**
     * Enrich log entry with OpenTelemetry trace context.
     * Extracts traceId and spanId from the active span if available.
     *
     * @param meta - Optional structured metadata to merge
     * @returns Enriched metadata object
     */
    private enrichWithTraceContext;
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
    private parseArgs;
    /**
     * Format printf-style string with arguments.
     * Supports: %s (string), %d/%i (integer), %f (float), %j (JSON), %o (object)
     *
     * @param format - Format string with placeholders
     * @param values - Values to substitute
     * @returns Formatted string
     */
    private formatPrintf;
    /**
     * Safely stringify a value for logging.
     * Handles circular references and special objects.
     *
     * @param value - Value to stringify
     * @returns String representation
     */
    private stringify;
    /**
     * Internal log method that handles all log levels.
     *
     * @param level - Pino log level method
     * @param args - Arguments passed to public log method
     */
    private logInternal;
    /**
     * Log debug-level message.
     */
    debug(...args: unknown[]): void;
    /**
     * Log info-level message.
     */
    info(...args: unknown[]): void;
    /**
     * Log warn-level message.
     */
    warn(...args: unknown[]): void;
    /**
     * Log error-level message.
     */
    error(...args: unknown[]): void;
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
    child(bindings: Record<string, unknown>): PinoOtelLogger;
    /**
     * Get the underlying Pino logger instance.
     * Use with caution - prefer the OesLogger interface methods.
     *
     * @returns Raw Pino logger instance
     */
    getPinoInstance(): PinoLogger;
}
