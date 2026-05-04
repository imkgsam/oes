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
var PermissionGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const exceptions_1 = require("../../core/exceptions");
const constants_1 = require("../constants");
const exceptions_2 = require("../exceptions");
const utils_1 = require("../utils");
let PermissionGuard = PermissionGuard_1 = class PermissionGuard {
    reflector;
    permissionResolver;
    logger = new common_1.Logger(PermissionGuard_1.name);
    constructor(reflector, permissionResolver) {
        this.reflector = reflector;
        this.permissionResolver = permissionResolver;
    }
    async canActivate(context) {
        const requiredPermission = this.reflector.getAllAndOverride(constants_1.REQUIRE_PERMISSION_METADATA_KEY, [context.getHandler(), context.getClass()]);
        if (!requiredPermission) {
            return true;
        }
        const operatorContext = this.getOperatorContext(context);
        const requestTarget = this.describeRequestTarget(context);
        const permissions = await this.resolvePermissions(operatorContext, requiredPermission);
        if (!permissions.includes(requiredPermission)) {
            this.logger.warn(`permission denied: required=${requiredPermission}; operatorId=${operatorContext.operator_id}; tenantId=${operatorContext.tenant_id ?? ''}; issuer=${operatorContext.issuer}; target=${requestTarget}; resolvedPermissions=${permissions.length}; sample=${permissions
                .slice(0, 12)
                .join(',')}`);
            throw exceptions_1.ExceptionFactory.application(exceptions_1.ACCESS_DENIED, {
                requiredPermission
            });
        }
        this.logger.debug(`permission granted: required=${requiredPermission}; operatorId=${operatorContext.operator_id}; tenantId=${operatorContext.tenant_id ?? ''}; issuer=${operatorContext.issuer}; target=${requestTarget}; resolvedPermissions=${permissions.length}`);
        return true;
    }
    getOperatorContext(context) {
        const rpcData = context.switchToRpc().getData();
        const operatorContext = (0, utils_1.getAuthenticatedGrpcRequestContext)(rpcData)?.operatorContext;
        if (!operatorContext) {
            throw exceptions_1.ExceptionFactory.application(exceptions_2.OPERATOR_CONTEXT_MISSING);
        }
        return operatorContext;
    }
    async resolvePermissions(operatorContext, requiredPermission) {
        try {
            return await this.permissionResolver.resolvePermissions(operatorContext);
        }
        catch (error) {
            this.logger.error(`permission resolution failed: required=${requiredPermission}; operatorId=${operatorContext.operator_id}; tenantId=${operatorContext.tenant_id ?? ''}; issuer=${operatorContext.issuer}; error=${error?.message ?? error}`);
            if (error instanceof exceptions_1.InfrastructureException) {
                throw exceptions_1.ExceptionFactory.infrastructure(exceptions_2.PERMISSION_DEPENDENCY_UNAVAILABLE, {
                    requiredPermission,
                    operatorId: operatorContext.operator_id,
                    tenantId: operatorContext.tenant_id
                });
            }
            throw error;
        }
    }
    describeRequestTarget(context) {
        const handlerName = context.getHandler()?.name ?? 'unknown_handler';
        const rpcData = context.switchToRpc().getData();
        if (!rpcData || typeof rpcData !== 'object') {
            return handlerName;
        }
        const targetAccountId = this.readStringField(rpcData, 'accountId');
        const targetTenantId = this.readStringField(rpcData, 'tenantId');
        const targetUserId = this.readStringField(rpcData, 'userId');
        return [
            handlerName,
            targetAccountId ? `accountId=${targetAccountId}` : '',
            targetTenantId ? `tenantId=${targetTenantId}` : '',
            targetUserId ? `userId=${targetUserId}` : ''
        ]
            .filter(Boolean)
            .join(';');
    }
    readStringField(record, field) {
        const value = record[field];
        return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
    }
};
exports.PermissionGuard = PermissionGuard;
exports.PermissionGuard = PermissionGuard = PermissionGuard_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(constants_1.OPERATOR_PERMISSION_RESOLVER)),
    __metadata("design:paramtypes", [core_1.Reflector, Object])
], PermissionGuard);
//# sourceMappingURL=permission.guard.js.map