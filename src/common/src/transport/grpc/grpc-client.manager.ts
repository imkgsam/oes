/**
 * @file gRPC client manager — central orchestrator for gRPC connections
 * @module transport/grpc
 *
 * Manages per-service connection pools, integrates with Nacos service discovery,
 * and provides the primary API for obtaining gRPC clients.
 */

import { Inject, Injectable, OnModuleDestroy, OnModuleInit, Optional } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { GrpcConnectionPool } from './grpc-connection-pool'
import { GrpcModuleOptions, GrpcServiceConfig, resolvePoolConfig } from './grpc.interfaces'
import { GRPC_MODULE_OPTIONS } from './grpc.constants'
import { RoundRobinStrategy } from '../loadbalancer/round-robin.strategy'
import { LoadBalancer, ServiceEndpoint } from '../loadbalancer/loadbalancer.interface'
import { NacosDiscoveryService } from '../../registry/nacos-discovery.service'
import { AppLogger } from '../../logging'

/**
 * Central manager for all gRPC client connections.
 *
 * Responsibilities:
 * - Creates and manages per-service connection pools
 * - Integrates with Nacos discovery for dynamic endpoint resolution
 * - Supports static URL fallback for development/testing
 * - Runs periodic health checks across all pools
 * - Gracefully drains connections on shutdown
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class PermissionService {
 *   constructor(private readonly grpcManager: GrpcClientManager) {}
 *
 *   async checkPermission(userId: string, resource: string) {
 *     const client = await this.grpcManager.getClient('permission-service')
 *     const svc = client.getService<PermissionCheckService>('PermissionCheckService')
 *     return firstValueFrom(svc.checkPermission({ userId, resource }))
 *   }
 * }
 * ```
 */
@Injectable()
export class GrpcClientManager implements OnModuleInit, OnModuleDestroy {
  private readonly pools = new Map<string, GrpcConnectionPool>()
  private readonly loadBalancer: LoadBalancer
  private healthCheckTimer?: ReturnType<typeof setInterval>
  constructor(
    private readonly logger: AppLogger,
    @Inject(GRPC_MODULE_OPTIONS)
    @Optional()
    private readonly options: GrpcModuleOptions,
    @Optional()
    private readonly discovery?: NacosDiscoveryService
  ) {
    this.loadBalancer = new RoundRobinStrategy()
    this.logger = logger.child({ context: GrpcClientManager.name })
  }

  async onModuleInit(): Promise<void> {
    this.logger.debug('GrpcClientManager module initializing', {
      details: {
        configuredServices: Object.keys(this.options.services)
      }
    })

    // Subscribe to all configured services via Nacos discovery
    if (this.discovery) {
      const subscribePromises = Object.values(this.options.services)
        .filter((svc) => !svc.url) // Only subscribe for services without static URL
        .map((svc) => this.discovery!.subscribe(svc.serviceName))

      await Promise.all(subscribePromises)
      this.logger.log(`Subscribed to ${subscribePromises.length} services via Nacos discovery`)
    }

    // Initialize connection pools for all configured services
    for (const [key, config] of Object.entries(this.options.services)) {
      this.getOrCreatePool(key, config)
    }

    // Start periodic health check
    const interval = this.options.defaultPoolConfig?.healthCheckIntervalMs ?? 15_000
    this.healthCheckTimer = setInterval(() => {
      this.runHealthChecks().catch((err) => {
        this.logger.error('Health check sweep failed', err)
      })
    }, interval)

    this.logger.log(
      `GrpcClientManager initialized with ${Object.keys(this.options.services).length} services`
    )
  }

  /**
   * Get a gRPC client for the specified service.
   *
   * @param serviceName - The service key as defined in GrpcModuleOptions.services
   * @returns A ClientGrpc instance ready for use
   * @throws Error if the service is not configured or no endpoints are available
   */
  async getClient(serviceName: string): Promise<ClientGrpc> {
    this.logger.debug('Getting gRPC client for configured service', {
      details: { serviceName }
    })

    const config = this.options.services[serviceName]
    if (!config) {
      throw new Error(
        `[GrpcClientManager] Service "${serviceName}" is not configured. ` +
          `Available services: ${Object.keys(this.options.services).join(', ')}`
      )
    }

    this.logger.debug('Resolved gRPC service config', {
      details: {
        serviceName,
        targetServiceName: config.serviceName,
        packageName: config.packageName,
        protoPath: config.protoPath,
        usesStaticUrl: Boolean(config.url)
      }
    })

    const pool = this.getOrCreatePool(serviceName, config)
    const endpoints = this.resolveEndpoints(config)
    this.logger.debug('Resolved gRPC endpoints', {
      details: {
        serviceName,
        endpointCount: endpoints.length,
        endpoints
      }
    })

    return pool.acquire(endpoints)
  }

  /**
   * Get pool statistics for monitoring/observability.
   */
  getPoolStats(): Record<string, ReturnType<GrpcConnectionPool['getStats']>> {
    const stats: Record<string, ReturnType<GrpcConnectionPool['getStats']>> = {}
    for (const [name, pool] of this.pools) {
      stats[name] = pool.getStats()
    }
    return stats
  }

  async onModuleDestroy(): Promise<void> {
    // Stop health check timer
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer)
    }

    // Drain all pools
    const drainPromises = Array.from(this.pools.values()).map((pool) => pool.drain())
    await Promise.all(drainPromises)

    this.logger.log('All gRPC connection pools drained')
  }

  // ─── Private Methods ───────────────────────────────────────────────

  private getOrCreatePool(serviceName: string, config: GrpcServiceConfig): GrpcConnectionPool {
    if (!this.pools.has(serviceName)) {
      const poolConfig = resolvePoolConfig(config.pool, this.options.defaultPoolConfig)

      const pool = new GrpcConnectionPool({
        logger: this.logger,
        serviceName: config.serviceName,
        protoPath: config.protoPath,
        packageName: config.packageName,
        poolConfig,
        loadBalancer: this.loadBalancer,
        channelOptions: config.channelOptions ?? this.options.defaultChannelOptions
      })

      this.pools.set(serviceName, pool)
      this.logger.debug(
        `Created connection pool for "${serviceName}" ` +
          `(min=${poolConfig.minSize}, max=${poolConfig.maxSize})`
      )
    }

    return this.pools.get(serviceName)!
  }

  /**
   * Resolve endpoints for a service config.
   *
   * If a static URL is configured, use it directly.
   * Otherwise, query Nacos discovery for live instances.
   */
  private resolveEndpoints(config: GrpcServiceConfig): ServiceEndpoint[] {
    // Static URL override (for development or non-Nacos environments)
    if (config.url) {
      const [ip, portStr] = config.url.split(':')
      this.logger.debug('Resolved static gRPC endpoint', {
        details: {
          serviceName: config.serviceName,
          url: config.url
        }
      })
      return [
        {
          ip,
          port: parseInt(portStr, 10),
          healthy: true,
          weight: 1
        }
      ]
    }

    // Dynamic discovery via Nacos
    if (this.discovery) {
      const instances = this.discovery.getInstances(config.serviceName)
      this.logger.debug('Resolved discovered gRPC endpoints', {
        details: {
          serviceName: config.serviceName,
          instanceCount: instances.length
        }
      })
      return instances.map((inst) => ({
        ip: inst.ip,
        port: inst.port,
        healthy: true,
        weight: 1,
        metadata: inst.metadata
      }))
    }

    throw new Error(
      `[GrpcClientManager] No URL configured and no discovery service available ` +
        `for "${config.serviceName}". Either set a static URL or provide NacosDiscoveryService.`
    )
  }

  /**
   * Run health checks across all pools and refresh endpoints from discovery.
   */
  private async runHealthChecks(): Promise<void> {
    for (const [name, pool] of this.pools) {
      const config = this.options.services[name]
      if (config && !config.url && this.discovery) {
        // Refresh endpoints from Nacos
        const endpoints = this.discovery.getInstances(config.serviceName).map((inst) => ({
          ip: inst.ip,
          port: inst.port,
          healthy: true,
          weight: 1,
          metadata: inst.metadata
        }))
        pool.updateEndpoints(endpoints)
      }

      await pool.healthCheck()
    }
  }
}
