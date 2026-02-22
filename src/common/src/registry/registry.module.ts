/**
 * @file Registry module — Nacos service registration and discovery
 * @module registry
 *
 * Provides a global NestJS module that manages:
 * - A shared NacosNamingClient connection
 * - Service discovery (subscribing to and querying service instances)
 * - Service registration (registering/deregistering the current instance)
 *
 * Import this module in your root AppModule to enable Nacos integration.
 */

import { Global, Module } from '@nestjs/common'
import { NacosNamingClientProvider } from './nacos-naming-client.provider'
import { NacosDiscoveryService } from './nacos-discovery.service'
import { NacosRegistryService } from './nacos-registry.service'

/**
 * Global module for Nacos service registration and discovery.
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [
 *     RegistryModule,
 *     GrpcTransportModule.forRoot({ ... }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Global()
@Module({
  providers: [NacosNamingClientProvider, NacosDiscoveryService, NacosRegistryService],
  exports: [NacosDiscoveryService, NacosRegistryService]
})
export class RegistryModule {}
