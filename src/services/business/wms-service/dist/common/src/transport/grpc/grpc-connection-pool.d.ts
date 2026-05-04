/**
 * @file gRPC connection pool for a single service
 * @module transport/grpc
 *
 * Manages a pool of gRPC client connections to a specific service,
 * with support for min/max sizing, idle eviction, and health checking.
 */
import { ClientGrpc } from '@nestjs/microservices';
import { ChannelOptions } from '@grpc/grpc-js';
import { ResolvedPoolConfig } from './grpc.interfaces';
import { LoadBalancer, ServiceEndpoint } from '../loadbalancer/loadbalancer.interface';
import { AppLogger } from '../../logging';
/**
 * Connection pool for a single gRPC service.
 *
 * Maintains a set of gRPC client connections, automatically creating
 * new connections as needed and evicting idle or unhealthy ones.
 *
 * Key features:
 * - Min/max pool sizing
 * - Idle connection eviction
 * - Health check with automatic fault removal
 * - Load-balanced endpoint selection
 *
 * @example
 * ```typescript
 * const pool = new GrpcConnectionPool({
 *   serviceName: 'permission-service',
 *   protoPath: 'protos/permission_check.proto',
 *   packageName: 'permission_service',
 *   poolConfig: { minSize: 2, maxSize: 10, idleTimeoutMs: 60000 },
 *   loadBalancer: new RoundRobinStrategy(),
 * })
 *
 * const client = await pool.acquire(endpoints)
 * const svc = client.getService<PermissionCheckService>('PermissionCheckService')
 * ```
 */
export declare class GrpcConnectionPool {
    private readonly logger;
    private readonly connections;
    private readonly serviceName;
    private readonly protoPath;
    private readonly packageName;
    private readonly config;
    private readonly loadBalancer;
    private readonly channelOptions?;
    constructor(options: {
        logger: AppLogger;
        serviceName: string;
        protoPath: string | string[];
        packageName: string;
        poolConfig: ResolvedPoolConfig;
        loadBalancer: LoadBalancer;
        channelOptions?: ChannelOptions;
    });
    /**
     * Acquire a gRPC client connection from the pool.
     *
     * Selection logic:
     * 1. Use load balancer to pick an endpoint
     * 2. If a healthy connection exists for that endpoint, return it
     * 3. If pool is not full, create a new connection
     * 4. If pool is full, evict an idle connection and create a new one
     *
     * @param endpoints - Available service endpoints from discovery
     * @returns A gRPC client instance
     * @throws Error if no endpoints are available or pool cannot acquire
     */
    acquire(endpoints: ServiceEndpoint[]): Promise<ClientGrpc>;
    /**
     * Run health checks on all pooled connections.
     *
     * Connections that fail consecutively (≥3 times) are removed.
     * Also evicts connections that have been idle beyond the timeout.
     */
    healthCheck(): Promise<void>;
    /**
     * Update the pool when the instance list changes.
     * Removes connections to endpoints that no longer exist.
     */
    updateEndpoints(endpoints: ServiceEndpoint[]): void;
    /**
     * Gracefully drain and close all connections in the pool.
     */
    drain(): Promise<void>;
    /**
     * Get current pool statistics.
     */
    getStats(): {
        serviceName: string;
        totalConnections: number;
        healthyConnections: number;
        maxSize: number;
        minSize: number;
    };
    private createConnection;
    private removeConnection;
    /**
     * Evict the oldest idle connection.
     * @returns true if a connection was evicted
     */
    private evictOne;
}
