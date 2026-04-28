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
exports.PrismaSalesAuditRepository = void 0;
const common_1 = require("@nestjs/common");
const common_2 = require("@oes/common");
const prisma_service_1 = require("../prisma/prisma.service");
/** PrismaSalesAuditRepository persists local sales command audit envelopes inside the service database. */
let PrismaSalesAuditRepository = class PrismaSalesAuditRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async append(envelope) {
        const flat = (0, common_2.flattenAuditEnvelope)(envelope);
        await this.prisma.getExecutionClient().salesAuditEnvelope.create({
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
    }
};
exports.PrismaSalesAuditRepository = PrismaSalesAuditRepository;
exports.PrismaSalesAuditRepository = PrismaSalesAuditRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaSalesAuditRepository);
//# sourceMappingURL=prisma-sales-audit.repository.js.map