"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryInventoryRepository = void 0;
const wms_records_1 = require("../../../domain/models/wms-records");
const wms_assertions_1 = require("../../../application/support/wms-assertions");
/** InMemoryInventoryRepository provides deterministic ledger and projection behavior for WMS L1 tests. */
class InMemoryInventoryRepository {
    store;
    constructor(store) {
        this.store = store;
    }
    async applyLedgerEntries(entries) {
        for (const entry of entries) {
            this.store.stockLedgerEntries.set(entry.stockLedgerEntryId, structuredClone(entry));
            this.upsertBalance(entry, entry.locationId);
            this.upsertBalance(entry, null);
        }
    }
    async searchStockLedgerEntries(input) {
        const { page, pageSize } = (0, wms_assertions_1.normalizePageInput)(input.page, input.pageSize);
        const filtered = [...this.store.stockLedgerEntries.values()]
            .filter((record) => record.tenantId === input.tenantId)
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
            .filter((record) => !input.postedAtTo || record.postedAt <= input.postedAtTo)
            .sort((left, right) => left.postedAt.localeCompare(right.postedAt))
            .map((record) => structuredClone(record));
        const { pageItems, total } = (0, wms_assertions_1.paginate)(filtered, page, pageSize);
        return { items: pageItems, total, page, pageSize };
    }
    async getInventoryBalance(input) {
        return (structuredClone(this.store.inventoryBalances.get(buildBalanceKey(input.tenantId, input.warehouseId, input.locationId ?? null, input.itemId)) ?? null));
    }
    async searchInventoryBalances(input) {
        const { page, pageSize } = (0, wms_assertions_1.normalizePageInput)(input.page, input.pageSize);
        const filtered = [...this.store.inventoryBalances.values()]
            .filter((record) => record.tenantId === input.tenantId)
            .filter((record) => !input.orgId || record.orgId === input.orgId)
            .filter((record) => !input.warehouseId || record.warehouseId === input.warehouseId)
            .filter((record) => input.locationId === undefined || (record.locationId ?? null) === input.locationId)
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
            .filter((record) => input.onlyPositiveOnHand === undefined || !input.onlyPositiveOnHand || Number(record.onHandQuantity) > 0)
            .sort((left, right) => left.itemId.localeCompare(right.itemId))
            .map((record) => structuredClone(record));
        const { pageItems, total } = (0, wms_assertions_1.paginate)(filtered, page, pageSize);
        return { items: pageItems, total, page, pageSize };
    }
    upsertBalance(entry, locationId) {
        const key = buildBalanceKey(entry.tenantId, entry.warehouseId, locationId, entry.itemId);
        const existing = this.store.inventoryBalances.get(key) ?? null;
        this.store.inventoryBalances.set(key, projectBalance(existing, entry, locationId));
    }
}
exports.InMemoryInventoryRepository = InMemoryInventoryRepository;
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
        restrictedQuantities: mergeRestrictedQuantities(existing?.restrictedQuantities ?? [], entry.restrictedReason?.reasonCode, entry.quantityDelta),
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
//# sourceMappingURL=in-memory-inventory.repository.js.map