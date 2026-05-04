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
export declare class RegistryModule {
}
