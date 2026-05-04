"use strict";
/**
 * @file gRPC client manager — central orchestrator for gRPC connections
 * @module transport/grpc
 *
 * Manages per-service connection pools, integrates with Nacos service discovery,
 * and provides the primary API for obtaining gRPC clients.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var GrpcClientManager_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GrpcClientManager = void 0;
const common_1 = require("@nestjs/common");
const grpc_connection_pool_1 = require("./grpc-connection-pool");
const grpc_interfaces_1 = require("./grpc.interfaces");
const grpc_constants_1 = require("./grpc.constants");
const round_robin_strategy_1 = require("../loadbalancer/round-robin.strategy");
const nacos_discovery_service_1 = require("../../registry/nacos-discovery.service");
const logging_1 = require("../../logging");
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
let GrpcClientManager = GrpcClientManager_1 = class GrpcClientManager {
    logger;
    options;
    discovery;
    pools = new Map();
    loadBalancer;
    healthCheckTimer;
    constructor(logger, options, discovery) {
        this.logger = logger;
        this.options = options;
        this.discovery = discovery;
        this.loadBalancer = new round_robin_strategy_1.RoundRobinStrategy();
        this.logger = logger.child({ context: GrpcClientManager_1.name });
    }
    async onModuleInit() {
        this.logger.info('in GRPCCLIENTMANAGER onModuleInit ');
        // Subscribe to all configured services via Nacos discovery
        if (this.discovery) {
            this.logger.info(this.discovery);
            const subscribePromises = Object.values(this.options.services)
                .filter((svc) => !svc.url) // Only subscribe for services without static URL
                .map((svc) => this.discovery.subscribe(svc.serviceName));
            await Promise.all(subscribePromises);
            this.logger.log(`Subscribed to ${subscribePromises.length} services via Nacos discovery`);
        }
        // Initialize connection pools for all configured services
        for (const [key, config] of Object.entries(this.options.services)) {
            this.getOrCreatePool(key, config);
        }
        // Start periodic health check
        const interval = this.options.defaultPoolConfig?.healthCheckIntervalMs ?? 15_000;
        this.healthCheckTimer = setInterval(() => {
            this.runHealthChecks().catch((err) => {
                this.logger.error('Health check sweep failed', err);
            });
        }, interval);
        this.logger.log(`GrpcClientManager initialized with ${Object.keys(this.options.services).length} services`);
    }
    /**
     * Get a gRPC client for the specified service.
     *
     * @param serviceName - The service key as defined in GrpcModuleOptions.services
     * @returns A ClientGrpc instance ready for use
     * @throws Error if the service is not configured or no endpoints are available
     */
    async getClient(serviceName) {
        this.logger.info(`Getting gRPC client for service "${serviceName}"`);
        const config = this.options.services[serviceName];
        if (!config) {
            throw new Error(`[GrpcClientManager] Service "${serviceName}" is not configured. ` +
                `Available services: ${Object.keys(this.options.services).join(', ')}`);
        }
        this.logger.info('config ', config);
        const pool = this.getOrCreatePool(serviceName, config);
        const endpoints = this.resolveEndpoints(config);
        this.logger.info('endpoints ', endpoints);
        return pool.acquire(endpoints);
    }
    /**
     * Get pool statistics for monitoring/observability.
     */
    getPoolStats() {
        const stats = {};
        for (const [name, pool] of this.pools) {
            stats[name] = pool.getStats();
        }
        return stats;
    }
    async onModuleDestroy() {
        // Stop health check timer
        if (this.healthCheckTimer) {
            clearInterval(this.healthCheckTimer);
        }
        // Drain all pools
        const drainPromises = Array.from(this.pools.values()).map((pool) => pool.drain());
        await Promise.all(drainPromises);
        this.logger.log('All gRPC connection pools drained');
    }
    // ─── Private Methods ───────────────────────────────────────────────
    getOrCreatePool(serviceName, config) {
        if (!this.pools.has(serviceName)) {
            const poolConfig = (0, grpc_interfaces_1.resolvePoolConfig)(config.pool, this.options.defaultPoolConfig);
            const pool = new grpc_connection_pool_1.GrpcConnectionPool({
                logger: this.logger,
                serviceName: config.serviceName,
                protoPath: config.protoPath,
                packageName: config.packageName,
                poolConfig,
                loadBalancer: this.loadBalancer,
                channelOptions: config.channelOptions ?? this.options.defaultChannelOptions
            });
            this.pools.set(serviceName, pool);
            this.logger.debug(`Created connection pool for "${serviceName}" ` +
                `(min=${poolConfig.minSize}, max=${poolConfig.maxSize})`);
        }
        return this.pools.get(serviceName);
    }
    /**
     * Resolve endpoints for a service config.
     *
     * If a static URL is configured, use it directly.
     * Otherwise, query Nacos discovery for live instances.
     */
    resolveEndpoints(config) {
        this.logger.info('in resolveEndpoints', config);
        // Static URL override (for development or non-Nacos environments)
        if (config.url) {
            const [ip, portStr] = config.url.split(':');
            return [
                {
                    ip,
                    port: parseInt(portStr, 10),
                    healthy: true,
                    weight: 1
                }
            ];
        }
        // Dynamic discovery via Nacos
        if (this.discovery) {
            this.logger.info('discovery ', this.discovery);
            const instances = this.discovery.getInstances(config.serviceName);
            this.logger.info('instance ', instances);
            return instances.map((inst) => ({
                ip: inst.ip,
                port: inst.port,
                healthy: true,
                weight: 1,
                metadata: inst.metadata
            }));
        }
        throw new Error(`[GrpcClientManager] No URL configured and no discovery service available ` +
            `for "${config.serviceName}". Either set a static URL or provide NacosDiscoveryService.`);
    }
    /**
     * Run health checks across all pools and refresh endpoints from discovery.
     */
    async runHealthChecks() {
        for (const [name, pool] of this.pools) {
            const config = this.options.services[name];
            if (config && !config.url && this.discovery) {
                // Refresh endpoints from Nacos
                const endpoints = this.discovery.getInstances(config.serviceName).map((inst) => ({
                    ip: inst.ip,
                    port: inst.port,
                    healthy: true,
                    weight: 1,
                    metadata: inst.metadata
                }));
                pool.updateEndpoints(endpoints);
            }
            await pool.healthCheck();
        }
    }
};
exports.GrpcClientManager = GrpcClientManager;
exports.GrpcClientManager = GrpcClientManager = GrpcClientManager_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(grpc_constants_1.GRPC_MODULE_OPTIONS)),
    __param(1, (0, common_1.Optional)()),
    __param(2, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [logging_1.AppLogger, Object, nacos_discovery_service_1.NacosDiscoveryService])
], GrpcClientManager);
//# sourceMappingURL=grpc-client.manager.js.map