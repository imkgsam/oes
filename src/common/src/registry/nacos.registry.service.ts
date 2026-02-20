// File: src/common/src/registry/nacos.registry.service.ts

import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { NacosNamingClient, Instance } from 'nacos'
import { ServiceRegistry } from './registry.interface'
import { AppLogger } from '../logging/app-logger.service'
import { ConsoleLoggerAdapter } from '../logging/console-logger.adapter'
import * as os from 'os'

/**
 * Nacos-based service registry for service registration and deregistration.
 *
 * Automatically registers the service instance on module initialization
 * and deregisters on module destruction.
 *
 * @example
 * ```typescript
 * @Module({
 *   providers: [NacosRegistryService],
 * })
 * export class RegistryModule {}
 * ```
 */
@Injectable()
export class NacosRegistryService implements ServiceRegistry, OnModuleInit, OnModuleDestroy {
  private client: NacosNamingClient
  private instance: Instance

  constructor(private readonly logger: AppLogger) {
    //获取当前服务的端口
    const ip = process.env.SERVICE_IP ?? getLocalIP()
    const port = Number(process.env.SERVICE_PORT)

    this.client = new NacosNamingClient({
      serverList: process.env.NACOS_SERVER!,
      namespace: process.env.NACOS_NAMESPACE,
      // Use ConsoleLoggerAdapter to bridge OesLogger to Console interface
      logger: new ConsoleLoggerAdapter(logger, 'nacos')
    })

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
    await this.client.ready()
    await this.register()
    this.logger.info('Nacos registry initialized', {
      module: 'nacos',
      operation: 'init'
    })
  }

  async register(): Promise<void> {
    const serviceName = process.env.MODULE_NAME!
    await this.client.registerInstance(serviceName, this.instance)
    this.logger.info('Service registered', {
      module: 'nacos',
      operation: 'register',
      details: { serviceName, ip: this.instance.ip, port: this.instance.port }
    })
  }

  async deregister(): Promise<void> {
    const serviceName = process.env.MODULE_NAME!
    await this.client.deregisterInstance(serviceName, this.instance)
    this.logger.info('Service deregistered', {
      module: 'nacos',
      operation: 'deregister',
      details: { serviceName, ip: this.instance.ip, port: this.instance.port }
    })
  }

  async onModuleDestroy(): Promise<void> {
    await this.deregister()
    this.logger.info('Nacos registry destroyed', {
      module: 'nacos',
      operation: 'destroy'
    })
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
