// File: src/common/src/registry/nacos.discovery.service.ts

import { Injectable, OnModuleInit } from '@nestjs/common'
import { NacosNamingClient } from 'nacos'
import { ServiceDiscovery, ServiceInstance } from './discovery.interface'
import { AppLogger } from '../logging/app-logger.service'
import { ConsoleLoggerAdapter } from '../logging/console-logger.adapter'

/**
 * Nacos-based service discovery for discovering and subscribing to services.
 *
 * Maintains a local cache of healthy service instances and automatically
 * updates when instances change.
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class GatewayService {
 *   constructor(private readonly discovery: NacosDiscoveryService) {}
 *
 *   async getServiceUrl(serviceName: string): Promise<string> {
 *     const instances = this.discovery.getInstances(serviceName)
 *     if (instances.length === 0) {
 *       throw new Error(`No instances available for ${serviceName}`)
 *     }
 *     const instance = instances[0]
 *     return `http://${instance.ip}:${instance.port}`
 *   }
 * }
 * ```
 */
@Injectable()
export class NacosDiscoveryService implements ServiceDiscovery, OnModuleInit {
  private client: NacosNamingClient
  private cache = new Map<string, ServiceInstance[]>()

  constructor(private readonly logger: AppLogger) {
    this.client = new NacosNamingClient({
      serverList: process.env.NACOS_SERVER!,
      namespace: process.env.NACOS_NAMESPACE || 'public',
      // Use ConsoleLoggerAdapter to bridge OesLogger to Console interface
      logger: new ConsoleLoggerAdapter(this.logger, 'nacos')
    })
  }

  async onModuleInit(): Promise<void> {
    await this.client.ready()
    this.logger.info('Nacos discovery initialized', {
      module: 'nacos',
      operation: 'init'
    })
  }

  async subscribe(serviceName: string): Promise<void> {
    await this.client.subscribe(serviceName, (instances) => {
      const healthyInstances = instances.filter((i) => i.healthy && i.enabled)

      this.cache.set(
        serviceName,
        healthyInstances.map((i) => ({
          ip: i.ip,
          port: i.port,
          metadata: i.metadata
        }))
      )

      this.logger.debug('Service instances updated', {
        module: 'nacos',
        operation: 'subscribe',
        details: {
          serviceName,
          totalInstances: instances.length,
          healthyInstances: healthyInstances.length
        }
      })
    })

    this.logger.info('Subscribing to service', {
      module: 'nacos',
      operation: 'subscribe',
      details: { serviceName }
    })
  }

  getInstances(serviceName: string): ServiceInstance[] {
    return this.cache.get(serviceName) ?? []
  }
}
