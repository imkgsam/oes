// File: src/common/src/logging/console-logger.adapter.ts

import { OesLogger } from './oes-logger.interface'

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
export class ConsoleLoggerAdapter implements Console {
  private readonly logger: OesLogger
  private readonly moduleName: string

  /**
   * Memory storage for console.memory (required by Console interface)
   */
  readonly memory: undefined = undefined

  /**
   * Console reference (required by Console interface)
   */
  readonly Console: typeof console.Console

  constructor(logger: OesLogger, moduleName = 'sdk') {
    this.logger = logger
    this.moduleName = moduleName
    // Self-reference for Console interface compliance
    this.Console = console.Console
  }

  // ============================================
  // Core logging methods
  // ============================================

  log(...args: unknown[]): void {
    this.logger.info(...args)
  }

  info(...args: unknown[]): void {
    this.logger.info(...args)
  }

  warn(...args: unknown[]): void {
    this.logger.warn(...args)
  }

  error(...args: unknown[]): void {
    this.logger.error(...args)
  }

  debug(...args: unknown[]): void {
    this.logger.debug(...args)
  }

  // ============================================
  // Additional Console methods (no-op implementations)
  // These are required by the Console interface but not typically
  // used by SDK loggers. They delegate to appropriate log levels.
  // ============================================

  trace(...args: unknown[]): void {
    this.logger.debug(...args)
  }

  dir(item?: unknown, options?: unknown): void {
    this.logger.debug(JSON.stringify(item, null, 2))
  }

  dirxml(...data: unknown[]): void {
    this.logger.debug(...data)
  }

  table(tabularData?: unknown, properties?: string[]): void {
    this.logger.debug(JSON.stringify(tabularData))
  }

  // ============================================
  // Assertion and counting (no-op)
  // ============================================

  assert(condition?: boolean, ...data: unknown[]): void {
    if (!condition) {
      this.logger.error('Assertion failed:', ...data)
    }
  }

  count(label?: string): void {
    // No-op: counting not supported
  }

  countReset(label?: string): void {
    // No-op: counting not supported
  }

  // ============================================
  // Grouping (no-op)
  // ============================================

  group(...label: unknown[]): void {
    // No-op: grouping not supported in structured logging
  }

  groupCollapsed(...label: unknown[]): void {
    // No-op: grouping not supported in structured logging
  }

  groupEnd(): void {
    // No-op: grouping not supported in structured logging
  }

  // ============================================
  // Timing
  // ============================================

  private timers = new Map<string, number>()

  time(label?: string): void {
    this.timers.set(label ?? 'default', Date.now())
  }

  timeEnd(label?: string): void {
    const key = label ?? 'default'
    const start = this.timers.get(key)
    if (start) {
      const duration = Date.now() - start
      this.logger.debug(`${key}: ${duration}ms`)
      this.timers.delete(key)
    }
  }

  timeLog(label?: string, ...data: unknown[]): void {
    const key = label ?? 'default'
    const start = this.timers.get(key)
    if (start) {
      const duration = Date.now() - start
      this.logger.debug(`${key}: ${duration}ms`, ...data)
    }
  }

  timeStamp(label?: string): void {
    this.logger.debug(`Timestamp: ${label ?? Date.now()}`)
  }

  // ============================================
  // Clearing and profiling (no-op)
  // ============================================

  clear(): void {
    // No-op: cannot clear structured logs
  }

  profile(label?: string): void {
    // No-op: profiling not supported
  }

  profileEnd(label?: string): void {
    // No-op: profiling not supported
  }
}
