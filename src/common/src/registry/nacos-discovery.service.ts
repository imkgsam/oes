import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ServiceDiscovery, ServiceInstance } from './interfaces/discovery.interface'
import { NacosNamingClientProvider } from './nacos-naming-client.provider'
import { AppLogger } from '../logging'

@Injectable()
export class NacosDiscoveryService implements ServiceDiscovery {
  private readonly cache = new Map<string, ServiceInstance[]>()

  constructor(
    private readonly namingClientProvider: NacosNamingClientProvider,
    private readonly logger: AppLogger
  ) {}

  async subscribe(serviceName: string): Promise<void> {
    if (!this.namingClientProvider.isReady()) {
      this.logger.warn(`Cannot subscribe to "${serviceName}": Nacos naming client not initialized`)
      return
    }

    const client = this.namingClientProvider.getClient()

    await client.subscribe(serviceName, (instances) => {
      const healthyInstances = instances.filter((i) => i.healthy && i.enabled)

      this.cache.set(
        serviceName,
        healthyInstances.map((i) => ({
          ip: i.ip,
          port: i.port,
          metadata: i.metadata
        }))
      )

      this.logger.debug(
        `[${serviceName}] Instances updated: ${healthyInstances.length}/${instances.length} healthy`
      )
    })

    this.logger.log(`Subscribed to service: ${serviceName}`)
  }

  getInstances(serviceName: string): ServiceInstance[] {
    return this.cache.get(serviceName) ?? []
  }
}
