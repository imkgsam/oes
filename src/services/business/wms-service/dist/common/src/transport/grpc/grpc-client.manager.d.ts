/**
 * @file gRPC client manager — central orchestrator for gRPC connections
 * @module transport/grpc
 *
 * Manages per-service connection pools, integrates with Nacos service discovery,
 * and provides the primary API for obtaining gRPC clients.
 */
import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { GrpcConnectionPool } from './grpc-connection-pool';
import { GrpcModuleOptions } from './grpc.interfaces';
import { NacosDiscoveryService } from '../../registry/nacos-discovery.service';
import { AppLogger } from '../../logging';
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
export declare class GrpcClientManager implements OnModuleInit, OnModuleDestroy {
    private readonly logger;
    private readonly options;
    private readonly discovery?;
    private readonly pools;
    private readonly loadBalancer;
    private healthCheckTimer?;
    constructor(logger: AppLogger, options: GrpcModuleOptions, discovery?: NacosDiscoveryService);
    onModuleInit(): Promise<void>;
    /**
     * Get a gRPC client for the specified service.
     *
     * @param serviceName - The service key as defined in GrpcModuleOptions.services
     * @returns A ClientGrpc instance ready for use
     * @throws Error if the service is not configured or no endpoints are available
     */
    getClient(serviceName: string): Promise<ClientGrpc>;
    /**
     * Get pool statistics for monitoring/observability.
     */
    getPoolStats(): Record<string, ReturnType<GrpcConnectionPool['getStats']>>;
    onModuleDestroy(): Promise<void>;
    private getOrCreatePool;
    /**
     * Resolve endpoints for a service config.
     *
     * If a static URL is configured, use it directly.
     * Otherwise, query Nacos discovery for live instances.
     */
    private resolveEndpoints;
    /**
     * Run health checks across all pools and refresh endpoints from discovery.
     */
    private runHealthChecks;
}
