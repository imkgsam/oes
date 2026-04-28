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
exports.PrismaCustomerAddressRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const prisma_crm_record_mapper_1 = require("./prisma-crm-record.mapper");
/** PrismaCustomerAddressRepository persists CRM business-address relationship records in PostgreSQL. */
let PrismaCustomerAddressRepository = class PrismaCustomerAddressRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(tenantId, customerAccountId, customerAddressId) {
        const record = await this.prisma.getExecutionClient().customerAddress.findFirst({
            where: {
                tenantId,
                customerAccountId,
                id: customerAddressId
            }
        });
        return record ? prisma_crm_record_mapper_1.PrismaCrmRecordMapper.toCustomerAddress(record) : null;
    }
    async save(address) {
        const record = await this.prisma.getExecutionClient().customerAddress.upsert({
            where: {
                id: address.customerAddressId
            },
            create: {
                id: address.customerAddressId,
                tenantId: address.tenantId,
                customerAccountId: address.customerAccountId,
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
        return prisma_crm_record_mapper_1.PrismaCrmRecordMapper.toCustomerAddress(record);
    }
    async listByCustomerAccountId(tenantId, customerAccountId) {
        const items = await this.prisma.getExecutionClient().customerAddress.findMany({
            where: {
                tenantId,
                customerAccountId
            },
            orderBy: {
                label: 'asc'
            }
        });
        return items.map((item) => prisma_crm_record_mapper_1.PrismaCrmRecordMapper.toCustomerAddress(item));
    }
};
exports.PrismaCustomerAddressRepository = PrismaCustomerAddressRepository;
exports.PrismaCustomerAddressRepository = PrismaCustomerAddressRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaCustomerAddressRepository);
//# sourceMappingURL=prisma-customer-address.repository.js.map