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
exports.PrismaSupplierContactRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const prisma_srm_record_mapper_1 = require("./prisma-srm-record.mapper");
/** PrismaSupplierContactRepository persists SRM business-contact relationship records in PostgreSQL. */
let PrismaSupplierContactRepository = class PrismaSupplierContactRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(tenantId, supplierId, supplierContactId) {
        const record = await this.prisma.getExecutionClient().supplierContact.findFirst({
            where: {
                tenantId,
                supplierId,
                id: supplierContactId
            }
        });
        return record ? prisma_srm_record_mapper_1.PrismaSrmRecordMapper.toSupplierContact(record) : null;
    }
    async save(contact) {
        const record = await this.prisma.getExecutionClient().supplierContact.upsert({
            where: {
                id: contact.supplierContactId
            },
            create: {
                id: contact.supplierContactId,
                tenantId: contact.tenantId,
                supplierId: contact.supplierId,
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
        return prisma_srm_record_mapper_1.PrismaSrmRecordMapper.toSupplierContact(record);
    }
    async listBySupplierProfileId(tenantId, supplierId) {
        const items = await this.prisma.getExecutionClient().supplierContact.findMany({
            where: {
                tenantId,
                supplierId
            },
            orderBy: {
                displayName: 'asc'
            }
        });
        return items.map((item) => prisma_srm_record_mapper_1.PrismaSrmRecordMapper.toSupplierContact(item));
    }
};
exports.PrismaSupplierContactRepository = PrismaSupplierContactRepository;
exports.PrismaSupplierContactRepository = PrismaSupplierContactRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaSupplierContactRepository);
//# sourceMappingURL=prisma-supplier-contact.repository.js.map