"use strict";
/**
 * @file gRPC transport constants and token utilities
 * @module transport/grpc
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GRPC_MODULE_OPTIONS = void 0;
exports.getGrpcClientToken = getGrpcClientToken;
/**
 * Injection token for GrpcTransportModule options
 */
exports.GRPC_MODULE_OPTIONS = Symbol('GRPC_MODULE_OPTIONS');
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
function getGrpcClientToken(serviceName) {
    return `GRPC_CLIENT_${serviceName}`;
}
//# sourceMappingURL=grpc.constants.js.map