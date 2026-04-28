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
exports.PrismaItemRepository = void 0;
const common_1 = require("@nestjs/common");
const item_aggregate_1 = require("../../../domain/aggregates/item.aggregate");
const item_value_objects_1 = require("../../../domain/value-objects/item.value-objects");
const prisma_service_1 = require("../../prisma/prisma.service");
/** PrismaItemRepository persists item aggregates and catalog searches through Prisma. */
let PrismaItemRepository = class PrismaItemRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(tenantId, itemId) {
        const record = await this.prisma.getExecutionClient().item.findFirst({
            where: {
                tenantId,
                id: itemId
            }
        });
        return record ? toItem(record) : null;
    }
    async findByIds(tenantId, itemIds) {
        if (itemIds.length === 0) {
            return [];
        }
        const records = await this.prisma.getExecutionClient().item.findMany({
            where: {
                tenantId,
                id: {
                    in: itemIds
                }
            }
        });
        const itemMap = new Map(records.map((record) => [record.id, toItem(record)]));
        return itemIds.map((itemId) => itemMap.get(itemId)).filter(Boolean);
    }
    async findByCode(tenantId, itemCode) {
        const record = await this.prisma.getExecutionClient().item.findFirst({
            where: {
                tenantId,
                itemCode
            }
        });
        return record ? toItem(record) : null;
    }
    async save(item) {
        const state = item.toPrimitives();
        const record = await this.prisma.getExecutionClient().item.upsert({
            where: {
                id: state.id
            },
            create: {
                id: state.id,
                tenantId: state.tenantId,
                itemCode: state.itemCode,
                itemName: state.itemName,
                structureType: state.structureType,
                natureType: state.natureType,
                status: state.status,
                sellable: state.capabilities.sellable,
                purchasable: state.capabilities.purchasable,
                stockable: state.capabilities.stockable,
                manufacturable: state.capabilities.manufacturable
            },
            update: {
                itemCode: state.itemCode,
                itemName: state.itemName,
                status: state.status,
                sellable: state.capabilities.sellable,
                purchasable: state.capabilities.purchasable,
                stockable: state.capabilities.stockable,
                manufacturable: state.capabilities.manufacturable
            }
        });
        return toItem(record);
    }
    async search(input) {
        const where = {
            tenantId: input.tenantId
        };
        if (input.keyword) {
            where.OR = [
                {
                    itemCode: {
                        contains: input.keyword,
                        mode: 'insensitive'
                    }
                },
                {
                    itemName: {
                        contains: input.keyword,
                        mode: 'insensitive'
                    }
                }
            ];
        }
        if (input.structureType) {
            where.structureType = input.structureType;
        }
        if (input.natureType) {
            where.natureType = input.natureType;
        }
        if (input.status) {
            where.status = input.status;
        }
        if (input.capabilityFilters) {
            if (input.capabilityFilters.sellable !== undefined) {
                where.sellable = input.capabilityFilters.sellable;
            }
            if (input.capabilityFilters.purchasable !== undefined) {
                where.purchasable = input.capabilityFilters.purchasable;
            }
            if (input.capabilityFilters.stockable !== undefined) {
                where.stockable = input.capabilityFilters.stockable;
            }
            if (input.capabilityFilters.manufacturable !== undefined) {
                where.manufacturable = input.capabilityFilters.manufacturable;
            }
        }
        const queryArgs = {
            where,
            orderBy: [{ itemCode: 'asc' }, { id: 'asc' }],
            skip: (input.page - 1) * input.pageSize,
            take: input.pageSize
        };
        const [total, records] = this.prisma.hasActiveTransaction()
            ? await Promise.all([
                this.prisma.getExecutionClient().item.count({ where }),
                this.prisma.getExecutionClient().item.findMany(queryArgs)
            ])
            : await this.prisma.$transaction([
                this.prisma.item.count({ where }),
                this.prisma.item.findMany(queryArgs)
            ]);
        return {
            items: records.map(toItem),
            total,
            page: input.page,
            pageSize: input.pageSize
        };
    }
};
exports.PrismaItemRepository = PrismaItemRepository;
exports.PrismaItemRepository = PrismaItemRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaItemRepository);
/** toItem maps one Prisma row back into the domain aggregate shape. */
function toItem(record) {
    return item_aggregate_1.Item.reconstitute({
        id: record.id,
        tenantId: record.tenantId,
        itemCode: record.itemCode,
        itemName: record.itemName,
        structureType: record.structureType,
        natureType: record.natureType,
        status: record.status,
        capabilities: item_value_objects_1.ItemCapabilities.from({
            sellable: record.sellable,
            purchasable: record.purchasable,
            stockable: record.stockable,
            manufacturable: record.manufacturable
        })
    });
}
//# sourceMappingURL=prisma-item.repository.js.map