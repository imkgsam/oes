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
exports.PrismaSupplierItemMappingRepository = void 0;
const common_1 = require("@nestjs/common");
const exceptions_1 = require("@oes/common/exceptions");
const item_master_errors_1 = require("../../../common/errors/item-master.errors");
const prisma_service_1 = require("../../prisma/prisma.service");
/** PrismaSupplierItemMappingRepository persists supplier-to-item alias mappings without procurement fields. */
let PrismaSupplierItemMappingRepository = class PrismaSupplierItemMappingRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async upsert(input) {
        const codeKey = normalizeLookup(input.supplierItemCode);
        const nameKey = normalizeLookup(input.supplierItemName);
        const existingMatches = await this.prisma.getExecutionClient().supplierItemMapping.findMany({
            where: {
                tenantId: input.tenantId,
                supplierId: input.supplierId,
                OR: [
                    ...(codeKey ? [{ supplierItemCodeKey: codeKey }] : []),
                    ...(nameKey ? [{ supplierItemNameKey: nameKey }] : [])
                ]
            }
        });
        const existingIds = Array.from(new Set(existingMatches.map((record) => record.id)));
        if (existingIds.length > 1) {
            throw exceptions_1.ExceptionFactory.domain(item_master_errors_1.ITEM_MASTER_ALREADY_EXISTS, {
                reason: 'supplier item mapping aliases collide with multiple records'
            });
        }
        const record = existingIds.length === 1
            ? await this.prisma.getExecutionClient().supplierItemMapping.update({
                where: { id: existingIds[0] },
                data: {
                    supplierItemCode: normalizeValue(input.supplierItemCode),
                    supplierItemName: normalizeValue(input.supplierItemName),
                    supplierItemCodeKey: codeKey,
                    supplierItemNameKey: nameKey,
                    itemId: input.itemId
                }
            })
            : await this.prisma.getExecutionClient().supplierItemMapping.create({
                data: {
                    tenantId: input.tenantId,
                    supplierId: input.supplierId,
                    supplierItemCode: normalizeValue(input.supplierItemCode),
                    supplierItemName: normalizeValue(input.supplierItemName),
                    supplierItemCodeKey: codeKey,
                    supplierItemNameKey: nameKey,
                    itemId: input.itemId
                }
            });
        return toSupplierItemMapping(record);
    }
    async listByItem(input) {
        const where = {
            tenantId: input.tenantId,
            itemId: input.itemId
        };
        const queryArgs = {
            where,
            orderBy: [{ supplierId: 'asc' }, { id: 'asc' }],
            skip: (input.page - 1) * input.pageSize,
            take: input.pageSize
        };
        const [total, records] = this.prisma.hasActiveTransaction()
            ? await Promise.all([
                this.prisma.getExecutionClient().supplierItemMapping.count({ where }),
                this.prisma.getExecutionClient().supplierItemMapping.findMany(queryArgs)
            ])
            : await this.prisma.$transaction([
                this.prisma.supplierItemMapping.count({ where }),
                this.prisma.supplierItemMapping.findMany(queryArgs)
            ]);
        return {
            mappings: records.map(toSupplierItemMapping),
            total,
            page: input.page,
            pageSize: input.pageSize
        };
    }
    async resolve(input) {
        const codeKey = normalizeLookup(input.supplierItemCode);
        const nameKey = normalizeLookup(input.supplierItemName);
        let record = codeKey && nameKey
            ? await this.prisma.getExecutionClient().supplierItemMapping.findFirst({
                where: {
                    tenantId: input.tenantId,
                    supplierId: input.supplierId,
                    supplierItemCodeKey: codeKey,
                    supplierItemNameKey: nameKey
                }
            })
            : null;
        if (!record && codeKey) {
            record = await this.prisma.getExecutionClient().supplierItemMapping.findFirst({
                where: {
                    tenantId: input.tenantId,
                    supplierId: input.supplierId,
                    supplierItemCodeKey: codeKey
                }
            });
        }
        if (!record && nameKey) {
            record = await this.prisma.getExecutionClient().supplierItemMapping.findFirst({
                where: {
                    tenantId: input.tenantId,
                    supplierId: input.supplierId,
                    supplierItemNameKey: nameKey
                }
            });
        }
        return record ? toSupplierItemMapping(record) : null;
    }
};
exports.PrismaSupplierItemMappingRepository = PrismaSupplierItemMappingRepository;
exports.PrismaSupplierItemMappingRepository = PrismaSupplierItemMappingRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaSupplierItemMappingRepository);
/** normalizeLookup lowers and trims one supplier alias for matching and uniqueness. */
function normalizeLookup(value) {
    const normalized = normalizeValue(value);
    return normalized ? normalized.toLowerCase() : undefined;
}
/** normalizeValue trims blank supplier alias values into undefined for storage consistency. */
function normalizeValue(value) {
    if (!value) {
        return undefined;
    }
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : undefined;
}
/** toSupplierItemMapping maps one Prisma row into the repository contract shape. */
function toSupplierItemMapping(record) {
    return {
        id: record.id,
        tenantId: record.tenantId,
        supplierId: record.supplierId,
        supplierItemCode: record.supplierItemCode ?? undefined,
        supplierItemName: record.supplierItemName ?? undefined,
        itemId: record.itemId
    };
}
//# sourceMappingURL=prisma-supplier-item-mapping.repository.js.map