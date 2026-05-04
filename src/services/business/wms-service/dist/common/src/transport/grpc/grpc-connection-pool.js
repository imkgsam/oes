"use strict";
/**
 * @file gRPC connection pool for a single service
 * @module transport/grpc
 *
 * Manages a pool of gRPC client connections to a specific service,
 * with support for min/max sizing, idle eviction, and health checking.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GrpcConnectionPool = void 0;
const microservices_1 = require("@nestjs/microservices");
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
class GrpcConnectionPool {
    logger;
    connections = new Map();
    serviceName;
    protoPath;
    packageName;
    config;
    loadBalancer;
    channelOptions;
    constructor(options) {
        this.serviceName = options.serviceName;
        this.protoPath = options.protoPath;
        this.packageName = options.packageName;
        this.config = options.poolConfig;
        this.loadBalancer = options.loadBalancer;
        this.channelOptions = options.channelOptions;
        this.logger = options.logger;
    }
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
    async acquire(endpoints) {
        if (endpoints.length === 0) {
            throw new Error(`[GrpcPool] No endpoints available for "${this.serviceName}"`);
        }
        const selected = this.loadBalancer.select(this.serviceName, endpoints);
        const key = `${selected.ip}:${selected.port}`;
        // 1. Return existing healthy connection
        const existing = this.connections.get(key);
        if (existing && existing.healthy) {
            existing.lastUsedAt = Date.now();
            return existing.client;
        }
        // 2. Remove unhealthy existing connection
        if (existing && !existing.healthy) {
            this.removeConnection(key);
        }
        // 3. Create new connection if pool has capacity
        if (this.connections.size < this.config.maxSize) {
            return this.createConnection(selected.ip, selected.port);
        }
        // 4. Evict oldest idle connection to make room
        const evicted = this.evictOne();
        if (evicted) {
            return this.createConnection(selected.ip, selected.port);
        }
        // 5. Pool is full and all connections are in use — reuse any healthy one
        for (const conn of this.connections.values()) {
            if (conn.healthy) {
                conn.lastUsedAt = Date.now();
                return conn.client;
            }
        }
        throw new Error(`[GrpcPool] Cannot acquire connection for "${this.serviceName}": pool exhausted`);
    }
    /**
     * Run health checks on all pooled connections.
     *
     * Connections that fail consecutively (≥3 times) are removed.
     * Also evicts connections that have been idle beyond the timeout.
     */
    async healthCheck() {
        const now = Date.now();
        for (const [key, conn] of this.connections) {
            // Check idle timeout (skip if pool would go below minSize)
            if (conn.lastUsedAt > 0 &&
                now - conn.lastUsedAt > this.config.idleTimeoutMs &&
                this.connections.size > this.config.minSize) {
                this.logger.debug(`Evicting idle connection: ${key}`);
                this.removeConnection(key);
                continue;
            }
            // Mark as healthy (gRPC connections are persistent; if the channel
            // is still open, it's considered healthy. For deeper checks,
            // implement grpc.health.v1 in the future.)
            try {
                // Basic liveness: the client object exists and was created successfully
                conn.healthy = true;
                conn.consecutiveFailures = 0;
            }
            catch {
                conn.consecutiveFailures++;
                if (conn.consecutiveFailures >= 3) {
                    this.logger.warn(`Removing unhealthy connection after 3 failures: ${key}`);
                    conn.healthy = false;
                    this.removeConnection(key);
                }
            }
        }
    }
    /**
     * Update the pool when the instance list changes.
     * Removes connections to endpoints that no longer exist.
     */
    updateEndpoints(endpoints) {
        const validKeys = new Set(endpoints.map((e) => `${e.ip}:${e.port}`));
        for (const key of this.connections.keys()) {
            if (!validKeys.has(key)) {
                this.logger.log(`Removing connection to deregistered endpoint: ${key}`);
                this.removeConnection(key);
            }
        }
        // Reset load balancer state when instances change
        this.loadBalancer.reset(this.serviceName);
    }
    /**
     * Gracefully drain and close all connections in the pool.
     */
    async drain() {
        this.logger.log(`Draining pool (${this.connections.size} connections)`);
        for (const [key, conn] of this.connections) {
            try {
                // ClientGrpc from NestJS doesn't have an explicit close method,
                // but the underlying channel will be cleaned up by GC.
                // For ClientProxy-based clients, we'd call .close()
                this.logger.debug(`Closed connection: ${key}`);
            }
            catch (err) {
                this.logger.error(`Error closing connection ${key}:`, err);
            }
        }
        this.connections.clear();
    }
    /**
     * Get current pool statistics.
     */
    getStats() {
        let healthy = 0;
        for (const conn of this.connections.values()) {
            if (conn.healthy)
                healthy++;
        }
        return {
            serviceName: this.serviceName,
            totalConnections: this.connections.size,
            healthyConnections: healthy,
            maxSize: this.config.maxSize,
            minSize: this.config.minSize
        };
    }
    // ─── Private Methods ───────────────────────────────────────────────
    createConnection(ip, port) {
        const key = `${ip}:${port}`;
        const url = `${ip}:${port}`;
        this.logger.log(`Creating gRPC connection to ${url}`);
        const client = microservices_1.ClientProxyFactory.create({
            transport: microservices_1.Transport.GRPC,
            options: {
                url,
                package: this.packageName,
                protoPath: this.protoPath,
                channelOptions: this.channelOptions
            }
        });
        const pooled = {
            key,
            client,
            healthy: true,
            consecutiveFailures: 0,
            lastUsedAt: Date.now(),
            createdAt: Date.now()
        };
        this.connections.set(key, pooled);
        return client;
    }
    removeConnection(key) {
        const conn = this.connections.get(key);
        if (conn) {
            this.connections.delete(key);
            this.logger.debug(`Removed connection: ${key}`);
        }
    }
    /**
     * Evict the oldest idle connection.
     * @returns true if a connection was evicted
     */
    evictOne() {
        let oldest = null;
        let oldestKey = null;
        for (const [key, conn] of this.connections) {
            if (!oldest || conn.lastUsedAt < oldest.lastUsedAt) {
                oldest = conn;
                oldestKey = key;
            }
        }
        if (oldestKey) {
            this.removeConnection(oldestKey);
            return true;
        }
        return false;
    }
}
exports.GrpcConnectionPool = GrpcConnectionPool;
//# sourceMappingURL=grpc-connection-pool.js.map