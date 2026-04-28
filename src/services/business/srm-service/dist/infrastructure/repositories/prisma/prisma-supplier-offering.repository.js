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
exports.PrismaSupplierOfferingRepository = void 0;
const common_1 = require("@nestjs/common");
const srm_records_1 = require("../../../domain/models/srm-records");
const prisma_service_1 = require("../../prisma/prisma.service");
const prisma_srm_record_mapper_1 = require("./prisma-srm-record.mapper");
/** PrismaSupplierOfferingRepository persists and lists the current SRM supplier-item supplyability facts. */
let PrismaSupplierOfferingRepository = class PrismaSupplierOfferingRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(tenantId, supplierOfferingId) {
        const record = await this.prisma.getExecutionClient().supplierOffering.findFirst({
            where: {
                tenantId,
                id: supplierOfferingId
            }
        });
        return record ? prisma_srm_record_mapper_1.PrismaSrmRecordMapper.toSupplierOffering(record) : null;
    }
    async findBySupplierAndItem(tenantId, supplierId, itemId) {
        const record = await this.prisma.getExecutionClient().supplierOffering.findFirst({
            where: {
                tenantId,
                supplierId,
                itemId
            }
        });
        return record ? prisma_srm_record_mapper_1.PrismaSrmRecordMapper.toSupplierOffering(record) : null;
    }
    async save(offering) {
        const saved = await this.prisma.getExecutionClient().supplierOffering.upsert({
            where: {
                tenantId_supplierId_itemId: {
                    tenantId: offering.tenantId,
                    supplierId: offering.supplierId,
                    itemId: offering.itemId
                }
            },
            create: {
                id: offering.supplierOfferingId,
                tenantId: offering.tenantId,
                supplierId: offering.supplierId,
                itemId: offering.itemId,
                itemCode: offering.itemCode ?? null,
                itemName: offering.itemName ?? null,
                status: prisma_srm_record_mapper_1.PrismaSrmRecordMapper.toPersistedSupplierOfferingStatus(offering.status)
            },
            update: {
                itemCode: offering.itemCode ?? null,
                itemName: offering.itemName ?? null,
                status: prisma_srm_record_mapper_1.PrismaSrmRecordMapper.toPersistedSupplierOfferingStatus(offering.status)
            }
        });
        return prisma_srm_record_mapper_1.PrismaSrmRecordMapper.toSupplierOffering(saved);
    }
    async listBySupplierId(tenantId, supplierId, status, page = 1, pageSize = 20) {
        const where = {
            tenantId,
            supplierId,
            status: status ? prisma_srm_record_mapper_1.PrismaSrmRecordMapper.toPersistedSupplierOfferingStatus(status) : undefined
        };
        const [total, items] = await Promise.all([
            this.prisma.getExecutionClient().supplierOffering.count({ where }),
            this.prisma.getExecutionClient().supplierOffering.findMany({
                where,
                orderBy: {
                    itemId: 'asc'
                },
                skip: (page - 1) * pageSize,
                take: pageSize
            })
        ]);
        return {
            items: items.map((item) => prisma_srm_record_mapper_1.PrismaSrmRecordMapper.toSupplierOffering(item)),
            total,
            page,
            pageSize
        };
    }
    async listByItemId(tenantId, itemId, status, page = 1, pageSize = 20) {
        const where = {
            tenantId,
            itemId,
            status: status ? prisma_srm_record_mapper_1.PrismaSrmRecordMapper.toPersistedSupplierOfferingStatus(status) : undefined
        };
        const [total, items] = await Promise.all([
            this.prisma.getExecutionClient().supplierOffering.count({ where }),
            this.prisma.getExecutionClient().supplierOffering.findMany({
                where,
                orderBy: {
                    supplierId: 'asc'
                },
                skip: (page - 1) * pageSize,
                take: pageSize
            })
        ]);
        return {
            items: items.map((item) => prisma_srm_record_mapper_1.PrismaSrmRecordMapper.toSupplierOffering(item)),
            total,
            page,
            pageSize
        };
    }
    async hasActiveBySupplierId(tenantId, supplierId) {
        const count = await this.prisma.getExecutionClient().supplierOffering.count({
            where: {
                tenantId,
                supplierId,
                status: prisma_srm_record_mapper_1.PrismaSrmRecordMapper.toPersistedSupplierOfferingStatus(srm_records_1.SupplierOfferingStatus.ACTIVE)
            }
        });
        return count > 0;
    }
};
exports.PrismaSupplierOfferingRepository = PrismaSupplierOfferingRepository;
exports.PrismaSupplierOfferingRepository = PrismaSupplierOfferingRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaSupplierOfferingRepository);
//# sourceMappingURL=prisma-supplier-offering.repository.js.map