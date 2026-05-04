"use strict";
// File: src/common/src/transport/grpc/safe-grpc-call.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.safeGrpcCall = safeGrpcCall;
/**
 * @file gRPC 安全调用工具
 * @module transport/grpc
 *
 * 封装 gRPC 调用的通用逻辑：超时控制与技术层异常分类。
 * - 标准下游业务异常（RpcExceptionPayload）直接透传
 * - 基础设施异常（timeout / unavailable 等）包装为本服务的 InfrastructureException
 * - 非标准 RpcException 与原生 gRPC 错误统一视为 infra 异常
 */
const grpc_js_1 = require("@grpc/grpc-js");
const microservices_1 = require("@nestjs/microservices");
const rxjs_1 = require("rxjs");
const exceptions_1 = require("../../core/exceptions");
const infrastructure_exception_enum_1 = require("../../core/exceptions/exception-enums/infrastructure-exception.enum");
const DEFAULT_TIMEOUT_MS = 5000;
/**
 * 安全执行 gRPC 调用。
 *
 * 处理策略：
 * 1. 超时 → 包装为 InfrastructureException
 * 2. 标准下游业务异常（RpcExceptionPayload）→ 直接透传
 * 3. 下游基础设施异常（UNAVAILABLE 等）→ 包装为 InfrastructureException
 * 4. 非标准 RpcException、原生 gRPC error、未知异常 → 包装为 InfrastructureException
 */
async function safeGrpcCall(call$, options) {
    const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    try {
        return await (0, rxjs_1.firstValueFrom)(call$.pipe((0, rxjs_1.timeout)(timeoutMs)));
    }
    catch (error) {
        throw classifyAndWrap(error, options);
    }
}
function classifyAndWrap(error, options) {
    const context = buildContext(options);
    if (error instanceof rxjs_1.TimeoutError) {
        return wrapInfrastructureError(context, 'TIMEOUT', {
            message: `gRPC 调用超时（${options?.timeoutMs ?? DEFAULT_TIMEOUT_MS}ms）`
        });
    }
    if (error instanceof microservices_1.RpcException) {
        const payload = error.getError();
        if (!isRpcExceptionPayload(payload)) {
            return wrapInfrastructureError(context, 'NON_STANDARD_RPC_EXCEPTION', {
                originalMessage: getErrorMessage(payload),
                originalDetails: getErrorDetails(payload)
            });
        }
        if (isInfrastructureRpcPayload(payload)) {
            return wrapInfrastructureError(context, grpcStatusName(payload.grpcStatus), {
                originalMessage: payload.message,
                originalDetails: payload.details
            });
        }
        return error;
    }
    if (isGrpcNativeError(error)) {
        const payload = parseGrpcNativePayload(error);
        if (payload) {
            if (isInfrastructureRpcPayload(payload)) {
                return wrapInfrastructureError(context, grpcStatusName(payload.grpcStatus), {
                    originalMessage: payload.message,
                    originalDetails: payload.details
                });
            }
            return new microservices_1.RpcException(payload);
        }
        return wrapInfrastructureError(context, grpcStatusName(error.code), {
            originalMessage: error.message,
            originalDetails: error.details
        });
    }
    return wrapInfrastructureError(context, 'UNKNOWN', {
        originalMessage: getErrorMessage(error),
        stack: getErrorStack(error)
    });
}
function buildContext(options) {
    return {
        caller: options?.caller,
        method: options?.method
    };
}
function wrapInfrastructureError(context, reason, details) {
    return exceptions_1.ExceptionFactory.infrastructure(infrastructure_exception_enum_1.INTERNAL_SERVICE_UNAVAILABLE, {
        ...context,
        reason,
        ...details
    });
}
// Classifies standardized OES payloads by semantic error code to avoid degrading business payloads.
function isInfrastructureRpcPayload(payload) {
    return payload.code.startsWith('INFRA_');
}
function isRpcExceptionPayload(value) {
    if (typeof value !== 'object' || value === null) {
        return false;
    }
    const candidate = value;
    return (typeof candidate.grpcStatus === 'number' &&
        typeof candidate.code === 'string' &&
        typeof candidate.message === 'string');
}
// Restores an OES RpcExceptionPayload from the JSON details emitted by GrpcExceptionFilter.
function parseGrpcNativePayload(error) {
    const details = error.details;
    if (typeof details !== 'string') {
        return null;
    }
    try {
        const parsed = JSON.parse(details);
        if (isRpcExceptionPayload(parsed)) {
            return parsed;
        }
    }
    catch {
        return null;
    }
    return null;
}
/**
 * 判断是否为 gRPC 原生错误（非 NestJS RpcException）。
 *
 * 常见形态近似：
 * `{ message: '14 UNAVAILABLE: No connection established', code: 14, details: 'No connection established' }`
 */
function isGrpcNativeError(error) {
    if (!(error instanceof Error)) {
        return false;
    }
    const candidate = error;
    return typeof candidate.code === 'number' && candidate.code >= 0 && candidate.code <= 16;
}
function grpcStatusName(code) {
    return grpc_js_1.status[code] ?? 'UNKNOWN';
}
function getErrorMessage(error) {
    if (error instanceof Error) {
        return error.message;
    }
    if (typeof error === 'object' && error !== null) {
        const candidate = error;
        if (typeof candidate.message === 'string') {
            return candidate.message;
        }
    }
    return undefined;
}
function getErrorDetails(error) {
    if (typeof error !== 'object' || error === null) {
        return undefined;
    }
    const candidate = error;
    return candidate.details;
}
function getErrorStack(error) {
    if (error instanceof Error) {
        return error.stack;
    }
    return undefined;
}
//# sourceMappingURL=safe-grpc-call.js.map