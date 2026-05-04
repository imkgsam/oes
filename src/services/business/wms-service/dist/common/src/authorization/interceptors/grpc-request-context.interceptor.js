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
exports.GrpcRequestContextInterceptor = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const constants_1 = require("../constants");
const utils_1 = require("../utils");
const grpc_request_context_store_1 = require("../services/grpc-request-context.store");
let GrpcRequestContextInterceptor = class GrpcRequestContextInterceptor {
    requestContextStore;
    constructor(requestContextStore) {
        this.requestContextStore = requestContextStore;
    }
    intercept(context, next) {
        if (context.getType() !== 'rpc') {
            return next.handle();
        }
        const rpcContext = context.switchToRpc();
        const rpcData = rpcContext.getData();
        const metadata = rpcContext.getContext();
        const authenticatedContext = (0, utils_1.getAuthenticatedGrpcRequestContext)(rpcData);
        const requestContext = {
            internalServiceName: authenticatedContext?.internalService?.serviceName ??
                (0, utils_1.getGrpcMetadataValue)(metadata, constants_1.INTERNAL_SERVICE_NAME_METADATA_KEY),
            operatorContext: authenticatedContext?.operatorContext,
            requestId: (0, utils_1.getGrpcMetadataValue)(metadata, constants_1.REQUEST_ID_METADATA_KEY),
            traceId: (0, utils_1.getGrpcMetadataValue)(metadata, constants_1.TRACE_ID_METADATA_KEY)
        };
        return new rxjs_1.Observable((subscriber) => this.requestContextStore.run(requestContext, () => next.handle().subscribe({
            next: (value) => subscriber.next(value),
            error: (error) => subscriber.error(error),
            complete: () => subscriber.complete()
        })));
    }
};
exports.GrpcRequestContextInterceptor = GrpcRequestContextInterceptor;
exports.GrpcRequestContextInterceptor = GrpcRequestContextInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [grpc_request_context_store_1.GrpcRequestContextStore])
], GrpcRequestContextInterceptor);
//# sourceMappingURL=grpc-request-context.interceptor.js.map