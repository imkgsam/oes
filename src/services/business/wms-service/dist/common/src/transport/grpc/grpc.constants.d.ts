/**
 * @file gRPC transport constants and token utilities
 * @module transport/grpc
 */
/**
 * Injection token for GrpcTransportModule options
 */
export declare const GRPC_MODULE_OPTIONS: unique symbol;
/**
 * Generates a unique injection token for a gRPC service client.
 *
 * @param serviceName - The name of the target service (e.g., 'permission-service')
 * @returns A unique string token for DI
 *
 * @example
 * ```typescript
 * const token = getGrpcClientToken('permission-service')
 * // => 'GRPC_CLIENT_permission-service'
 * ```
 */
export declare function getGrpcClientToken(serviceName: string): string;
