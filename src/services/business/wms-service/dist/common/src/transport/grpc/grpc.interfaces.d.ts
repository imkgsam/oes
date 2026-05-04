/**
 * @file gRPC transport interfaces and type definitions
 * @module transport/grpc
 */
import { ChannelOptions } from '@grpc/grpc-js';
/**
 * Configuration for a single gRPC service endpoint.
 *
 * Each entry describes how to connect to a specific downstream gRPC service,
 * including its proto definition and optional connection pool settings.
 */
export interface GrpcServiceConfig {
    /** Unique service name used for discovery and injection (e.g., 'permission-service') */
    serviceName: string;
    /** Path to one or more .proto files relative to the project root */
    protoPath: string | string[];
    /** Protobuf package name as defined in the .proto file */
    packageName: string;
    /**
     * Static URL override. When set, Nacos discovery is bypassed for this service.
     * Format: 'host:port' (e.g., 'localhost:50051')
     */
    url?: string;
    /** gRPC channel options (keepalive, max message size, etc.) */
    channelOptions?: ChannelOptions;
    /** Connection pool configuration for this service */
    pool?: GrpcPoolConfig;
}
/**
 * Connection pool configuration.
 *
 * Controls how many gRPC connections are maintained per service,
 * idle timeout behavior, and health check intervals.
 */
export interface GrpcPoolConfig {
    /** Minimum number of connections to keep alive (default: 1) */
    minSize?: number;
    /** Maximum number of connections allowed (default: 10) */
    maxSize?: number;
    /** Time in ms before an idle connection is evicted (default: 60000) */
    idleTimeoutMs?: number;
    /** Time in ms to wait when acquiring a connection from a full pool (default: 5000) */
    acquireTimeoutMs?: number;
    /** Interval in ms between health check sweeps (default: 15000) */
    healthCheckIntervalMs?: number;
}
/**
 * Top-level options for GrpcTransportModule.forRoot().
 */
export interface GrpcModuleOptions {
    /**
     * Map of service name → service config.
     * Each key is used as the injection token suffix.
     */
    services: Record<string, GrpcServiceConfig>;
    /** Default pool config applied to all services unless overridden */
    defaultPoolConfig?: GrpcPoolConfig;
    /** Default gRPC channel options applied to all services unless overridden */
    defaultChannelOptions?: ChannelOptions;
}
/**
 * Resolved pool configuration with all defaults applied.
 */
export interface ResolvedPoolConfig {
    minSize: number;
    maxSize: number;
    idleTimeoutMs: number;
    acquireTimeoutMs: number;
    healthCheckIntervalMs: number;
}
/**
 * Default pool configuration values.
 */
export declare const DEFAULT_POOL_CONFIG: ResolvedPoolConfig;
/**
 * Resolves a partial pool config into a fully-specified config by applying defaults.
 */
export declare function resolvePoolConfig(servicePool?: GrpcPoolConfig, defaultPool?: GrpcPoolConfig): ResolvedPoolConfig;
