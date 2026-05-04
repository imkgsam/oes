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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GrpcAccessLogInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const app_logger_service_1 = require("../app-logger.service");
const utils_1 = require("../../authorization/utils");
const constants_1 = require("../../authorization/constants");
/**
 * GrpcAccessLogInterceptor records a unified access log entry for every inbound gRPC request.
 */
let GrpcAccessLogInterceptor = class GrpcAccessLogInterceptor {
    logger;
    constructor(logger) {
        this.logger = logger;
    }
    intercept(context, next) {
        if (context.getType() !== 'rpc') {
            return next.handle();
        }
        const startedAt = Date.now();
        const rpcContext = context.switchToRpc();
        const rpcData = rpcContext.getData();
        const metadata = rpcContext.getContext();
        const authenticatedContext = (0, utils_1.getAuthenticatedGrpcRequestContext)(rpcData);
        const operatorContext = authenticatedContext?.operatorContext;
        const module = this.logger.getServiceName();
        const operation = this.getMethodName(context.getArgByIndex(2));
        const requestId = operatorContext?.request_id ?? (0, utils_1.getGrpcMetadataValue)(metadata, constants_1.REQUEST_ID_METADATA_KEY);
        const traceId = operatorContext?.trace_id ?? (0, utils_1.getGrpcMetadataValue)(metadata, constants_1.TRACE_ID_METADATA_KEY);
        const internalServiceName = authenticatedContext?.internalService?.serviceName ??
            (0, utils_1.getGrpcMetadataValue)(metadata, constants_1.INTERNAL_SERVICE_NAME_METADATA_KEY);
        return next.handle().pipe((0, operators_1.tap)({
            next: () => {
                this.logger.info('gRPC request completed', {
                    module,
                    operation,
                    requestId,
                    traceId,
                    tenantId: operatorContext?.tenant_id,
                    orgId: operatorContext?.org_id,
                    operatorId: operatorContext?.operator_id,
                    details: {
                        transport: 'grpc',
                        result: 'SUCCEEDED',
                        durationMs: Date.now() - startedAt,
                        internalServiceName
                    }
                });
            },
            error: (error) => {
                this.logger.warn('gRPC request failed', {
                    module,
                    operation,
                    requestId,
                    traceId,
                    tenantId: operatorContext?.tenant_id,
                    orgId: operatorContext?.org_id,
                    operatorId: operatorContext?.operator_id,
                    errorCode: this.extractErrorCode(error),
                    details: {
                        transport: 'grpc',
                        result: 'FAILED',
                        durationMs: Date.now() - startedAt,
                        internalServiceName
                    }
                });
            }
        }));
    }
    getMethodName(call) {
        const candidate = call;
        const values = [
            candidate?.call?.handler?.path,
            candidate?.handler?.path,
            candidate?.call?.path,
            candidate?.path,
            candidate?.call?.method,
            candidate?.method
        ];
        return values.find((value) => typeof value === 'string' && value.trim().length > 0) ?? 'unknown-method';
    }
    extractErrorCode(error) {
        if (!error || typeof error !== 'object') {
            return undefined;
        }
        const candidate = error;
        if (typeof candidate.code === 'string') {
            return candidate.code;
        }
        if (typeof candidate.details?.code === 'string') {
            return candidate.details.code;
        }
        return undefined;
    }
};
exports.GrpcAccessLogInterceptor = GrpcAccessLogInterceptor;
exports.GrpcAccessLogInterceptor = GrpcAccessLogInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [app_logger_service_1.AppLogger])
], GrpcAccessLogInterceptor);
//# sourceMappingURL=grpc-access-log.interceptor.js.map