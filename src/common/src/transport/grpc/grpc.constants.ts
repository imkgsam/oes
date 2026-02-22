/**
 * @file gRPC transport constants and token utilities
 * @module transport/grpc
 */

/**
 * Injection token for GrpcTransportModule options
 */
export const GRPC_MODULE_OPTIONS = Symbol('GRPC_MODULE_OPTIONS')

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
export function getGrpcClientToken(serviceName: string): string {
  return `GRPC_CLIENT_${serviceName}`
}
