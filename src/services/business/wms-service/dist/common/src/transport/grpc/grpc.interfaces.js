"use strict";
/**
 * @file gRPC transport interfaces and type definitions
 * @module transport/grpc
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_POOL_CONFIG = void 0;
exports.resolvePoolConfig = resolvePoolConfig;
/**
 * Default pool configuration values.
 */
exports.DEFAULT_POOL_CONFIG = {
    minSize: 1,
    maxSize: 10,
    idleTimeoutMs: 60_000,
    acquireTimeoutMs: 5_000,
    healthCheckIntervalMs: 15_000
};
/**
 * Resolves a partial pool config into a fully-specified config by applying defaults.
 */
function resolvePoolConfig(servicePool, defaultPool) {
    return {
        minSize: servicePool?.minSize ?? defaultPool?.minSize ?? exports.DEFAULT_POOL_CONFIG.minSize,
        maxSize: servicePool?.maxSize ?? defaultPool?.maxSize ?? exports.DEFAULT_POOL_CONFIG.maxSize,
        idleTimeoutMs: servicePool?.idleTimeoutMs ?? defaultPool?.idleTimeoutMs ?? exports.DEFAULT_POOL_CONFIG.idleTimeoutMs,
        acquireTimeoutMs: servicePool?.acquireTimeoutMs ??
            defaultPool?.acquireTimeoutMs ??
            exports.DEFAULT_POOL_CONFIG.acquireTimeoutMs,
        healthCheckIntervalMs: servicePool?.healthCheckIntervalMs ??
            defaultPool?.healthCheckIntervalMs ??
            exports.DEFAULT_POOL_CONFIG.healthCheckIntervalMs
    };
}
//# sourceMappingURL=grpc.interfaces.js.map