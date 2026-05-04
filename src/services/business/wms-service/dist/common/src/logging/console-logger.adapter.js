"use strict";
// File: src/common/src/logging/console-logger.adapter.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsoleLoggerAdapter = void 0;
/**
 * Adapter that wraps OesLogger to provide Console-compatible interface.
 *
 * Many third-party SDKs (like Nacos) expect a Console-like logger interface.
 * This adapter bridges the gap between our structured OesLogger and the
 * Console interface expected by these SDKs.
 *
 * @example Usage with Nacos SDK
 * ```typescript
 * import { AppLogger } from './app-logger.service'
 * import { ConsoleLoggerAdapter } from './console-logger.adapter'
 * import { NacosNamingClient } from 'nacos'
 *
 * const appLogger = new AppLogger({ serviceName: 'nacos-client' })
 * const client = new NacosNamingClient({
 *   serverList: 'localhost:8848',
 *   logger: new ConsoleLoggerAdapter(appLogger)
 * })
 * ```
 */
class ConsoleLoggerAdapter {
    logger;
    moduleName;
    /**
     * Memory storage for console.memory (required by Console interface)
     */
    memory = undefined;
    /**
     * Console reference (required by Console interface)
     */
    Console;
    constructor(logger, moduleName = 'sdk') {
        this.logger = logger;
        this.moduleName = moduleName;
        // Self-reference for Console interface compliance
        this.Console = console.Console;
    }
    // ============================================
    // Core logging methods
    // ============================================
    log(...args) {
        this.logger.info(...args);
    }
    info(...args) {
        this.logger.info(...args);
    }
    warn(...args) {
        this.logger.warn(...args);
    }
    error(...args) {
        this.logger.error(...args);
    }
    debug(...args) {
        this.logger.debug(...args);
    }
    // ============================================
    // Additional Console methods (no-op implementations)
    // These are required by the Console interface but not typically
    // used by SDK loggers. They delegate to appropriate log levels.
    // ============================================
    trace(...args) {
        this.logger.debug(...args);
    }
    dir(item, options) {
        this.logger.debug(JSON.stringify(item, null, 2));
    }
    dirxml(...data) {
        this.logger.debug(...data);
    }
    table(tabularData, properties) {
        this.logger.debug(JSON.stringify(tabularData));
    }
    // ============================================
    // Assertion and counting (no-op)
    // ============================================
    assert(condition, ...data) {
        if (!condition) {
            this.logger.error('Assertion failed:', ...data);
        }
    }
    count(label) {
        // No-op: counting not supported
    }
    countReset(label) {
        // No-op: counting not supported
    }
    // ============================================
    // Grouping (no-op)
    // ============================================
    group(...label) {
        // No-op: grouping not supported in structured logging
    }
    groupCollapsed(...label) {
        // No-op: grouping not supported in structured logging
    }
    groupEnd() {
        // No-op: grouping not supported in structured logging
    }
    // ============================================
    // Timing
    // ============================================
    timers = new Map();
    time(label) {
        this.timers.set(label ?? 'default', Date.now());
    }
    timeEnd(label) {
        const key = label ?? 'default';
        const start = this.timers.get(key);
        if (start) {
            const duration = Date.now() - start;
            this.logger.debug(`${key}: ${duration}ms`);
            this.timers.delete(key);
        }
    }
    timeLog(label, ...data) {
        const key = label ?? 'default';
        const start = this.timers.get(key);
        if (start) {
            const duration = Date.now() - start;
            this.logger.debug(`${key}: ${duration}ms`, ...data);
        }
    }
    timeStamp(label) {
        this.logger.debug(`Timestamp: ${label ?? Date.now()}`);
    }
    // ============================================
    // Clearing and profiling (no-op)
    // ============================================
    clear() {
        // No-op: cannot clear structured logs
    }
    profile(label) {
        // No-op: profiling not supported
    }
    profileEnd(label) {
        // No-op: profiling not supported
    }
}
exports.ConsoleLoggerAdapter = ConsoleLoggerAdapter;
//# sourceMappingURL=console-logger.adapter.js.map