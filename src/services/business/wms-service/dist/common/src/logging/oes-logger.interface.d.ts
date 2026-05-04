/**
 * Structured metadata for log entries.
 * Provides consistent context across all log messages.
 *
 * @example
 * ```typescript
 * logger.info('User logged in', {
 *   module: 'auth',
 *   operation: 'login',
 *   details: { userId: '123' }
 * })
 * ```
 */
export interface LogMeta {
    /** Module or component name generating the log */
    module?: string;
    /** Operation or action being performed */
    operation?: string;
    /** Correlation identifier for the current request */
    requestId?: string;
    /** Tenant scope identifier */
    tenantId?: string;
    /** Organization scope identifier */
    orgId?: string;
    /** Human or machine operator identifier */
    operatorId?: string;
    /** Domain resource type */
    resourceType?: string;
    /** Domain resource identifier */
    resourceId?: string;
    /** Application-specific error code for error tracking */
    errorCode?: string;
    /** Additional contextual data */
    details?: unknown;
    /** Allow extension with custom fields */
    [key: string]: unknown;
}
/**
 * Log level enumeration for programmatic level control.
 * Follows standard severity ordering: debug < info < warn < error
 */
export declare enum LogLevel {
    DEBUG = "debug",
    INFO = "info",
    WARN = "warn",
    ERROR = "error"
}
/**
 * Unified logger interface supporting both structured and variadic logging patterns.
 *
 * This interface is designed to be compatible with:
 * - NestJS LoggerService
 * - Third-party SDKs (Nacos, Redis, MongoDB, etc.)
 * - Console-style logging
 * - Structured logging with OpenTelemetry integration
 *
 * @example Structured logging (recommended for application code)
 * ```typescript
 * logger.info('User created', { module: 'user', operation: 'create' })
 * ```
 *
 * @example Variadic logging (for third-party SDK compatibility)
 * ```typescript
 * logger.info('Connection established to', host, 'on port', port)
 * ```
 *
 * @example Printf-style logging
 * ```typescript
 * logger.info('Request %s completed in %dms', requestId, duration)
 * ```
 */
export interface OesLogger {
    /**
     * Log debug-level message.
     * Use for detailed diagnostic information during development.
     *
     * @param message - Log message or format string
     * @param meta - Optional structured metadata
     */
    debug(message: string, meta?: LogMeta): void;
    /**
     * Log debug-level message with variadic arguments.
     * Supports console-style and printf-style formatting.
     *
     * @param args - Message parts or format string with arguments
     */
    debug(...args: unknown[]): void;
    /**
     * Log info-level message.
     * Use for general operational information.
     *
     * @param message - Log message or format string
     * @param meta - Optional structured metadata
     */
    info(message: string, meta?: LogMeta): void;
    /**
     * Log info-level message with variadic arguments.
     *
     * @param args - Message parts or format string with arguments
     */
    info(...args: unknown[]): void;
    /**
     * Log warn-level message.
     * Use for potentially harmful situations that don't prevent operation.
     *
     * @param message - Log message or format string
     * @param meta - Optional structured metadata
     */
    warn(message: string, meta?: LogMeta): void;
    /**
     * Log warn-level message with variadic arguments.
     *
     * @param args - Message parts or format string with arguments
     */
    warn(...args: unknown[]): void;
    /**
     * Log error-level message.
     * Use for error events that might still allow the application to continue.
     *
     * @param message - Log message or format string
     * @param meta - Optional structured metadata
     */
    error(message: string, meta?: LogMeta): void;
    /**
     * Log error-level message with variadic arguments.
     *
     * @param args - Message parts or format string with arguments
     */
    error(...args: unknown[]): void;
}
/**
 * Type guard to check if an object conforms to LogMeta interface.
 * Used internally to distinguish between structured and variadic calls.
 *
 * @param value - Value to check
 * @returns True if value is a valid LogMeta object
 */
export declare function isLogMeta(value: unknown): value is LogMeta;
