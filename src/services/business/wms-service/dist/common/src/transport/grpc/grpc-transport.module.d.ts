/**
 * @file gRPC transport module — NestJS DynamicModule for gRPC client management
 * @module transport/grpc
 *
 * Provides two static methods:
 * - `forRoot()` — Registers the GrpcClientManager globally with service configurations
 * - `forFeature()` — Registers specific service client providers for a feature module
 */
import { DynamicModule } from '@nestjs/common';
import { GrpcModuleOptions } from './grpc.interfaces';
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
export declare class GrpcTransportModule {
    /**
     * Register the gRPC transport module globally.
     *
     * This should be called once in the root AppModule. It registers:
     * - The module options (service configs)
     * - The GrpcClientManager (singleton)
     *
     * @param options - gRPC module configuration including service definitions
     */
    static forRoot(options: GrpcModuleOptions): DynamicModule;
    /**
     * Register gRPC client providers for specific services in a feature module.
     *
     * Each service name gets a dedicated injection token that resolves to
     * a `ClientGrpc` instance obtained from the GrpcClientManager.
     *
     * @param serviceNames - Array of service keys (must match keys in forRoot config)
     */
    static forFeature(serviceNames: string[]): DynamicModule;
    /**
     * Register gRPC transport with async configuration.
     *
     * Useful when the configuration depends on other providers
     * (e.g., NacosConfigService for dynamic configuration).
     *
     * @param options - Async module options
     */
    static forRootAsync(options: {
        useFactory: (...args: any[]) => GrpcModuleOptions | Promise<GrpcModuleOptions>;
        inject?: any[];
        imports?: any[];
    }): DynamicModule;
}
