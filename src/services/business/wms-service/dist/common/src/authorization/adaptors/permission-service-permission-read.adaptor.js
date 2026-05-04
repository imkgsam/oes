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
var PermissionServicePermissionReadAdaptor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionServicePermissionReadAdaptor = void 0;
const common_1 = require("@nestjs/common");
const constants_1 = require("../../constants");
const constants_2 = require("../constants");
const permission_management_1 = require("../../generated/permission_service/permission_management");
const permission_access_summary_1 = require("../../generated/permission_service/permission_access_summary");
const transport_1 = require("../../transport");
const grpc_request_context_store_1 = require("../services/grpc-request-context.store");
const DEFAULT_ROLE_PERMISSION_CACHE_TTL_MS = 30_000;
let PermissionServicePermissionReadAdaptor = PermissionServicePermissionReadAdaptor_1 = class PermissionServicePermissionReadAdaptor {
    permissionClient;
    metadataFactory;
    requestContextStore;
    logger = new common_1.Logger(PermissionServicePermissionReadAdaptor_1.name);
    cache = new Map();
    inflight = new Map();
    cacheTtlMs = this.resolveCacheTtlMs();
    permissionManagementService;
    permissionAccessSummaryService;
    constructor(permissionClient, metadataFactory, requestContextStore) {
        this.permissionClient = permissionClient;
        this.metadataFactory = metadataFactory;
        this.requestContextStore = requestContextStore;
    }
    onModuleInit() {
        this.permissionManagementService =
            this.permissionClient.getService(permission_management_1.PERMISSION_MANAGEMENT_SERVICE_NAME);
    }
    // Reads effective permission codes for the operator account through the internal access-summary contract.
    async listPermissionCodesByOperatorContext(operatorContext) {
        const accountId = operatorContext.operator_id?.trim();
        if (!accountId) {
            return [];
        }
        const tenantId = operatorContext.tenant_id?.trim() || undefined;
        const scopeLevel = tenantId ? 'TENANT' : 'SYSTEM';
        const cacheKey = `operator:${accountId}:${tenantId ?? ''}:${scopeLevel}`;
        const cached = this.getCachedPermissions(cacheKey);
        if (cached) {
            return [...cached];
        }
        const inflight = this.inflight.get(cacheKey);
        if (inflight) {
            return [...(await inflight)];
        }
        const pending = this.fetchOperatorPermissionCodes(accountId, tenantId, scopeLevel);
        this.inflight.set(cacheKey, pending);
        try {
            const permissionCodes = await pending;
            this.cache.set(cacheKey, {
                permissionCodes,
                expiresAt: this.now() + this.cacheTtlMs
            });
            return [...permissionCodes];
        }
        finally {
            this.inflight.delete(cacheKey);
        }
    }
    // Reads permission codes for one role id through an internal trust call so guards can resolve operator permissions safely.
    async listPermissionCodesByRoleId(roleId) {
        const normalizedRoleId = roleId.trim();
        if (!normalizedRoleId) {
            return [];
        }
        const cached = this.getCachedPermissions(normalizedRoleId);
        if (cached) {
            return [...cached];
        }
        const inflight = this.inflight.get(normalizedRoleId);
        if (inflight) {
            return [...(await inflight)];
        }
        const pending = this.fetchPermissionCodes(normalizedRoleId);
        this.inflight.set(normalizedRoleId, pending);
        try {
            const permissionCodes = await pending;
            this.cache.set(normalizedRoleId, {
                permissionCodes,
                expiresAt: this.now() + this.cacheTtlMs
            });
            return [...permissionCodes];
        }
        finally {
            this.inflight.delete(normalizedRoleId);
        }
    }
    buildRequest(roleId) {
        this.logger.debug(`Resolving permissions for role=${roleId}`);
        return { roleId };
    }
    async fetchPermissionCodes(roleId) {
        const response = await (0, transport_1.safeGrpcCall)(this.permissionManagementService.listRolePermissions(this.buildRequest(roleId), this.metadata()), {
            caller: 'common',
            method: 'PermissionManagementService.listRolePermissions'
        });
        return [...new Set((response.permissions ?? [])
                .map((permission) => permission.code?.trim() ?? '')
                .filter((code) => code.length > 0))];
    }
    async fetchOperatorPermissionCodes(accountId, tenantId, scopeLevel) {
        this.logger.log(`Resolving operator permissions via access summary: accountId=${accountId}; tenantId=${tenantId ?? ''}; scopeLevel=${scopeLevel}`);
        const response = await (0, transport_1.safeGrpcCall)(this.getPermissionAccessSummaryService().getAccountAccessSummary({
            accountId,
            tenantId,
            scopeLevel
        }, this.metadata()), {
            caller: 'common',
            method: 'PermissionAccessSummaryService.getAccountAccessSummary'
        });
        const actionCodes = [...new Set((response.actionCodes ?? [])
                .map((code) => code.trim())
                .filter((code) => code.length > 0))];
        const resolvedMessage = `Resolved operator permissions: accountId=${accountId}; tenantId=${tenantId ?? ''}; scopeLevel=${scopeLevel}; actionCodes=${actionCodes.length}; sample=${actionCodes
            .slice(0, 12)
            .join(',')}`;
        if (actionCodes.length === 0) {
            this.logger.warn(resolvedMessage);
        }
        else {
            this.logger.log(resolvedMessage);
        }
        return actionCodes;
    }
    getPermissionAccessSummaryService() {
        if (!this.permissionAccessSummaryService) {
            this.permissionAccessSummaryService =
                this.permissionClient.getService(permission_access_summary_1.PERMISSION_ACCESS_SUMMARY_SERVICE_NAME);
        }
        return this.permissionAccessSummaryService;
    }
    getCachedPermissions(roleId) {
        const entry = this.cache.get(roleId);
        if (!entry) {
            return null;
        }
        if (entry.expiresAt <= this.now()) {
            this.cache.delete(roleId);
            return null;
        }
        return entry.permissionCodes;
    }
    resolveCacheTtlMs() {
        const rawValue = process.env.OPERATOR_ROLE_PERMISSION_CACHE_TTL_MS;
        const parsed = Number(rawValue);
        if (!rawValue || Number.isNaN(parsed) || parsed <= 0) {
            return DEFAULT_ROLE_PERMISSION_CACHE_TTL_MS;
        }
        return parsed;
    }
    now() {
        return Date.now();
    }
    metadata() {
        const current = this.requestContextStore.getContext();
        return this.metadataFactory.createInternalCallMetadata({
            callerServiceName: this.resolveCurrentServiceName(),
            requestId: current?.requestId,
            traceId: current?.traceId
        });
    }
    resolveCurrentServiceName() {
        const candidates = [process.env.MODULE_NAME, process.env.npm_package_name];
        for (const candidate of candidates) {
            const normalized = candidate?.trim();
            if (normalized) {
                return normalized;
            }
        }
        return 'unknown-service';
    }
};
exports.PermissionServicePermissionReadAdaptor = PermissionServicePermissionReadAdaptor;
exports.PermissionServicePermissionReadAdaptor = PermissionServicePermissionReadAdaptor = PermissionServicePermissionReadAdaptor_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, transport_1.InjectGrpcClient)(constants_1.SERVICE_NAMES.PERMISSION)),
    __param(1, (0, common_1.Inject)(constants_2.GRPC_METADATA_PROPAGATION_FACTORY)),
    __metadata("design:paramtypes", [Object, Object, grpc_request_context_store_1.GrpcRequestContextStore])
], PermissionServicePermissionReadAdaptor);
//# sourceMappingURL=permission-service-permission-read.adaptor.js.map