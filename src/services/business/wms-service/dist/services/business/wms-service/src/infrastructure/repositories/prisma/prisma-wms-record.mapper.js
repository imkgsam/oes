"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaWmsRecordMapper = void 0;
const receiptInclude = {
    lines: {
        orderBy: {
            lineNo: 'asc'
        }
    }
};
/** PrismaWmsRecordMapper translates Prisma WMS rows into the frozen phase 1 record shapes. */
class PrismaWmsRecordMapper {
    /** receiptIncludeValue exposes the canonical include graph for receipt aggregate round-trips. */
    static receiptIncludeValue() {
        return receiptInclude;
    }
    /** toWarehouse converts one persisted warehouse row into the domain record shape. */
    static toWarehouse(row) {
        return {
            warehouseId: row.id,
            warehouseCode: row.warehouseCode,
            warehouseName: row.warehouseName,
            tenantId: row.tenantId,
            orgId: row.orgId,
            warehouseScope: row.warehouseScope,
            status: row.status,
            defaultReceivingLocationId: row.defaultReceivingLocationId,
            createdAt: row.createdAt.toISOString(),
            updatedAt: row.updatedAt.toISOString()
        };
    }
    /** toLocation converts one persisted location row into the domain record shape. */
    static toLocation(row) {
        return {
            locationId: row.id,
            warehouseId: row.warehouseId,
            parentLocationId: row.parentLocationId,
            locationCode: row.locationCode,
            locationName: row.locationName,
            locationScope: row.locationScope,
            locationType: row.locationType,
            status: row.status,
            supportsReceipt: row.supportsReceipt,
            supportsStorage: row.supportsStorage,
            createdAt: row.createdAt.toISOString(),
            updatedAt: row.updatedAt.toISOString()
        };
    }
    /** toReceipt converts one persisted receipt aggregate row into the domain record shape. */
    static toReceipt(row) {
        return {
            receiptId: row.id,
            receiptNo: row.receiptNo,
            tenantId: row.tenantId,
            orgId: row.orgId,
            warehouseId: row.warehouseId,
            status: row.status,
            receiptSourceType: row.receiptSourceType,
            referencedReceivingExpectationIds: this.fromJson(row.referencedReceivingExpectationIds),
            receiptDate: row.receiptDate,
            note: row.note,
            attachmentRefs: this.fromJson(row.attachmentRefs),
            lineCount: row.lineCount,
            postedAt: row.postedAt?.toISOString() ?? null,
            cancelledAt: row.cancelledAt?.toISOString() ?? null,
            cancelReason: row.cancelReason,
            postComment: row.postComment,
            procurementReceiptSummary: row.procurementReceiptSummary
                ? this.fromJson(row.procurementReceiptSummary)
                : null,
            createdAt: row.createdAt.toISOString(),
            updatedAt: row.updatedAt.toISOString(),
            lines: row.lines.map((line) => this.toReceiptLine(line))
        };
    }
    /** toReceiptLineSummary combines one stored line and its receipt header into the search-row summary shape. */
    static toReceiptLineSummary(receipt, line) {
        return {
            ...line,
            receiptNo: receipt.receiptNo,
            warehouseId: receipt.warehouseId,
            postedAt: receipt.postedAt ?? null
        };
    }
    /** toStockLedgerEntry converts one persisted immutable ledger row into the domain record shape. */
    static toStockLedgerEntry(row) {
        return {
            stockLedgerEntryId: row.id,
            tenantId: row.tenantId,
            orgId: row.orgId,
            entryType: row.entryType,
            direction: row.direction,
            warehouseId: row.warehouseId,
            locationId: row.locationId,
            itemId: row.itemId,
            itemCode: row.itemCode,
            itemName: row.itemName,
            quantityDelta: row.quantityDelta,
            uom: row.uom,
            inventoryStatus: row.inventoryStatus,
            restrictedReason: row.restrictedReason
                ? this.fromJson(row.restrictedReason)
                : null,
            sourceDocumentType: row.sourceDocumentType,
            sourceDocumentId: row.sourceDocumentId,
            sourceDocumentLineId: row.sourceDocumentLineId,
            receivingExpectationId: row.receivingExpectationId,
            trackingRefs: this.fromJson(row.trackingRefs),
            postedAt: row.postedAt.toISOString()
        };
    }
    /** toInventoryBalance converts one persisted balance projection row into the domain record shape. */
    static toInventoryBalance(row) {
        return {
            tenantId: row.tenantId,
            orgId: row.orgId,
            warehouseId: row.warehouseId,
            locationId: row.locationId,
            itemId: row.itemId,
            itemCode: row.itemCode,
            itemName: row.itemName,
            uom: row.uom,
            onHandQuantity: row.onHandQuantity,
            availableQuantity: row.availableQuantity,
            restrictedQuantity: row.restrictedQuantity,
            restrictedQuantities: this.fromJson(row.restrictedQuantities),
            lastLedgerEntryId: row.lastLedgerEntryId,
            lastPostedAt: row.lastPostedAt.toISOString(),
            updatedAt: row.updatedAt.toISOString()
        };
    }
    /** toInputJson deep-clones one plain WMS payload into a Prisma JSON input payload. */
    static toInputJson(value) {
        return structuredClone(value);
    }
    /** fromJson casts one stored JSON payload back into the snapshot shape used by WMS records. */
    static fromJson(value) {
        return structuredClone(value);
    }
    /** toPersistedWarehouseScope converts the domain enum into the Prisma enum value. */
    static toPersistedWarehouseScope(value) {
        return value;
    }
    /** toPersistedWarehouseStatus converts the domain enum into the Prisma enum value. */
    static toPersistedWarehouseStatus(value) {
        return value;
    }
    /** toPersistedLocationScope converts the domain enum into the Prisma enum value. */
    static toPersistedLocationScope(value) {
        return value;
    }
    /** toPersistedLocationType converts the domain enum into the Prisma enum value. */
    static toPersistedLocationType(value) {
        return value;
    }
    /** toPersistedLocationStatus converts the domain enum into the Prisma enum value. */
    static toPersistedLocationStatus(value) {
        return value;
    }
    /** toPersistedReceiptStatus converts the domain enum into the Prisma enum value. */
    static toPersistedReceiptStatus(value) {
        return value;
    }
    /** toPersistedReceiptSourceType converts the domain enum into the Prisma enum value. */
    static toPersistedReceiptSourceType(value) {
        return value;
    }
    /** toPersistedInventoryStatus converts the domain enum into the Prisma enum value. */
    static toPersistedInventoryStatus(value) {
        return value;
    }
    /** toPersistedStockLedgerEntryType converts the domain enum into the Prisma enum value. */
    static toPersistedStockLedgerEntryType(value) {
        return value;
    }
    /** toPersistedStockLedgerDirection converts the domain enum into the Prisma enum value. */
    static toPersistedStockLedgerDirection(value) {
        return value;
    }
    /** toPersistedStockLedgerSourceDocumentType converts the domain enum into the Prisma enum value. */
    static toPersistedStockLedgerSourceDocumentType(value) {
        return value;
    }
    static toReceiptLine(row) {
        return {
            receiptLineId: row.id,
            receiptId: row.receiptId,
            lineNo: row.lineNo,
            itemId: row.itemId,
            itemCode: row.itemCode,
            itemName: row.itemName,
            receivingExpectationId: row.receivingExpectationId,
            targetLocationId: row.targetLocationId,
            confirmedQuantity: row.confirmedQuantity,
            uom: row.uom,
            inventoryStatus: row.inventoryStatus,
            restrictedReason: row.restrictedReason
                ? this.fromJson(row.restrictedReason)
                : null,
            trackingRefs: this.fromJson(row.trackingRefs),
            physicalDiscrepancy: row.physicalDiscrepancy
                ? this.fromJson(row.physicalDiscrepancy)
                : null,
            evidenceAttachmentRefs: this.fromJson(row.evidenceAttachmentRefs),
            postedStockLedgerEntryIds: this.fromJson(row.postedStockLedgerEntryIds),
            createdAt: row.createdAt.toISOString(),
            updatedAt: row.updatedAt.toISOString()
        };
    }
}
exports.PrismaWmsRecordMapper = PrismaWmsRecordMapper;
//# sourceMappingURL=prisma-wms-record.mapper.js.map