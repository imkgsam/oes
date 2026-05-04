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
exports.PrismaInventoryRepository = void 0;
const common_1 = require("@nestjs/common");
const wms_records_1 = require("../../../domain/models/wms-records");
const wms_assertions_1 = require("../../../application/support/wms-assertions");
const prisma_service_1 = require("../../prisma/prisma.service");
const prisma_wms_record_mapper_1 = require("./prisma-wms-record.mapper");
/** PrismaInventoryRepository persists immutable ledger facts and balance projections derived from those facts. */
let PrismaInventoryRepository = class PrismaInventoryRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async applyLedgerEntries(entries) {
        if (entries.length === 0) {
            return;
        }
        await this.prisma.runInTransaction(async () => {
            const client = this.prisma.getExecutionClient();
            for (const entry of entries) {
                await client.stockLedgerEntry.create({
                    data: {
                        id: entry.stockLedgerEntryId,
                        tenantId: entry.tenantId,
                        orgId: entry.orgId ?? null,
                        entryType: prisma_wms_record_mapper_1.PrismaWmsRecordMapper.toPersistedStockLedgerEntryType(entry.entryType),
                        direction: prisma_wms_record_mapper_1.PrismaWmsRecordMapper.toPersistedStockLedgerDirection(entry.direction),
                        warehouseId: entry.warehouseId,
                        locationId: entry.locationId,
                        itemId: entry.itemId,
                        itemCode: entry.itemCode ?? null,
                        itemName: entry.itemName ?? null,
                        quantityDelta: entry.quantityDelta,
                        uom: entry.uom,
                        inventoryStatus: prisma_wms_record_mapper_1.PrismaWmsRecordMapper.toPersistedInventoryStatus(entry.inventoryStatus),
                        restrictedReason: entry.restrictedReason
                            ? prisma_wms_record_mapper_1.PrismaWmsRecordMapper.toInputJson(entry.restrictedReason)
                            : null,
                        sourceDocumentType: prisma_wms_record_mapper_1.PrismaWmsRecordMapper.toPersistedStockLedgerSourceDocumentType(entry.sourceDocumentType),
                        sourceDocumentId: entry.sourceDocumentId,
                        sourceDocumentLineId: entry.sourceDocumentLineId,
                        receivingExpectationId: entry.receivingExpectationId ?? null,
                        trackingRefs: prisma_wms_record_mapper_1.PrismaWmsRecordMapper.toInputJson(entry.trackingRefs),
                        postedAt: new Date(entry.postedAt)
                    }
                });
                await this.upsertBalance(client, entry, entry.locationId);
                await this.upsertBalance(client, entry, null);
            }
        });
    }
    async searchStockLedgerEntries(input) {
        const { page, pageSize } = (0, wms_assertions_1.normalizePageInput)(input.page, input.pageSize);
        const rows = await this.prisma.getExecutionClient().stockLedgerEntry.findMany({
            where: {
                tenantId: input.tenantId
            },
            orderBy: {
                postedAt: 'asc'
            }
        });
        const filtered = rows
            .map((row) => prisma_wms_record_mapper_1.PrismaWmsRecordMapper.toStockLedgerEntry(row))
            .filter((record) => !input.orgId || record.orgId === input.orgId)
            .filter((record) => !input.warehouseId || record.warehouseId === input.warehouseId)
            .filter((record) => !input.locationId || record.locationId === input.locationId)
            .filter((record) => !input.itemId || record.itemId === input.itemId)
            .filter((record) => !input.receiptId || record.sourceDocumentId === input.receiptId)
            .filter((record) => !input.receiptLineId || record.sourceDocumentLineId === input.receiptLineId)
            .filter((record) => !input.receivingExpectationId || record.receivingExpectationId === input.receivingExpectationId)
            .filter((record) => !input.inventoryStatus || record.inventoryStatus === input.inventoryStatus)
            .filter((record) => !input.restrictedReasonCode || record.restrictedReason?.reasonCode === input.restrictedReasonCode)
            .filter((record) => !input.postedAtFrom || record.postedAt >= input.postedAtFrom)
            .filter((record) => !input.postedAtTo || record.postedAt <= input.postedAtTo);
        const { pageItems, total } = (0, wms_assertions_1.paginate)(filtered, page, pageSize);
        return {
            items: pageItems,
            total,
            page,
            pageSize
        };
    }
    async getInventoryBalance(input) {
        const row = await this.prisma.getExecutionClient().inventoryBalance.findUnique({
            where: {
                balanceKey: buildBalanceKey(input.tenantId, input.warehouseId, input.locationId ?? null, input.itemId)
            }
        });
        return row ? prisma_wms_record_mapper_1.PrismaWmsRecordMapper.toInventoryBalance(row) : null;
    }
    async searchInventoryBalances(input) {
        const { page, pageSize } = (0, wms_assertions_1.normalizePageInput)(input.page, input.pageSize);
        const rows = await this.prisma.getExecutionClient().inventoryBalance.findMany({
            where: {
                tenantId: input.tenantId
            },
            orderBy: [
                {
                    warehouseId: 'asc'
                },
                {
                    itemId: 'asc'
                }
            ]
        });
        const filtered = rows
            .map((row) => prisma_wms_record_mapper_1.PrismaWmsRecordMapper.toInventoryBalance(row))
            .filter((record) => !input.orgId || record.orgId === input.orgId)
            .filter((record) => !input.warehouseId || record.warehouseId === input.warehouseId)
            .filter((record) => {
            if (input.locationId === undefined) {
                return true;
            }
            return (record.locationId ?? null) === input.locationId;
        })
            .filter((record) => !input.itemId || record.itemId === input.itemId)
            .filter((record) => {
            if (!input.inventoryStatus || input.inventoryStatus === wms_records_1.InventoryBalanceStatusFilter.ANY) {
                return true;
            }
            if (input.inventoryStatus === wms_records_1.InventoryBalanceStatusFilter.AVAILABLE) {
                return Number(record.availableQuantity) > 0;
            }
            return Number(record.restrictedQuantity) > 0;
        })
            .filter((record) => {
            if (!input.restrictedReasonCode) {
                return true;
            }
            return record.restrictedQuantities.some((quantity) => quantity.reasonCode === input.restrictedReasonCode && Number(quantity.quantity) > 0);
        })
            .filter((record) => input.onlyPositiveOnHand === undefined || !input.onlyPositiveOnHand || Number(record.onHandQuantity) > 0);
        const { pageItems, total } = (0, wms_assertions_1.paginate)(filtered, page, pageSize);
        return {
            items: pageItems,
            total,
            page,
            pageSize
        };
    }
    async upsertBalance(client, entry, locationId) {
        const balanceKey = buildBalanceKey(entry.tenantId, entry.warehouseId, locationId, entry.itemId);
        const existing = await client.inventoryBalance.findUnique({
            where: {
                balanceKey
            }
        });
        const updated = projectBalance(existing ? prisma_wms_record_mapper_1.PrismaWmsRecordMapper.toInventoryBalance(existing) : null, entry, locationId);
        await client.inventoryBalance.upsert({
            where: {
                balanceKey
            },
            create: {
                balanceKey,
                tenantId: updated.tenantId,
                orgId: updated.orgId ?? null,
                warehouseId: updated.warehouseId,
                locationId: updated.locationId ?? null,
                itemId: updated.itemId,
                itemCode: updated.itemCode ?? null,
                itemName: updated.itemName ?? null,
                uom: updated.uom,
                onHandQuantity: updated.onHandQuantity,
                availableQuantity: updated.availableQuantity,
                restrictedQuantity: updated.restrictedQuantity,
                restrictedQuantities: prisma_wms_record_mapper_1.PrismaWmsRecordMapper.toInputJson(updated.restrictedQuantities),
                lastLedgerEntryId: updated.lastLedgerEntryId,
                lastPostedAt: new Date(updated.lastPostedAt),
                updatedAt: new Date(updated.updatedAt)
            },
            update: {
                orgId: updated.orgId ?? null,
                warehouseId: updated.warehouseId,
                locationId: updated.locationId ?? null,
                itemId: updated.itemId,
                itemCode: updated.itemCode ?? null,
                itemName: updated.itemName ?? null,
                uom: updated.uom,
                onHandQuantity: updated.onHandQuantity,
                availableQuantity: updated.availableQuantity,
                restrictedQuantity: updated.restrictedQuantity,
                restrictedQuantities: prisma_wms_record_mapper_1.PrismaWmsRecordMapper.toInputJson(updated.restrictedQuantities),
                lastLedgerEntryId: updated.lastLedgerEntryId,
                lastPostedAt: new Date(updated.lastPostedAt),
                updatedAt: new Date(updated.updatedAt)
            }
        });
    }
};
exports.PrismaInventoryRepository = PrismaInventoryRepository;
exports.PrismaInventoryRepository = PrismaInventoryRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaInventoryRepository);
function buildBalanceKey(tenantId, warehouseId, locationId, itemId) {
    return `${tenantId}:${warehouseId}:${locationId ?? '__WAREHOUSE__'}:${itemId}`;
}
function projectBalance(existing, entry, locationId) {
    const nextAvailableQuantity = entry.inventoryStatus === wms_records_1.InventoryStatus.AVAILABLE
        ? (0, wms_assertions_1.sumQuantities)([existing?.availableQuantity ?? '0', entry.quantityDelta])
        : existing?.availableQuantity ?? '0';
    const nextRestrictedQuantity = entry.inventoryStatus === wms_records_1.InventoryStatus.RESTRICTED
        ? (0, wms_assertions_1.sumQuantities)([existing?.restrictedQuantity ?? '0', entry.quantityDelta])
        : existing?.restrictedQuantity ?? '0';
    const restrictedQuantities = mergeRestrictedQuantities(existing?.restrictedQuantities ?? [], entry.restrictedReason?.reasonCode, entry.quantityDelta);
    return {
        tenantId: entry.tenantId,
        orgId: entry.orgId ?? existing?.orgId ?? null,
        warehouseId: entry.warehouseId,
        locationId,
        itemId: entry.itemId,
        itemCode: entry.itemCode ?? existing?.itemCode ?? null,
        itemName: entry.itemName ?? existing?.itemName ?? null,
        uom: entry.uom,
        onHandQuantity: (0, wms_assertions_1.sumQuantities)([existing?.onHandQuantity ?? '0', entry.quantityDelta]),
        availableQuantity: (0, wms_assertions_1.normalizeQuantity)(nextAvailableQuantity),
        restrictedQuantity: (0, wms_assertions_1.normalizeQuantity)(nextRestrictedQuantity),
        restrictedQuantities,
        lastLedgerEntryId: entry.stockLedgerEntryId,
        lastPostedAt: entry.postedAt,
        updatedAt: entry.postedAt
    };
}
function mergeRestrictedQuantities(existing, reasonCode, quantityDelta) {
    const byCode = new Map(existing.map((quantity) => [quantity.reasonCode, quantity.quantity]));
    if (reasonCode) {
        byCode.set(reasonCode, (0, wms_assertions_1.sumQuantities)([byCode.get(reasonCode) ?? '0', quantityDelta]));
    }
    return [...byCode.entries()].map(([code, quantity]) => ({
        reasonCode: code,
        quantity: (0, wms_assertions_1.normalizeQuantity)(quantity)
    }));
}
//# sourceMappingURL=prisma-inventory.repository.js.map