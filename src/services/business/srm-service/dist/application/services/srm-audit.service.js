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
exports.SrmAuditService = void 0;
const common_1 = require("@nestjs/common");
const common_2 = require("@oes/common");
const exceptions_1 = require("@oes/common/exceptions");
const tokens_1 = require("../../common/constants/tokens");
/** SrmAuditService records one local audit envelope around each SRM management command execution. */
let SrmAuditService = class SrmAuditService {
    constructor(transactionRunner, writer) {
        this.transactionRunner = transactionRunner;
        this.writer = writer;
    }
    /** recordCommand persists success, rejection, and failure envelopes for the srm-service command surface. */
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
    /** buildEnvelope translates explicit request contexts into the shared audit envelope shape. */
    buildEnvelope(input, result, details) {
        return (0, common_2.buildAuditEnvelope)({
            service: 'srm-service',
            module: 'management',
            eventType: input.commandName,
            result,
            operator: {
                operatorId: input.operatorContext.operatorId,
                operatorType: input.operatorContext.operatorType === 'SYSTEM' ? 'SYSTEM' : 'HUMAN'
            },
            scope: {
                tenantId: input.tenantId,
                orgId: input.operatorContext.orgId ?? null
            },
            trace: {
                traceId: input.traceContext.traceId
            },
            resource: {
                resourceType: input.resourceType,
                resourceId: input.targetId
            },
            details: {
                requestSummary: input.requestSummary,
                operatorContext: input.operatorContext,
                traceContext: input.traceContext,
                auditContext: input.auditContext,
                ...details
            }
        });
    }
};
exports.SrmAuditService = SrmAuditService;
exports.SrmAuditService = SrmAuditService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(tokens_1.TOKENS.SRM_TRANSACTION_RUNNER)),
    __param(1, (0, common_1.Inject)(tokens_1.TOKENS.SRM_AUDIT_WRITER)),
    __metadata("design:paramtypes", [Object, Object])
], SrmAuditService);
//# sourceMappingURL=srm-audit.service.js.map