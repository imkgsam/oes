"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryReceiptRepository = void 0;
const wms_assertions_1 = require("../../../application/support/wms-assertions");
/** InMemoryReceiptRepository provides deterministic receipt persistence for WMS L1 tests. */
class InMemoryReceiptRepository {
    store;
    constructor(store) {
        this.store = store;
    }
    async nextReceiptNo(_tenantId) {
        const next = this.store.nextReceiptNo++;
        return `RC-${next.toString().padStart(6, '0')}`;
    }
    async findById(tenantId, receiptId) {
        const record = this.store.receipts.get(receiptId);
        return record?.tenantId === tenantId ? structuredClone(record) : null;
    }
    async findLineById(tenantId, receiptLineId) {
        for (const receipt of this.store.receipts.values()) {
            if (receipt.tenantId !== tenantId) {
                continue;
            }
            const line = receipt.lines.find((candidate) => candidate.receiptLineId === receiptLineId);
            if (line) {
                return structuredClone({
                    ...line,
                    receiptNo: receipt.receiptNo,
                    warehouseId: receipt.warehouseId,
                    postedAt: receipt.postedAt ?? null
                });
            }
        }
        return null;
    }
    async save(record) {
        this.store.receipts.set(record.receiptId, structuredClone(record));
        return structuredClone(record);
    }
    async searchReceipts(input) {
        const { page, pageSize } = (0, wms_assertions_1.normalizePageInput)(input.page, input.pageSize);
        const keyword = (0, wms_assertions_1.normalizeOptionalString)(input.keyword)?.toLowerCase();
        const filtered = [...this.store.receipts.values()]
            .filter((record) => record.tenantId === input.tenantId)
            .filter((record) => !input.orgId || record.orgId === input.orgId)
            .filter((record) => !input.warehouseId || record.warehouseId === input.warehouseId)
            .filter((record) => !input.status || record.status === input.status)
            .filter((record) => !input.receiptSourceType || record.receiptSourceType === input.receiptSourceType)
            .filter((record) => !input.receivingExpectationId ||
            record.referencedReceivingExpectationIds.includes(input.receivingExpectationId) ||
            record.lines.some((line) => line.receivingExpectationId === input.receivingExpectationId))
            .filter((record) => {
            if (!keyword) {
                return true;
            }
            return (record.receiptNo.toLowerCase().includes(keyword) ||
                (record.note ?? '').toLowerCase().includes(keyword) ||
                record.lines.some((line) => line.trackingRefs.some((trackingRef) => trackingRef.trackingRefValue.toLowerCase().includes(keyword))));
        })
            .filter((record) => !input.receiptDateFrom || record.receiptDate >= input.receiptDateFrom)
            .filter((record) => !input.receiptDateTo || record.receiptDate <= input.receiptDateTo)
            .filter((record) => !input.postedAtFrom || (record.postedAt ?? '') >= input.postedAtFrom)
            .filter((record) => !input.postedAtTo || (record.postedAt ?? '') <= input.postedAtTo)
            .sort((left, right) => left.receiptNo.localeCompare(right.receiptNo))
            .map((record) => structuredClone(record));
        const { pageItems, total } = (0, wms_assertions_1.paginate)(filtered, page, pageSize);
        return { items: pageItems, total, page, pageSize };
    }
    async searchReceiptLines(input) {
        const { page, pageSize } = (0, wms_assertions_1.normalizePageInput)(input.page, input.pageSize);
        const filtered = [...this.store.receipts.values()]
            .filter((receipt) => receipt.tenantId === input.tenantId)
            .filter((receipt) => !input.orgId || receipt.orgId === input.orgId)
            .filter((receipt) => !input.receiptId || receipt.receiptId === input.receiptId)
            .filter((receipt) => !input.warehouseId || receipt.warehouseId === input.warehouseId)
            .flatMap((receipt) => receipt.lines.map((line) => ({
            ...line,
            receiptNo: receipt.receiptNo,
            warehouseId: receipt.warehouseId,
            postedAt: receipt.postedAt ?? null
        })))
            .filter((line) => !input.targetLocationId || line.targetLocationId === input.targetLocationId)
            .filter((line) => !input.itemId || line.itemId === input.itemId)
            .filter((line) => !input.receivingExpectationId || line.receivingExpectationId === input.receivingExpectationId)
            .filter((line) => !input.inventoryStatus || line.inventoryStatus === input.inventoryStatus)
            .filter((line) => !input.restrictedReasonCode || line.restrictedReason?.reasonCode === input.restrictedReasonCode)
            .filter((line) => !input.discrepancyType || line.physicalDiscrepancy?.discrepancyType === input.discrepancyType)
            .filter((line) => !input.postedAtFrom || (line.postedAt ?? '') >= input.postedAtFrom)
            .filter((line) => !input.postedAtTo || (line.postedAt ?? '') <= input.postedAtTo)
            .sort((left, right) => left.receiptNo.localeCompare(right.receiptNo))
            .map((record) => structuredClone(record));
        const { pageItems, total } = (0, wms_assertions_1.paginate)(filtered, page, pageSize);
        return { items: pageItems, total, page, pageSize };
    }
}
exports.InMemoryReceiptRepository = InMemoryReceiptRepository;
//# sourceMappingURL=in-memory-receipt.repository.js.map