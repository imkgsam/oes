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
exports.GatewayPermissionGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const constants_1 = require("../../constants");
const permission_check_decorator_1 = require("../decorators/permission-check.decorator");
const grpc_client_decorator_1 = require("../../transport/grpc/grpc-client.decorator");
const safe_grpc_call_1 = require("../../transport/grpc/safe-grpc-call");
const app_logger_service_1 = require("../../logging/app-logger.service");
const constants_2 = require("../constants");
/** 权限检查超时时间（毫秒） */
const PERMISSION_CHECK_TIMEOUT_MS = 3000;
const GATEWAY_SERVICE_NAME = 'api-gateway';
/**
 * 网关层权限守卫。
 *
 * 通过 gRPC 调用 permission-service 检查当前用户是否拥有所需权限。
 * 采用 fail-closed 策略：下游异常时拒绝访问，确保安全。
 */
let GatewayPermissionGuard = class GatewayPermissionGuard {
    permissionClient;
    reflector;
    logger;
    metadataFactory;
    permissionSvc;
    constructor(permissionClient, reflector, logger, metadataFactory) {
        this.permissionClient = permissionClient;
        this.reflector = reflector;
        this.logger = logger;
        this.metadataFactory = metadataFactory;
    }
    onModuleInit() {
        this.permissionSvc =
            this.permissionClient.getService('PermissionCheckService');
    }
    async canActivate(context) {
        const metadata = this.reflector.get(permission_check_decorator_1.PERMISSION_CHECK_KEY, context.getHandler());
        if (!metadata)
            return true;
        const { permissions, type } = metadata;
        const request = context.switchToHttp().getRequest();
        const userId = this.resolveOperatorId(request.user);
        if (!userId)
            return false;
        const results = await Promise.all(permissions.map((code) => this.checkSingle(userId, code)));
        if (type === permission_check_decorator_1.PermissionCheckType.ALL) {
            return results.every(Boolean);
        }
        if (type === permission_check_decorator_1.PermissionCheckType.ANY) {
            return results.some(Boolean);
        }
        return false;
    }
    /**
     * 单个权限检查，fail-closed：异常时返回 false。
     */
    async checkSingle(accountId, permissionCode) {
        try {
            const { allowed } = await (0, safe_grpc_call_1.safeGrpcCall)(this.permissionSvc.checkPermission({ accountId, permissionCode }, this.buildInternalMetadata()), {
                timeoutMs: PERMISSION_CHECK_TIMEOUT_MS,
                caller: 'api-gateway',
                method: 'PermissionCheckService.checkPermission'
            });
            return allowed ?? false;
        }
        catch (error) {
            // fail-closed：无论业务异常还是基础设施异常，都拒绝访问
            this.logger.warn('权限检查失败，拒绝访问（fail-closed）', {
                accountId,
                permissionCode,
                error: error?.message ?? error
            });
            return false;
        }
    }
    // Builds the internal service metadata required by permission-service for gateway permission checks.
    buildInternalMetadata() {
        return this.metadataFactory.createInternalCallMetadata({
            callerServiceName: GATEWAY_SERVICE_NAME
        });
    }
    // Resolves the authenticated account id used for permission checks from legacy and current JWT shapes.
    resolveOperatorId(user) {
        const candidates = [user?.holderId, user?.aid, user?.id, user?.sub];
        for (const candidate of candidates) {
            const normalized = candidate?.trim();
            if (normalized) {
                return normalized;
            }
        }
        return undefined;
    }
};
exports.GatewayPermissionGuard = GatewayPermissionGuard;
exports.GatewayPermissionGuard = GatewayPermissionGuard = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, grpc_client_decorator_1.InjectGrpcClient)(constants_1.SERVICE_NAMES.PERMISSION)),
    __param(3, (0, common_1.Inject)(constants_2.GRPC_METADATA_PROPAGATION_FACTORY)),
    __metadata("design:paramtypes", [Object, core_1.Reflector,
        app_logger_service_1.AppLogger, Object])
], GatewayPermissionGuard);
//# sourceMappingURL=gateway-permission.guard.js.map