"use strict";
// File: src/common/src/logging/app-logger.service.ts
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AppLogger_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppLogger = void 0;
const common_1 = require("@nestjs/common");
const pino_otel_logger_1 = require("./pino-otel.logger");
const logging_constants_1 = require("./logging.constants");
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
let AppLogger = AppLogger_1 = class AppLogger {
    logger;
    context;
    constructor(options) {
        const serviceName = options?.serviceName ??
            process.env.OTEL_SERVICE_NAME ??
            process.env.MODULE_NAME ??
            'unknown-service';
        this.logger = new pino_otel_logger_1.PinoOtelLogger({
            serviceName,
            ...options
        });
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
    setContext(context) {
        this.context = context;
        return this;
    }
    /**
     * Enrich metadata with context if set.
     */
    enrichMeta(meta) {
        if (!this.context && !meta) {
            return {};
        }
        return {
            ...(this.context && { context: this.context }),
            ...meta
        };
    }
    log(...args) {
        this.handleNestJsCall('info', args);
    }
    verbose(...args) {
        this.handleNestJsCall('debug', args);
    }
    debug(...args) {
        this.handleCall('debug', args);
    }
    info(...args) {
        this.handleCall('info', args);
    }
    warn(...args) {
        this.handleCall('warn', args);
    }
    error(...args) {
        this.handleCall('error', args);
    }
    // ============================================
    // Internal Methods
    // ============================================
    /**
     * Handle standard OesLogger calls.
     * Enriches metadata with context if available.
     */
    handleCall(level, args) {
        // If first arg is string and second is LogMeta-like, enrich it
        if (args.length >= 1 &&
            typeof args[0] === 'string' &&
            (args.length === 1 || this.isLogMetaLike(args[1]))) {
            const message = args[0];
            const meta = args[1];
            this.logger[level](message, this.enrichMeta(meta));
            return;
        }
        // Otherwise, pass through to underlying logger
        this.logger[level](...args);
    }
    /**
     * Handle NestJS-style calls where context might be the last argument.
     * NestJS convention: log(message, context?) where context is a string
     */
    handleNestJsCall(level, args) {
        // NestJS pattern: (message, context) where context is a string class name
        if (args.length === 2 && typeof args[0] === 'string' && typeof args[1] === 'string') {
            const message = args[0];
            const context = args[1];
            this.logger[level](message, { context });
            return;
        }
        // Fall back to standard handling
        this.handleCall(level, args);
    }
    /**
     * Check if value looks like LogMeta (has known keys or is plain object).
     */
    isLogMetaLike(value) {
        if (value === null || value === undefined) {
            return true; // undefined meta is valid
        }
        if (typeof value !== 'object' || Array.isArray(value)) {
            return false;
        }
        // Exclude Error objects
        if (value instanceof Error) {
            return false;
        }
        return true;
    }
    /**
     * Return the configured service name so transport logging can tag entries consistently.
     */
    getServiceName() {
        return this.logger.getServiceName();
    }
    /**
     * Create a child logger with additional bound context.
     *
     * @param bindings - Additional fields to bind to all log entries
     * @returns New AppLogger instance with bound context
     */
    child(bindings) {
        const childLogger = new AppLogger_1();
        // @ts-expect-error - Accessing private field for child logger creation
        childLogger.logger = this.logger.child(bindings);
        childLogger.context = this.context;
        return childLogger;
    }
    /**
     * Get the underlying PinoOtelLogger instance.
     */
    getLogger() {
        return this.logger;
    }
};
exports.AppLogger = AppLogger;
exports.AppLogger = AppLogger = AppLogger_1 = __decorate([
    (0, common_1.Injectable)({ scope: common_1.Scope.DEFAULT }),
    __param(0, (0, common_1.Optional)()),
    __param(0, (0, common_1.Inject)(logging_constants_1.LOGGER_OPTIONS)),
    __metadata("design:paramtypes", [Object])
], AppLogger);
//# sourceMappingURL=app-logger.service.js.map