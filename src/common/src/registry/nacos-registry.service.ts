import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { Instance } from 'nacos'
import { ServiceRegistry } from './interfaces/registry.interface'
import { NacosNamingClientProvider } from './nacos-naming-client.provider'
import * as os from 'os'
import { AppLogger } from '../logging'

@Injectable()
export class NacosRegistryService implements ServiceRegistry, OnModuleInit, OnModuleDestroy {
  private instance: Instance

  constructor(
    private readonly namingClientProvider: NacosNamingClientProvider,
    private readonly logger: AppLogger
  ) {
    const ip = process.env.SERVICE_REGISTRY_IP ?? getLocalIP()
    const port = Number(process.env.SERVICE_REGISTRY_PORT)
    this.logger.warn(`Initializing NacosRegistryService with IP: ${ip}, Port: ${port}`)
    this.instance = {
      instanceId: `${ip}:${port}`,
      ip,
      port,
      weight: 1,
      healthy: true,
      enabled: true
    }
  }

  async onModuleInit(): Promise<void> {
    this.logger.debug('Nacos registry module initializing')

    if (!this.namingClientProvider.isReady()) {
      this.logger.warn('Nacos naming client not initialized. Skipping registration.')
      return
    }
    await this.register()
  }

  async register(): Promise<void> {
    const serviceName = process.env.MODULE_NAME
    if (!serviceName) {
      this.logger.warn('MODULE_NAME not set. Skipping service registration.')
      return
    }

    const client = this.namingClientProvider.getClient()
    await client.registerInstance(serviceName, this.instance)

    this.logger.log(
      `Service registered - : ${serviceName} @ ${this.instance.ip}:${this.instance.port}`
    )
  }

  async deregister(): Promise<void> {
    const serviceName = process.env.MODULE_NAME
    if (!serviceName) return

    if (!this.namingClientProvider.isReady()) return

    try {
      const client = this.namingClientProvider.getClient()
      await client.deregisterInstance(serviceName, this.instance)
      this.logger.log(
        `Service deregistered: ${serviceName} @ ${this.instance.ip}:${this.instance.port}`
      )
    } catch (err) {
      this.logger.error(`Failed to deregister service: ${serviceName}`, err)
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.deregister()
  }
}

function getLocalIP(): string {
  const nets = os.networkInterfaces()
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]!) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address
      }
    }
  }
  throw new Error('Cannot determine local IP')
}
