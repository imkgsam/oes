import { OesLogger } from './oes-logger.interface';
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
export declare class ConsoleLoggerAdapter implements Console {
    private readonly logger;
    private readonly moduleName;
    /**
     * Memory storage for console.memory (required by Console interface)
     */
    readonly memory: undefined;
    /**
     * Console reference (required by Console interface)
     */
    readonly Console: typeof console.Console;
    constructor(logger: OesLogger, moduleName?: string);
    log(...args: unknown[]): void;
    info(...args: unknown[]): void;
    warn(...args: unknown[]): void;
    error(...args: unknown[]): void;
    debug(...args: unknown[]): void;
    trace(...args: unknown[]): void;
    dir(item?: unknown, options?: unknown): void;
    dirxml(...data: unknown[]): void;
    table(tabularData?: unknown, properties?: string[]): void;
    assert(condition?: boolean, ...data: unknown[]): void;
    count(label?: string): void;
    countReset(label?: string): void;
    group(...label: unknown[]): void;
    groupCollapsed(...label: unknown[]): void;
    groupEnd(): void;
    private timers;
    time(label?: string): void;
    timeEnd(label?: string): void;
    timeLog(label?: string, ...data: unknown[]): void;
    timeStamp(label?: string): void;
    clear(): void;
    profile(label?: string): void;
    profileEnd(label?: string): void;
}
