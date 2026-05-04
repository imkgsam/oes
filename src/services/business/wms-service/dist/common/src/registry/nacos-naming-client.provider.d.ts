import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { NacosNamingClient } from 'nacos';
import { AppLogger } from '../logging/app-logger.service';
/**
 * Injection token for the Nacos naming client provider.
 */
export declare const NACOS_NAMING_CLIENT: unique symbol;
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
export declare class NacosNamingClientProvider implements OnModuleInit, OnModuleDestroy {
    private readonly logger;
    private client;
    constructor(logger: AppLogger);
    onModuleInit(): Promise<void>;
    /**
     * Get the underlying NacosNamingClient instance.
     *
     * @throws Error if the client has not been initialized
     */
    getClient(): NacosNamingClient;
    /**
     * Check if the client is initialized and ready.
     */
    isReady(): boolean;
    onModuleDestroy(): Promise<void>;
}
