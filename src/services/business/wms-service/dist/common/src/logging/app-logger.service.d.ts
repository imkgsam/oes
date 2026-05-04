import { LoggerService } from '@nestjs/common';
import { OesLogger, LogMeta } from './oes-logger.interface';
import { PinoOtelLogger, PinoOtelLoggerOptions } from './pino-otel.logger';
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
export declare class AppLogger implements LoggerService, OesLogger {
    private readonly logger;
    private context?;
    constructor(options?: Partial<PinoOtelLoggerOptions>);
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
    setContext(context: string): this;
    /**
     * Enrich metadata with context if set.
     */
    private enrichMeta;
    /**
     * NestJS log method (maps to info level).
     * Supports NestJS calling convention: log(message, context?)
     */
    log(message: string, context?: string): void;
    log(message: string, meta?: LogMeta): void;
    /**
     * NestJS verbose method (maps to debug level).
     */
    verbose?(message: string, context?: string): void;
    verbose?(message: string, meta?: LogMeta): void;
    /**
     * Log debug-level message.
     */
    debug(message: string, meta?: LogMeta): void;
    debug(...args: unknown[]): void;
    /**
     * Log info-level message.
     */
    info(message: string, meta?: LogMeta): void;
    info(...args: unknown[]): void;
    /**
     * Log warn-level message.
     */
    warn(message: string, meta?: LogMeta): void;
    warn(...args: unknown[]): void;
    /**
     * Log error-level message.
     */
    error(message: string, meta?: LogMeta): void;
    error(...args: unknown[]): void;
    /**
     * Handle standard OesLogger calls.
     * Enriches metadata with context if available.
     */
    private handleCall;
    /**
     * Handle NestJS-style calls where context might be the last argument.
     * NestJS convention: log(message, context?) where context is a string
     */
    private handleNestJsCall;
    /**
     * Check if value looks like LogMeta (has known keys or is plain object).
     */
    private isLogMetaLike;
    /**
     * Return the configured service name so transport logging can tag entries consistently.
     */
    getServiceName(): string;
    /**
     * Create a child logger with additional bound context.
     *
     * @param bindings - Additional fields to bind to all log entries
     * @returns New AppLogger instance with bound context
     */
    child(bindings: Record<string, unknown>): AppLogger;
    /**
     * Get the underlying PinoOtelLogger instance.
     */
    getLogger(): PinoOtelLogger;
}
