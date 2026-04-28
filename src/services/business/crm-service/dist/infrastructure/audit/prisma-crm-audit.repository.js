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
exports.PrismaCrmAuditRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_crm_record_mapper_1 = require("../repositories/prisma/prisma-crm-record.mapper");
const prisma_service_1 = require("../prisma/prisma.service");
/** PrismaCrmAuditRepository persists local CRM audit envelopes inside the service database. */
let PrismaCrmAuditRepository = class PrismaCrmAuditRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async append(envelope) {
        await this.prisma.getExecutionClient().crmAuditEnvelope.create({
            data: {
                id: envelope.eventId,
                service: envelope.service,
                module: envelope.module,
                eventType: envelope.eventType,
                occurredAt: envelope.occurredAt,
                result: envelope.result,
                operatorId: envelope.operator.operatorId ?? null,
                operatorType: envelope.operator.operatorType,
                tenantId: envelope.scope.tenantId ?? null,
                orgId: envelope.scope.orgId ?? null,
                traceId: envelope.trace.traceId ?? null,
                resourceType: envelope.resource.resourceType,
                resourceId: envelope.resource.resourceId ?? null,
                details: prisma_crm_record_mapper_1.PrismaCrmRecordMapper.toInputJson(envelope.details)
            }
        });
    }
};
exports.PrismaCrmAuditRepository = PrismaCrmAuditRepository;
exports.PrismaCrmAuditRepository = PrismaCrmAuditRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaCrmAuditRepository);
//# sourceMappingURL=prisma-crm-audit.repository.js.map