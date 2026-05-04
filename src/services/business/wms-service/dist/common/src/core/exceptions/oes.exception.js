"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationException = exports.InfrastructureException = exports.DomainException = exports.OESExceptionBase = void 0;
// src/common/core/exceptions/oes.exception.ts
const grpc_js_1 = require("@grpc/grpc-js");
const common_1 = require("@nestjs/common");
const tracing_1 = require("../../tracing");
const getCurrentServiceName = () => {
    return process.env.MODULE_NAME || 'unknown-service';
};
class OESExceptionBase extends Error {
    definition;
    additionalDetails;
    constructor(def, additionalDetails) {
        super(def.message);
        this.name = this.constructor.name;
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
        this.definition = def;
        this.additionalDetails = additionalDetails;
    }
    toRpcPayload() {
        return {
            grpcStatus: this.definition.rpcStatus,
            code: this.definition.code,
            message: this.definition.message,
            messageKey: this.definition.messageKey,
            details: this.normalizeDetails(),
            meta: {
                service: getCurrentServiceName(),
                timestamp: new Date().toISOString(),
                traceId: (0, tracing_1.getTraceId)()
            }
        };
    }
    toHttpPayload() {
        return {
            code: this.definition.code,
            message: this.definition.message,
            messageKey: this.definition.messageKey,
            details: this.normalizeDetails(),
            meta: {
                service: getCurrentServiceName(),
                timestamp: new Date().toISOString(),
                traceId: (0, tracing_1.getTraceId)()
            }
        };
    }
    getHttpStatus() {
        return this.definition.httpStatus ?? grpcStatusToHttpStatus(this.definition.rpcStatus);
    }
    getRpcStatus() {
        return this.definition.rpcStatus;
    }
    getCode() {
        return this.definition.code;
    }
    getI18nKey() {
        return this.definition.messageKey;
    }
    normalizeDetails() {
        if (this.additionalDetails == null) {
            return undefined;
        }
        if (typeof this.additionalDetails === 'object' && !Array.isArray(this.additionalDetails)) {
            return this.additionalDetails;
        }
        return {
            value: this.additionalDetails
        };
    }
}
exports.OESExceptionBase = OESExceptionBase;
class DomainException extends OESExceptionBase {
}
exports.DomainException = DomainException;
class InfrastructureException extends OESExceptionBase {
}
exports.InfrastructureException = InfrastructureException;
class ApplicationException extends OESExceptionBase {
}
exports.ApplicationException = ApplicationException;
/**
 * gRPC Status -> HTTP Status 映射
 */
function grpcStatusToHttpStatus(code) {
    switch (code) {
        case grpc_js_1.status.INVALID_ARGUMENT:
            return common_1.HttpStatus.BAD_REQUEST;
        case grpc_js_1.status.NOT_FOUND:
            return common_1.HttpStatus.NOT_FOUND;
        case grpc_js_1.status.ALREADY_EXISTS:
            return common_1.HttpStatus.CONFLICT;
        case grpc_js_1.status.PERMISSION_DENIED:
            return common_1.HttpStatus.FORBIDDEN;
        case grpc_js_1.status.UNAUTHENTICATED:
            return common_1.HttpStatus.UNAUTHORIZED;
        case grpc_js_1.status.FAILED_PRECONDITION:
            return common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        case grpc_js_1.status.UNAVAILABLE:
        case grpc_js_1.status.DEADLINE_EXCEEDED:
            return common_1.HttpStatus.SERVICE_UNAVAILABLE;
        case grpc_js_1.status.INTERNAL:
        default:
            return common_1.HttpStatus.INTERNAL_SERVER_ERROR;
    }
}
//# sourceMappingURL=oes.exception.js.map