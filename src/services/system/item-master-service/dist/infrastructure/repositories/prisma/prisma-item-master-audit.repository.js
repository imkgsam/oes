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
exports.PrismaItemMasterAuditRepository = void 0;
const common_1 = require("@nestjs/common");
const common_2 = require("@oes/common");
const logging_1 = require("@oes/common/logging");
const prisma_service_1 = require("../../prisma/prisma.service");
/** PrismaItemMasterAuditRepository persists local command audit envelopes and mirrors them into structured logs. */
let PrismaItemMasterAuditRepository = class PrismaItemMasterAuditRepository {
    constructor(prisma, logger) {
        this.prisma = prisma;
        this.logger = logger;
    }
    async append(envelope) {
        const flat = (0, common_2.flattenAuditEnvelope)(envelope);
        await this.prisma.getExecutionClient().auditEvent.create({
            data: {
                id: flat.eventId,
                service: flat.service,
                module: flat.module,
                eventType: flat.eventType,
                occurredAt: flat.occurredAt,
                result: flat.result,
                operatorId: flat.operatorId,
                operatorType: flat.operatorType,
                tenantId: flat.tenantId,
                orgId: flat.orgId,
                traceId: flat.traceId,
                resourceType: flat.resourceType,
                resourceId: flat.resourceId,
                details: flat.details,
                createdAt: flat.occurredAt
            }
        });
        this.logger.info(`Item master audit event: ${flat.eventType}`, {
            module: 'item-master-service',
            operation: 'item-master.audit',
            traceId: flat.traceId ?? undefined,
            details: flat
        });
    }
};
exports.PrismaItemMasterAuditRepository = PrismaItemMasterAuditRepository;
exports.PrismaItemMasterAuditRepository = PrismaItemMasterAuditRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        logging_1.AppLogger])
], PrismaItemMasterAuditRepository);
//# sourceMappingURL=prisma-item-master-audit.repository.js.map