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
exports.PrismaWarehouseRepository = void 0;
const common_1 = require("@nestjs/common");
const wms_assertions_1 = require("../../../application/support/wms-assertions");
const prisma_service_1 = require("../../prisma/prisma.service");
const prisma_wms_record_mapper_1 = require("./prisma-wms-record.mapper");
/** PrismaWarehouseRepository persists and queries the internal warehouse and location topology owned by WMS. */
let PrismaWarehouseRepository = class PrismaWarehouseRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findWarehouseById(tenantId, warehouseId) {
        const row = await this.prisma.getExecutionClient().warehouse.findFirst({
            where: {
                tenantId,
                id: warehouseId
            }
        });
        return row ? prisma_wms_record_mapper_1.PrismaWmsRecordMapper.toWarehouse(row) : null;
    }
    async searchWarehouses(input) {
        const { page, pageSize } = (0, wms_assertions_1.normalizePageInput)(input.page, input.pageSize);
        const rows = await this.prisma.getExecutionClient().warehouse.findMany({
            where: {
                tenantId: input.tenantId
            },
            orderBy: {
                warehouseCode: 'asc'
            }
        });
        const keyword = (0, wms_assertions_1.normalizeOptionalString)(input.keyword)?.toLowerCase();
        const filtered = rows
            .map((row) => prisma_wms_record_mapper_1.PrismaWmsRecordMapper.toWarehouse(row))
            .filter((record) => !input.orgId || record.orgId === input.orgId)
            .filter((record) => !input.status || record.status === input.status)
            .filter((record) => {
            if (!keyword) {
                return true;
            }
            return (record.warehouseCode.toLowerCase().includes(keyword) ||
                record.warehouseName.toLowerCase().includes(keyword));
        });
        const { pageItems, total } = (0, wms_assertions_1.paginate)(filtered, page, pageSize);
        return {
            items: pageItems,
            total,
            page,
            pageSize
        };
    }
    async findLocationById(tenantId, locationId) {
        const row = await this.prisma.getExecutionClient().location.findFirst({
            where: {
                tenantId,
                id: locationId
            }
        });
        return row ? prisma_wms_record_mapper_1.PrismaWmsRecordMapper.toLocation(row) : null;
    }
    async searchLocations(input) {
        const { page, pageSize } = (0, wms_assertions_1.normalizePageInput)(input.page, input.pageSize);
        const rows = await this.prisma.getExecutionClient().location.findMany({
            where: {
                tenantId: input.tenantId
            },
            orderBy: [
                {
                    warehouseId: 'asc'
                },
                {
                    locationCode: 'asc'
                }
            ]
        });
        const filtered = rows
            .map((row) => prisma_wms_record_mapper_1.PrismaWmsRecordMapper.toLocation(row))
            .filter((record) => !input.warehouseId || record.warehouseId === input.warehouseId)
            .filter((record) => !input.parentLocationId || (record.parentLocationId ?? null) === input.parentLocationId)
            .filter((record) => !input.locationType || record.locationType === input.locationType)
            .filter((record) => !input.status || record.status === input.status)
            .filter((record) => input.supportsReceipt === undefined || record.supportsReceipt === input.supportsReceipt)
            .filter((record) => input.supportsStorage === undefined || record.supportsStorage === input.supportsStorage);
        const { pageItems, total } = (0, wms_assertions_1.paginate)(filtered, page, pageSize);
        return {
            items: pageItems,
            total,
            page,
            pageSize
        };
    }
};
exports.PrismaWarehouseRepository = PrismaWarehouseRepository;
exports.PrismaWarehouseRepository = PrismaWarehouseRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaWarehouseRepository);
//# sourceMappingURL=prisma-warehouse.repository.js.map