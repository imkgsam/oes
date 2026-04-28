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
exports.PrismaCustomerContactRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const prisma_crm_record_mapper_1 = require("./prisma-crm-record.mapper");
/** PrismaCustomerContactRepository persists CRM business-contact relationship records in PostgreSQL. */
let PrismaCustomerContactRepository = class PrismaCustomerContactRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(tenantId, customerAccountId, customerContactId) {
        const record = await this.prisma.getExecutionClient().customerContact.findFirst({
            where: {
                tenantId,
                customerAccountId,
                id: customerContactId
            }
        });
        return record ? prisma_crm_record_mapper_1.PrismaCrmRecordMapper.toCustomerContact(record) : null;
    }
    async save(contact) {
        const record = await this.prisma.getExecutionClient().customerContact.upsert({
            where: {
                id: contact.customerContactId
            },
            create: {
                id: contact.customerContactId,
                tenantId: contact.tenantId,
                customerAccountId: contact.customerAccountId,
                displayName: contact.displayName,
                roleTitle: contact.roleTitle ?? null,
                email: contact.email ?? null,
                phone: contact.phone ?? null,
                isPrimaryContact: contact.isPrimaryContact,
                isActive: contact.isActive
            },
            update: {
                displayName: contact.displayName,
                roleTitle: contact.roleTitle ?? null,
                email: contact.email ?? null,
                phone: contact.phone ?? null,
                isPrimaryContact: contact.isPrimaryContact,
                isActive: contact.isActive
            }
        });
        return prisma_crm_record_mapper_1.PrismaCrmRecordMapper.toCustomerContact(record);
    }
    async listByCustomerAccountId(tenantId, customerAccountId) {
        const items = await this.prisma.getExecutionClient().customerContact.findMany({
            where: {
                tenantId,
                customerAccountId
            },
            orderBy: {
                displayName: 'asc'
            }
        });
        return items.map((item) => prisma_crm_record_mapper_1.PrismaCrmRecordMapper.toCustomerContact(item));
    }
};
exports.PrismaCustomerContactRepository = PrismaCustomerContactRepository;
exports.PrismaCustomerContactRepository = PrismaCustomerContactRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaCustomerContactRepository);
//# sourceMappingURL=prisma-customer-contact.repository.js.map