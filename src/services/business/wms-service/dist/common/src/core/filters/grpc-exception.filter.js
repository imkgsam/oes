"use strict";
// File: src/common/src/core/filters/grpc-exception.filter.ts
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GrpcExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const grpc_js_1 = require("@grpc/grpc-js");
const microservices_1 = require("@nestjs/microservices");
const app_logger_service_1 = require("../../logging/app-logger.service");
const rxjs_1 = require("rxjs");
const oes_exception_1 = require("../exceptions/oes.exception");
const exceptions_1 = require("../exceptions");
const tracing_1 = require("../../tracing");
let GrpcExceptionFilter = class GrpcExceptionFilter {
    logger;
    constructor(logger) {
        this.logger = logger;
    }
    catch(exception, host) {
        (0, tracing_1.recordExceptionToActiveSpan)(exception);
        const rpcCtx = host.switchToRpc();
        const call = host.getArgByIndex(2);
        const methodName = this.getMethodName(call);
        const module = process.env.MODULE_NAME || 'unknown-service';
        if (exception instanceof microservices_1.RpcException) {
            const payload = this.normalizeRpcPayload(exception.getError());
            this.logger.warn('Downstream rpc exception', {
                module,
                operation: methodName,
                errorCode: payload.code,
                details: payload.details,
                traceId: payload.meta?.traceId
            });
            return (0, rxjs_1.throwError)(() => this.toGrpcTransportError(payload));
        }
        else if (exception instanceof common_1.HttpException) {
            const payload = this.mapHttpException(exception);
            this.logger.warn('Http exception', {
                module,
                operation: methodName,
                errorCode: payload.code,
                details: payload.details,
                traceId: payload.meta?.traceId
            });
            return (0, rxjs_1.throwError)(() => this.toGrpcTransportError(payload));
        }
        else if (exception instanceof oes_exception_1.OESExceptionBase) {
            const payload = exception.toRpcPayload();
            this.logger.warn('Local business exception', {
                module,
                operation: methodName,
                errorCode: payload.code,
                details: payload.details,
                traceId: payload.meta?.traceId
            });
            return (0, rxjs_1.throwError)(() => this.toGrpcTransportError(payload));
        }
        else {
            const unknownExp = exceptions_1.ExceptionFactory.infrastructure(exceptions_1.UNKNOWN_EXCEPTION, {
                stack: exception?.stack,
                message: exception?.message
            });
            const payload = unknownExp.toRpcPayload();
            this.logger.error('Unhandled unknown exception', {
                module,
                operation: methodName,
                errorCode: payload.code,
                details: payload.details,
                traceId: payload.meta?.traceId
            });
            return (0, rxjs_1.throwError)(() => this.toGrpcTransportError(payload));
        }
    }
    // Builds the gRPC transport error shape expected by @grpc/grpc-js while preserving the OES payload.
    toGrpcTransportError(payload) {
        return {
            code: payload.grpcStatus,
            details: JSON.stringify(payload),
            message: payload.message
        };
    }
    getMethodName(call) {
        const candidates = [
            call?.call?.handler?.path,
            call?.handler?.path,
            call?.call?.path,
            call?.path,
            call?.call?.method,
            call?.method
        ];
        for (const candidate of candidates) {
            if (typeof candidate === 'string' && candidate.trim().length > 0) {
                return candidate;
            }
        }
        return 'unknown-method';
    }
    normalizeRpcPayload(error) {
        if (!error || typeof error !== 'object') {
            return {
                grpcStatus: 2,
                code: exceptions_1.UNKNOWN_EXCEPTION.code,
                message: 'Unknown error'
            };
        }
        const candidate = error;
        return {
            grpcStatus: candidate.grpcStatus ?? candidate.code ?? 2,
            code: candidate.code && typeof candidate.code === 'string'
                ? candidate.code
                : candidate.details?.code ?? exceptions_1.UNKNOWN_EXCEPTION.code,
            message: candidate.message ?? 'Unknown error',
            messageKey: candidate.messageKey,
            details: candidate.details,
            meta: candidate.meta
        };
    }
    mapHttpException(exception) {
        const response = exception.getResponse();
        const statusCode = exception.getStatus();
        const responseObject = typeof response === 'object' && response !== null ? response : undefined;
        const message = typeof response === 'string'
            ? response
            : Array.isArray(response?.message)
                ? response.message.join('; ')
                : response?.message ?? exception.message;
        if (responseObject?.code && typeof responseObject.code === 'string') {
            return {
                grpcStatus: this.httpStatusToGrpcStatus(statusCode),
                code: responseObject.code,
                message,
                messageKey: typeof responseObject.messageKey === 'string'
                    ? responseObject.messageKey
                    : undefined,
                details: responseObject.details ?? responseObject,
                meta: {
                    service: process.env.MODULE_NAME || 'unknown-service',
                    timestamp: new Date().toISOString()
                }
            };
        }
        if (statusCode === common_1.HttpStatus.BAD_REQUEST) {
            return {
                grpcStatus: this.httpStatusToGrpcStatus(statusCode),
                code: exceptions_1.VALIDATION_FAILED.code,
                message,
                messageKey: exceptions_1.VALIDATION_FAILED.messageKey,
                details: responseObject,
                meta: {
                    service: process.env.MODULE_NAME || 'unknown-service',
                    timestamp: new Date().toISOString()
                }
            };
        }
        return {
            grpcStatus: this.httpStatusToGrpcStatus(statusCode),
            code: this.defaultHttpExceptionCode(statusCode),
            message,
            messageKey: undefined,
            details: responseObject,
            meta: {
                service: process.env.MODULE_NAME || 'unknown-service',
                timestamp: new Date().toISOString()
            }
        };
    }
    httpStatusToGrpcStatus(httpStatus) {
        switch (httpStatus) {
            case common_1.HttpStatus.BAD_REQUEST:
                return grpc_js_1.status.INVALID_ARGUMENT;
            case common_1.HttpStatus.UNAUTHORIZED:
                return grpc_js_1.status.UNAUTHENTICATED;
            case common_1.HttpStatus.FORBIDDEN:
                return grpc_js_1.status.PERMISSION_DENIED;
            case common_1.HttpStatus.NOT_FOUND:
                return grpc_js_1.status.NOT_FOUND;
            case common_1.HttpStatus.CONFLICT:
                return grpc_js_1.status.ALREADY_EXISTS;
            case common_1.HttpStatus.PRECONDITION_FAILED:
                return grpc_js_1.status.FAILED_PRECONDITION;
            case common_1.HttpStatus.TOO_MANY_REQUESTS:
                return grpc_js_1.status.RESOURCE_EXHAUSTED;
            case common_1.HttpStatus.SERVICE_UNAVAILABLE:
                return grpc_js_1.status.UNAVAILABLE;
            default:
                return grpc_js_1.status.INTERNAL;
        }
    }
    defaultHttpExceptionCode(httpStatus) {
        switch (httpStatus) {
            case common_1.HttpStatus.UNAUTHORIZED:
                return 'HTTP_UNAUTHENTICATED';
            case common_1.HttpStatus.FORBIDDEN:
                return 'HTTP_PERMISSION_DENIED';
            case common_1.HttpStatus.NOT_FOUND:
                return 'HTTP_NOT_FOUND';
            case common_1.HttpStatus.CONFLICT:
                return 'HTTP_ALREADY_EXISTS';
            case common_1.HttpStatus.PRECONDITION_FAILED:
                return 'HTTP_FAILED_PRECONDITION';
            case common_1.HttpStatus.TOO_MANY_REQUESTS:
                return 'HTTP_RESOURCE_EXHAUSTED';
            case common_1.HttpStatus.SERVICE_UNAVAILABLE:
                return 'HTTP_UNAVAILABLE';
            default:
                return 'HTTP_INTERNAL_ERROR';
        }
    }
};
exports.GrpcExceptionFilter = GrpcExceptionFilter;
exports.GrpcExceptionFilter = GrpcExceptionFilter = __decorate([
    (0, common_1.Catch)(),
    __metadata("design:paramtypes", [app_logger_service_1.AppLogger])
], GrpcExceptionFilter);
//# sourceMappingURL=grpc-exception.filter.js.map