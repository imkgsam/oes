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
exports.PrismaSupplierAddressRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const prisma_srm_record_mapper_1 = require("./prisma-srm-record.mapper");
/** PrismaSupplierAddressRepository persists SRM business-address relationship records in PostgreSQL. */
let PrismaSupplierAddressRepository = class PrismaSupplierAddressRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(tenantId, supplierId, supplierAddressId) {
        const record = await this.prisma.getExecutionClient().supplierAddress.findFirst({
            where: {
                tenantId,
                supplierId,
                id: supplierAddressId
            }
        });
        return record ? prisma_srm_record_mapper_1.PrismaSrmRecordMapper.toSupplierAddress(record) : null;
    }
    async save(address) {
        const record = await this.prisma.getExecutionClient().supplierAddress.upsert({
            where: {
                id: address.supplierAddressId
            },
            create: {
                id: address.supplierAddressId,
                tenantId: address.tenantId,
                supplierId: address.supplierId,
                label: address.label,
                countryCode: address.countryCode,
                region: address.region ?? null,
                locality: address.locality ?? null,
                addressLine1: address.addressLine1,
                addressLine2: address.addressLine2 ?? null,
                postalCode: address.postalCode ?? null,
                isPrimaryAddress: address.isPrimaryAddress,
                isActive: address.isActive
            },
            update: {
                label: address.label,
                countryCode: address.countryCode,
                region: address.region ?? null,
                locality: address.locality ?? null,
                addressLine1: address.addressLine1,
                addressLine2: address.addressLine2 ?? null,
                postalCode: address.postalCode ?? null,
                isPrimaryAddress: address.isPrimaryAddress,
                isActive: address.isActive
            }
        });
        return prisma_srm_record_mapper_1.PrismaSrmRecordMapper.toSupplierAddress(record);
    }
    async listBySupplierProfileId(tenantId, supplierId) {
        const items = await this.prisma.getExecutionClient().supplierAddress.findMany({
            where: {
                tenantId,
                supplierId
            },
            orderBy: {
                label: 'asc'
            }
        });
        return items.map((item) => prisma_srm_record_mapper_1.PrismaSrmRecordMapper.toSupplierAddress(item));
    }
};
exports.PrismaSupplierAddressRepository = PrismaSupplierAddressRepository;
exports.PrismaSupplierAddressRepository = PrismaSupplierAddressRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaSupplierAddressRepository);
//# sourceMappingURL=prisma-supplier-address.repository.js.map