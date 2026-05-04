"use strict";
// File: src/common/src/logging/pino-otel.logger.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.PinoOtelLogger = void 0;
const pino_1 = require("pino");
const api_1 = require("@opentelemetry/api");
const oes_logger_interface_1 = require("./oes-logger.interface");
const env_helper_1 = require("../core/helpers/env.helper");
const log_redaction_1 = require("./log-redaction");
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
class PinoOtelLogger {
    logger;
    serviceName;
    constructor(options) {
        // Support legacy string constructor for backward compatibility
        const opts = typeof options === 'string' ? { serviceName: options } : options;
        this.serviceName = opts.serviceName;
        this.logger = (0, pino_1.default)({
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
            transport: (0, env_helper_1.isDevelopment)()
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
        });
    }
    /**
     * getServiceName exposes the bound service name for infrastructure code that needs consistent log tags.
     */
    getServiceName() {
        return this.serviceName;
    }
    /**
     * Enrich log entry with OpenTelemetry trace context.
     * Extracts traceId and spanId from the active span if available.
     *
     * @param meta - Optional structured metadata to merge
     * @returns Enriched metadata object
     */
    enrichWithTraceContext(meta) {
        const span = api_1.trace.getActiveSpan();
        const ctx = span?.spanContext();
        return (0, log_redaction_1.sanitizeLogMeta)({
            ...(ctx?.traceId && { traceId: ctx.traceId }),
            ...(ctx?.spanId && { spanId: ctx.spanId }),
            ...meta
        });
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
    parseArgs(args) {
        if (args.length === 0) {
            return ['', undefined];
        }
        const first = args[0];
        // Case 1: Single string message
        if (args.length === 1 && typeof first === 'string') {
            return [first, undefined];
        }
        // Case 2: String message with LogMeta
        if (typeof first === 'string' && args.length === 2 && (0, oes_logger_interface_1.isLogMeta)(args[1])) {
            return [first, args[1]];
        }
        // Case 3: Printf-style format string (contains % placeholders)
        if (typeof first === 'string' && first.includes('%') && args.length > 1) {
            return [this.formatPrintf(first, args.slice(1)), undefined];
        }
        // Case 4: Variadic arguments (console-style)
        // Join all arguments into a single message
        const message = args.map((arg) => this.stringify(arg)).join(' ');
        return [message, undefined];
    }
    /**
     * Format printf-style string with arguments.
     * Supports: %s (string), %d/%i (integer), %f (float), %j (JSON), %o (object)
     *
     * @param format - Format string with placeholders
     * @param values - Values to substitute
     * @returns Formatted string
     */
    formatPrintf(format, values) {
        let index = 0;
        return format.replace(/%([sdifjo%])/g, (match, specifier) => {
            if (specifier === '%') {
                return '%';
            }
            if (index >= values.length) {
                return match;
            }
            const value = values[index++];
            switch (specifier) {
                case 's':
                    return String(value);
                case 'd':
                case 'i':
                    return Number.isFinite(value) ? Math.floor(Number(value)).toString() : 'NaN';
                case 'f':
                    return Number.isFinite(value) ? Number(value).toString() : 'NaN';
                case 'j':
                case 'o':
                    return this.stringify(value);
                default:
                    return match;
            }
        });
    }
    /**
     * Safely stringify a value for logging.
     * Handles circular references and special objects.
     *
     * @param value - Value to stringify
     * @returns String representation
     */
    stringify(value) {
        if (value === null) {
            return 'null';
        }
        if (value === undefined) {
            return 'undefined';
        }
        if (typeof value === 'string') {
            return value;
        }
        if (typeof value === 'number' || typeof value === 'boolean') {
            return String(value);
        }
        if (value instanceof Error) {
            return value.stack ?? value.message;
        }
        if (typeof value === 'object') {
            try {
                return JSON.stringify(value);
            }
            catch {
                // Handle circular references
                return '[Circular]';
            }
        }
        return String(value);
    }
    /**
     * Internal log method that handles all log levels.
     *
     * @param level - Pino log level method
     * @param args - Arguments passed to public log method
     */
    logInternal(level, args) {
        const [message, meta] = this.parseArgs(args);
        const enrichedMeta = this.enrichWithTraceContext(meta);
        // Pino signature: logger.level(mergingObject, message)
        this.logger[level](enrichedMeta, message);
    }
    /**
     * Log debug-level message.
     */
    debug(...args) {
        this.logInternal('debug', args);
    }
    /**
     * Log info-level message.
     */
    info(...args) {
        this.logInternal('info', args);
    }
    /**
     * Log warn-level message.
     */
    warn(...args) {
        this.logInternal('warn', args);
    }
    /**
     * Log error-level message.
     */
    error(...args) {
        this.logInternal('error', args);
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
    child(bindings) {
        const childLogger = new PinoOtelLogger({
            serviceName: this.serviceName,
            baseFields: bindings
        });
        // Replace internal logger with pino child
        // @ts-expect-error - Accessing private field for child logger creation
        childLogger.logger = this.logger.child(bindings);
        return childLogger;
    }
    /**
     * Get the underlying Pino logger instance.
     * Use with caution - prefer the OesLogger interface methods.
     *
     * @returns Raw Pino logger instance
     */
    getPinoInstance() {
        return this.logger;
    }
}
exports.PinoOtelLogger = PinoOtelLogger;
//# sourceMappingURL=pino-otel.logger.js.map