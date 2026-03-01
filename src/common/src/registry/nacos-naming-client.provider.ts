import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { NacosNamingClient } from 'nacos'
import { AppLogger } from '../logging/app-logger.service'
import { ConsoleLoggerAdapter } from '../logging/console-logger.adapter'

/**
 * Injection token for the Nacos naming client provider.
 */
export const NACOS_NAMING_CLIENT = Symbol('NACOS_NAMING_CLIENT')

/**
 * Shared Nacos naming client.
 *
 * Creates a single NacosNamingClient connection that is shared between
 * NacosDiscoveryService and NacosRegistryService, reducing resource usage.
 *
 * Configuration is read from environment variables:
 * - `NACOS_SERVER` — Nacos server address (required)
 * - `NACOS_NAMESPACE` — Nacos namespace (default: 'public')
 *
 * @example
 * ```typescript
 * @Module({
 *   providers: [NacosNamingClientProvider],
 *   exports: [NacosNamingClientProvider],
 * })
 * export class RegistryModule {}
 * ```
 */
@Injectable()
export class NacosNamingClientProvider implements OnModuleInit, OnModuleDestroy {
  private client: NacosNamingClient

  constructor(private readonly logger: AppLogger) {}

  async onModuleInit(): Promise<void> {
    const serverList = process.env.NACOS_SERVER
    if (!serverList) {
      this.logger.warn(
        'NACOS_SERVER environment variable is not set. ' +
          'Nacos naming client will not be initialized.'
      )
      return
    }

    const namespace = process.env.NACOS_NAMESPACE ?? 'public'

    this.client = new NacosNamingClient({
      serverList,
      namespace,
      username: process.env.NACOS_USERNAME!,
      password: process.env.NACOS_PASSWORD!,
      logger: new ConsoleLoggerAdapter(this.logger, 'nacos-naming')
    })

    await this.client.ready()
    this.logger.log(`Nacos naming client connected to ${serverList} (namespace: ${namespace})`)
  }

  /**
   * Get the underlying NacosNamingClient instance.
   *
   * @throws Error if the client has not been initialized
   */
  getClient(): NacosNamingClient {
    if (!this.client) {
      throw new Error(
        '[NacosNamingClientProvider] Client not initialized. ' +
          'Ensure NACOS_SERVER environment variable is set.'
      )
    }
    return this.client
  }

  /**
   * Check if the client is initialized and ready.
   */
  isReady(): boolean {
    return !!this.client
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      try {
        // NacosNamingClient may not expose a typed close() method,
        // but the underlying SDK supports it at runtime
        if (typeof (this.client as any).close === 'function') {
          await (this.client as any).close()
        }
        this.logger.log('Nacos naming client closed')
      } catch (err) {
        this.logger.error('Error closing Nacos naming client', err)
      }
    }
  }
}
