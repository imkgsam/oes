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
exports.ItemMasterRpcContextGuard = void 0;
const common_1 = require("@nestjs/common");
const authorization_1 = require("@oes/common/authorization");
const exceptions_1 = require("@oes/common/exceptions");
const item_master_errors_1 = require("../../common/errors/item-master.errors");
/** ItemMasterRpcContextGuard enforces the frozen item-master internal, operator, and trace context contract. */
let ItemMasterRpcContextGuard = class ItemMasterRpcContextGuard {
    constructor(internalServiceAuthenticator, operatorContextVerifier) {
        this.internalServiceAuthenticator = internalServiceAuthenticator;
        this.operatorContextVerifier = operatorContextVerifier;
    }
    canActivate(context) {
        const rpcContext = context.switchToRpc();
        const metadata = rpcContext.getContext();
        const rpcData = rpcContext.getData();
        const internalServiceResult = this.internalServiceAuthenticator.authenticate(metadata);
        if (!internalServiceResult.authenticated || !internalServiceResult.principal) {
            const definition = isPermissionDeniedReason(internalServiceResult.reason)
                ? item_master_errors_1.ITEM_MASTER_PERMISSION_DENIED
                : item_master_errors_1.ITEM_MASTER_UNAUTHENTICATED;
            throw exceptions_1.ExceptionFactory.application(definition, {
                reason: internalServiceResult.reason
            });
        }
        const rawOperatorContext = (0, authorization_1.getGrpcMetadataValue)(metadata, authorization_1.OPERATOR_CONTEXT_METADATA_KEY);
        if (!rawOperatorContext) {
            throw exceptions_1.ExceptionFactory.application(item_master_errors_1.ITEM_MASTER_UNAUTHENTICATED, {
                reason: 'operator context is missing'
            });
        }
        const operatorContextResult = this.operatorContextVerifier.verify(rawOperatorContext);
        if (!operatorContextResult.valid || !operatorContextResult.payload) {
            throw exceptions_1.ExceptionFactory.application(item_master_errors_1.ITEM_MASTER_UNAUTHENTICATED, {
                reason: operatorContextResult.reason
            });
        }
        const traceId = (0, authorization_1.getGrpcMetadataValue)(metadata, authorization_1.TRACE_ID_METADATA_KEY);
        if (!traceId || traceId.trim().length === 0) {
            throw exceptions_1.ExceptionFactory.application(item_master_errors_1.ITEM_MASTER_INVALID_ARGUMENT, {
                reason: 'trace context is required'
            });
        }
        const requestId = (0, authorization_1.getGrpcMetadataValue)(metadata, authorization_1.REQUEST_ID_METADATA_KEY);
        if (!requestId || requestId.trim().length === 0) {
            throw exceptions_1.ExceptionFactory.application(item_master_errors_1.ITEM_MASTER_INVALID_ARGUMENT, {
                reason: 'request metadata is required'
            });
        }
        (0, authorization_1.attachInternalService)(rpcData, internalServiceResult.principal.serviceName);
        (0, authorization_1.attachOperatorContext)(rpcData, operatorContextResult.payload);
        return true;
    }
};
exports.ItemMasterRpcContextGuard = ItemMasterRpcContextGuard;
exports.ItemMasterRpcContextGuard = ItemMasterRpcContextGuard = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(authorization_1.INTERNAL_SERVICE_AUTHENTICATOR)),
    __param(1, (0, common_1.Inject)(authorization_1.OPERATOR_CONTEXT_VERIFIER)),
    __metadata("design:paramtypes", [Object, Object])
], ItemMasterRpcContextGuard);
/** isPermissionDeniedReason distinguishes trusted-but-forbidden service contexts from missing authentication context. */
function isPermissionDeniedReason(reason) {
    if (!reason) {
        return false;
    }
    const normalized = reason.toLowerCase();
    return normalized.includes('allow') || normalized.includes('trust');
}
//# sourceMappingURL=item-master-rpc-context.guard.js.map