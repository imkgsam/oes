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
exports.ItemMasterAuditService = void 0;
exports.toFlatAuditLogRecord = toFlatAuditLogRecord;
const common_1 = require("@nestjs/common");
const common_2 = require("@oes/common");
const authorization_1 = require("@oes/common/authorization");
const exceptions_1 = require("@oes/common/exceptions");
const tokens_1 = require("../../common/constants/tokens");
/** ItemMasterAuditService records the local phase 1 command audit envelope around management execution. */
let ItemMasterAuditService = class ItemMasterAuditService {
    constructor(requestContextStore, transactionRunner, writer) {
        this.requestContextStore = requestContextStore;
        this.transactionRunner = transactionRunner;
        this.writer = writer;
    }
    /** recordCommand wraps one management callback and persists a success, rejection, or failure envelope. */
    async recordCommand(input, execute) {
        try {
            return await this.transactionRunner.runInTransaction(async () => {
                const result = await execute();
                await this.writer.append(this.buildEnvelope(input, 'SUCCEEDED', { result: 'success' }));
                return result;
            });
        }
        catch (error) {
            const auditResult = error instanceof exceptions_1.OESExceptionBase ? 'REJECTED' : 'FAILED';
            await this.writer.append(this.buildEnvelope(input, auditResult, {
                result: 'error',
                error: error instanceof Error ? error.message : String(error)
            }));
            throw error;
        }
    }
    /** buildEnvelope translates the current gRPC request context into the shared audit shape. */
    buildEnvelope(input, result, details) {
        const context = this.requestContextStore.getContext();
        const operatorContext = context?.operatorContext;
        return (0, common_2.buildAuditEnvelope)({
            service: 'item-master-service',
            module: 'management',
            eventType: input.commandName,
            result,
            operator: {
                operatorId: operatorContext?.operator_id ?? null,
                operatorType: operatorContext ? 'HUMAN' : 'SYSTEM'
            },
            scope: {
                tenantId: input.tenantId,
                orgId: operatorContext?.org_id ?? null
            },
            trace: {
                traceId: context?.traceId ?? operatorContext?.trace_id ?? null
            },
            resource: {
                resourceType: 'item_master',
                resourceId: input.targetId
            },
            details: {
                requestSummary: input.requestSummary,
                serviceContext: context?.internalServiceName ?? null,
                operatorContext: operatorContext
                    ? {
                        operatorId: operatorContext.operator_id,
                        operatorType: operatorContext.operator_type,
                        tenantId: operatorContext.tenant_id ?? null,
                        orgId: operatorContext.org_id ?? null
                    }
                    : null,
                traceContext: {
                    traceId: context?.traceId ?? operatorContext?.trace_id ?? null,
                    requestId: context?.requestId ?? operatorContext?.request_id ?? null
                },
                ...details
            }
        });
    }
};
exports.ItemMasterAuditService = ItemMasterAuditService;
exports.ItemMasterAuditService = ItemMasterAuditService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(tokens_1.TOKENS.ITEM_MASTER_TRANSACTION_RUNNER)),
    __param(2, (0, common_1.Inject)(tokens_1.TOKENS.ITEM_MASTER_AUDIT_WRITER)),
    __metadata("design:paramtypes", [authorization_1.GrpcRequestContextStore, Object, Object])
], ItemMasterAuditService);
/** toFlatAuditLogRecord exposes a debug-friendly audit shape for infrastructure logging. */
function toFlatAuditLogRecord(envelope) {
    return {
        ...(0, common_2.flattenAuditEnvelope)(envelope)
    };
}
//# sourceMappingURL=item-master-audit.service.js.map