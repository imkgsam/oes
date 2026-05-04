"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultGrpcMetadataPropagationFactory = void 0;
const common_1 = require("@nestjs/common");
const grpc_js_1 = require("@grpc/grpc-js");
const tracing_1 = require("../../tracing");
const constants_1 = require("../constants");
const utils_1 = require("../utils");
const DEFAULT_OPERATOR_CONTEXT_TTL_MS = 5 * 60 * 1000;
let DefaultGrpcMetadataPropagationFactory = class DefaultGrpcMetadataPropagationFactory {
    signer;
    constructor(signer) {
        this.signer = signer;
    }
    createInternalCallMetadata(input) {
        const metadata = new grpc_js_1.Metadata();
        metadata.set(constants_1.INTERNAL_SERVICE_NAME_METADATA_KEY, this.requireServiceName(input.callerServiceName));
        const requestId = this.normalizeOptional(input.requestId);
        const traceId = this.normalizeOptional(input.traceId) ?? (0, tracing_1.getTraceId)();
        if (requestId) {
            metadata.set(constants_1.REQUEST_ID_METADATA_KEY, requestId);
        }
        if (traceId) {
            metadata.set(constants_1.TRACE_ID_METADATA_KEY, traceId);
        }
        (0, tracing_1.injectGrpcTraceContext)(metadata);
        return metadata;
    }
    createOperatorScopedMetadata(input) {
        const metadata = this.createInternalCallMetadata(input);
        metadata.set(constants_1.OPERATOR_CONTEXT_METADATA_KEY, (0, utils_1.encodeOperatorContext)(this.buildPayload(input)));
        return metadata;
    }
    buildPayload(input) {
        const requestId = this.normalizeOptional(input.requestId) ?? this.normalizeOptional(input.operatorContext.requestId);
        const traceId = this.normalizeOptional(input.traceId) ??
            this.normalizeOptional(input.operatorContext.traceId) ??
            (0, tracing_1.getTraceId)();
        const issuedAtMs = Date.now();
        const expiresAtMs = issuedAtMs + DEFAULT_OPERATOR_CONTEXT_TTL_MS;
        const unsignedPayload = {
            operator_id: this.requireOperatorId(input.operatorContext.operatorId),
            operator_type: this.requireOperatorType(input.operatorContext.operatorType),
            tenant_id: this.normalizeOptional(input.operatorContext.tenantId),
            org_id: this.normalizeOptional(input.operatorContext.orgId),
            issued_at: new Date(issuedAtMs).toISOString(),
            expires_at: new Date(expiresAtMs).toISOString(),
            issuer: this.requireServiceName(input.callerServiceName),
            operator_roles: this.normalizeStringArray(input.operatorContext.operatorRoles),
            request_id: requestId,
            trace_id: traceId
        };
        return {
            ...unsignedPayload,
            signature: this.signer.sign(unsignedPayload)
        };
    }
    requireServiceName(value) {
        const normalized = value.trim();
        if (!normalized) {
            throw new Error('callerServiceName is required');
        }
        return normalized;
    }
    requireOperatorId(value) {
        const normalized = value.trim();
        if (!normalized) {
            throw new Error('operatorId is required');
        }
        return normalized;
    }
    requireOperatorType(value) {
        const normalized = value.trim();
        if (!normalized) {
            throw new Error('operatorType is required');
        }
        return normalized;
    }
    normalizeOptional(value) {
        const normalized = value?.trim();
        return normalized ? normalized : undefined;
    }
    normalizeStringArray(values) {
        if (!Array.isArray(values)) {
            return undefined;
        }
        const normalized = values.map((value) => value.trim()).filter(Boolean);
        return normalized.length > 0 ? normalized : undefined;
    }
};
exports.DefaultGrpcMetadataPropagationFactory = DefaultGrpcMetadataPropagationFactory;
exports.DefaultGrpcMetadataPropagationFactory = DefaultGrpcMetadataPropagationFactory = __decorate([
    (0, common_1.Injectable)()
    /** This factory builds standardized internal gRPC metadata, including service identity, correlation ids, and signed operator context. */
    ,
    __param(0, (0, common_1.Inject)(constants_1.OPERATOR_CONTEXT_SIGNER)),
    __metadata("design:paramtypes", [Object])
], DefaultGrpcMetadataPropagationFactory);
//# sourceMappingURL=grpc-metadata-propagation.factory.js.map