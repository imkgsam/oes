/**
 * @file gRPC transport module — NestJS DynamicModule for gRPC client management
 * @module transport/grpc
 *
 * Provides two static methods:
 * - `forRoot()` — Registers the GrpcClientManager globally with service configurations
 * - `forFeature()` — Registers specific service client providers for a feature module
 */

import { DynamicModule, Module, Provider } from '@nestjs/common'
import { GrpcClientManager } from './grpc-client.manager'
import { GrpcModuleOptions, GrpcServiceConfig } from './grpc.interfaces'
import { GRPC_MODULE_OPTIONS, getGrpcClientToken } from './grpc.constants'

/**
 * NestJS module for gRPC inter-service communication.
 *
 * Uses NestJS native `@nestjs/microservices` Transport.GRPC under the hood,
 * with added connection pooling, load balancing, and Nacos service discovery.
 *
 * ## Architecture
 *
 * ```
 * GrpcTransportModule.forRoot()     → Global: GrpcClientManager + config
 * GrpcTransportModule.forFeature()  → Per-module: service-specific client providers
 * ```
 *
 * @example Root module setup
 * ```typescript
 * @Module({
 *   imports: [
 *     RegistryModule,  // Provides NacosDiscoveryService
 *     GrpcTransportModule.forRoot({
 *       services: {
 *         'permission-service': {
 *           serviceName: 'permission-service',
 *           protoPath: 'protos/permission_check.proto',
 *           packageName: 'permission_service',
 *         },
 *         'auth-service': {
 *           serviceName: 'auth-service',
 *           protoPath: 'protos/auth.proto',
 *           packageName: 'auth_service',
 *         },
 *       },
 *       defaultPoolConfig: {
 *         minSize: 2,
 *         maxSize: 10,
 *       },
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 *
 * @example Feature module setup
 * ```typescript
 * @Module({
 *   imports: [
 *     GrpcTransportModule.forFeature(['permission-service']),
 *   ],
 * })
 * export class PermissionModule {}
 * ```
 *
 * @example Injecting in a service
 * ```typescript
 * @Injectable()
 * export class PermissionAdapter {
 *   constructor(
 *     @InjectGrpcClient('permission-service')
 *     private readonly client: ClientGrpc,
 *   ) {}
 * }
 * ```
 */
@Module({})
export class GrpcTransportModule {
  /**
   * Register the gRPC transport module globally.
   *
   * This should be called once in the root AppModule. It registers:
   * - The module options (service configs)
   * - The GrpcClientManager (singleton)
   *
   * @param options - gRPC module configuration including service definitions
   */
  static forRoot(options: GrpcModuleOptions): DynamicModule {
    const optionsProvider: Provider = {
      provide: GRPC_MODULE_OPTIONS,
      useValue: options
    }

    return {
      module: GrpcTransportModule,
      global: true,
      providers: [optionsProvider, GrpcClientManager],
      exports: [GrpcClientManager, GRPC_MODULE_OPTIONS]
    }
  }

  /**
   * Register gRPC client providers for specific services in a feature module.
   *
   * Each service name gets a dedicated injection token that resolves to
   * a `ClientGrpc` instance obtained from the GrpcClientManager.
   *
   * @param serviceNames - Array of service keys (must match keys in forRoot config)
   */
  static forFeature(serviceNames: string[]): DynamicModule {
    const providers: Provider[] = serviceNames.map((name) => ({
      provide: getGrpcClientToken(name),
      useFactory: async (manager: GrpcClientManager) => {
        return manager.getClient(name)
      },
      inject: [GrpcClientManager]
    }))

    return {
      module: GrpcTransportModule,
      providers,
      exports: providers
    }
  }

  /**
   * Register gRPC transport with async configuration.
   *
   * Useful when the configuration depends on other providers
   * (e.g., NacosConfigService for dynamic configuration).
   *
   * @param options - Async module options
   */
  static forRootAsync(options: {
    useFactory: (...args: any[]) => GrpcModuleOptions | Promise<GrpcModuleOptions>
    inject?: any[]
    imports?: any[]
  }): DynamicModule {
    const optionsProvider: Provider = {
      provide: GRPC_MODULE_OPTIONS,
      useFactory: options.useFactory,
      inject: options.inject ?? []
    }

    return {
      module: GrpcTransportModule,
      global: true,
      imports: options.imports ?? [],
      providers: [optionsProvider, GrpcClientManager],
      exports: [GrpcClientManager, GRPC_MODULE_OPTIONS]
    }
  }
}
