"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WmsGrpcPresenter = void 0;
const wms_service_1 = require("@oes/common/generated/wms_service");
const wms_records_1 = require("../../domain/models/wms-records");
const wms_write_support_1 = require("../../application/support/wms-write-support");
/** WmsGrpcPresenter translates WMS phase 1 records into the generated gRPC response surface. */
class WmsGrpcPresenter {
    /** toCreateReceiptDraftResponse presents one created receipt draft on the gRPC command surface. */
    static toCreateReceiptDraftResponse(record) {
        return {
            receipt: this.toReceipt(record)
        };
    }
    /** toAddOrReplaceReceiptLinesResponse presents one updated draft receipt on the gRPC command surface. */
    static toAddOrReplaceReceiptLinesResponse(record) {
        return {
            receipt: this.toReceipt(record)
        };
    }
    /** toPostReceiptResponse presents one posted receipt plus its newly created ledger ids on the gRPC command surface. */
    static toPostReceiptResponse(record) {
        return {
            receipt: this.toReceipt(record),
            postedStockLedgerEntryIds: record.lines.flatMap((line) => line.postedStockLedgerEntryIds)
        };
    }
    /** toCancelReceiptDraftResponse presents one cancelled draft receipt on the gRPC command surface. */
    static toCancelReceiptDraftResponse(record) {
        return {
            receipt: this.toReceipt(record)
        };
    }
    /** toGetWarehouseResponse presents one warehouse truth row on the gRPC query surface. */
    static toGetWarehouseResponse(record) {
        return {
            warehouse: this.toWarehouse(record)
        };
    }
    /** toListWarehousesResponse presents one warehouse page on the gRPC query surface. */
    static toListWarehousesResponse(input) {
        return {
            warehouses: input.items.map((record) => this.toWarehouseSummary(record)),
            total: input.total,
            page: input.page,
            pageSize: input.pageSize
        };
    }
    /** toGetLocationResponse presents one location truth row on the gRPC query surface. */
    static toGetLocationResponse(record) {
        return {
            location: this.toLocation(record)
        };
    }
    /** toListLocationsResponse presents one location page on the gRPC query surface. */
    static toListLocationsResponse(input) {
        return {
            locations: input.items.map((record) => this.toLocationSummary(record)),
            total: input.total,
            page: input.page,
            pageSize: input.pageSize
        };
    }
    /** toGetReceiptResponse presents one receipt aggregate on the gRPC query surface. */
    static toGetReceiptResponse(record) {
        return {
            receipt: this.toReceipt(record)
        };
    }
    /** toSearchReceiptsResponse presents one receipt summary page on the gRPC query surface. */
    static toSearchReceiptsResponse(input) {
        return {
            receipts: input.items.map((record) => this.toReceiptSummary(record)),
            total: input.total,
            page: input.page,
            pageSize: input.pageSize
        };
    }
    /** toGetReceiptLineResponse presents one receipt-line truth row on the gRPC query surface. */
    static toGetReceiptLineResponse(record) {
        return {
            receiptLine: this.toReceiptLine(record)
        };
    }
    /** toSearchReceiptLinesResponse presents one receipt-line summary page on the gRPC query surface. */
    static toSearchReceiptLinesResponse(input) {
        return {
            receiptLines: input.items.map((record) => this.toReceiptLineSummary(record)),
            total: input.total,
            page: input.page,
            pageSize: input.pageSize
        };
    }
    /** toSearchStockLedgerEntriesResponse presents one immutable ledger page on the gRPC query surface. */
    static toSearchStockLedgerEntriesResponse(input) {
        return {
            entries: input.items.map((record) => this.toStockLedgerEntrySummary(record)),
            total: input.total,
            page: input.page,
            pageSize: input.pageSize
        };
    }
    /** toGetInventoryBalanceResponse presents one balance projection snapshot on the gRPC query surface. */
    static toGetInventoryBalanceResponse(record) {
        return {
            inventoryBalance: this.toInventoryBalance(record)
        };
    }
    /** toSearchInventoryBalancesResponse presents one balance page on the gRPC query surface. */
    static toSearchInventoryBalancesResponse(input) {
        return {
            inventoryBalances: input.items.map((record) => this.toInventoryBalanceSummary(record)),
            total: input.total,
            page: input.page,
            pageSize: input.pageSize
        };
    }
    /** toWarehouse converts one WMS warehouse record into the generated gRPC read shape. */
    static toWarehouse(record) {
        return {
            warehouseId: record.warehouseId,
            warehouseCode: record.warehouseCode,
            warehouseName: record.warehouseName,
            tenantId: record.tenantId,
            orgId: record.orgId ?? undefined,
            warehouseScope: toProtoWarehouseScope(record.warehouseScope),
            status: toProtoWarehouseStatus(record.status),
            defaultReceivingLocationId: record.defaultReceivingLocationId ?? undefined,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt
        };
    }
    /** toWarehouseSummary converts one warehouse record into the generated summary shape. */
    static toWarehouseSummary(record) {
        return {
            warehouseId: record.warehouseId,
            warehouseCode: record.warehouseCode,
            warehouseName: record.warehouseName,
            warehouseScope: toProtoWarehouseScope(record.warehouseScope),
            status: toProtoWarehouseStatus(record.status),
            defaultReceivingLocationId: record.defaultReceivingLocationId ?? undefined
        };
    }
    /** toLocation converts one WMS location record into the generated gRPC read shape. */
    static toLocation(record) {
        return {
            locationId: record.locationId,
            warehouseId: record.warehouseId,
            parentLocationId: record.parentLocationId ?? undefined,
            locationCode: record.locationCode,
            locationName: record.locationName,
            locationScope: toProtoLocationScope(record.locationScope),
            locationType: toProtoLocationType(record.locationType),
            status: toProtoLocationStatus(record.status),
            supportsReceipt: record.supportsReceipt,
            supportsStorage: record.supportsStorage,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt
        };
    }
    /** toLocationSummary converts one location record into the generated summary shape. */
    static toLocationSummary(record) {
        return {
            locationId: record.locationId,
            warehouseId: record.warehouseId,
            parentLocationId: record.parentLocationId ?? undefined,
            locationCode: record.locationCode,
            locationName: record.locationName,
            locationScope: toProtoLocationScope(record.locationScope),
            locationType: toProtoLocationType(record.locationType),
            status: toProtoLocationStatus(record.status),
            supportsReceipt: record.supportsReceipt,
            supportsStorage: record.supportsStorage
        };
    }
    /** toReceipt converts one WMS receipt aggregate into the generated gRPC read shape. */
    static toReceipt(record) {
        return {
            receiptId: record.receiptId,
            receiptNo: record.receiptNo,
            tenantId: record.tenantId,
            orgId: record.orgId ?? undefined,
            warehouseId: record.warehouseId,
            status: toProtoReceiptStatus(record.status),
            receiptSourceType: toProtoReceiptSourceType(record.receiptSourceType),
            referencedReceivingExpectationIds: record.referencedReceivingExpectationIds,
            receiptDate: record.receiptDate,
            note: record.note ?? undefined,
            attachmentRefs: record.attachmentRefs,
            lineCount: record.lineCount,
            postedAt: record.postedAt ?? undefined,
            cancelledAt: record.cancelledAt ?? undefined,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
            lines: record.lines.map((line) => this.toReceiptLine(line))
        };
    }
    /** toReceiptLine converts one receipt-line record into the generated gRPC read shape. */
    static toReceiptLine(record) {
        return {
            receiptLineId: record.receiptLineId,
            receiptId: record.receiptId,
            lineNo: record.lineNo,
            itemId: record.itemId,
            itemCode: record.itemCode ?? undefined,
            itemName: record.itemName ?? undefined,
            receivingExpectationId: record.receivingExpectationId ?? undefined,
            targetLocationId: record.targetLocationId,
            confirmedQuantity: record.confirmedQuantity,
            uom: record.uom,
            inventoryStatus: toProtoInventoryStatus(record.inventoryStatus),
            restrictedReason: record.restrictedReason ? this.toRestrictedStatusReason(record.restrictedReason) : undefined,
            trackingRefs: record.trackingRefs.map((trackingRef) => this.toReceiptTrackingRef(trackingRef)),
            physicalDiscrepancy: record.physicalDiscrepancy
                ? this.toReceiptPhysicalDiscrepancy(record.physicalDiscrepancy)
                : undefined,
            evidenceAttachmentRefs: record.evidenceAttachmentRefs,
            postedStockLedgerEntryIds: record.postedStockLedgerEntryIds,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt
        };
    }
    /** toReceiptSummary converts one receipt aggregate into the generated summary shape. */
    static toReceiptSummary(record) {
        return {
            receiptId: record.receiptId,
            receiptNo: record.receiptNo,
            warehouseId: record.warehouseId,
            status: toProtoReceiptStatus(record.status),
            receiptSourceType: toProtoReceiptSourceType(record.receiptSourceType),
            receiptDate: record.receiptDate,
            lineCount: record.lineCount,
            postedAt: record.postedAt ?? undefined,
            hasRestrictedLines: (0, wms_write_support_1.hasRestrictedLines)(record),
            hasPhysicalDiscrepancy: (0, wms_write_support_1.hasPhysicalDiscrepancy)(record)
        };
    }
    /** toReceiptLineSummary converts one receipt-line summary record into the generated summary shape. */
    static toReceiptLineSummary(record) {
        return {
            receiptLineId: record.receiptLineId,
            receiptId: record.receiptId,
            receiptNo: record.receiptNo,
            lineNo: record.lineNo,
            warehouseId: record.warehouseId,
            itemId: record.itemId,
            itemCode: record.itemCode ?? undefined,
            itemName: record.itemName ?? undefined,
            receivingExpectationId: record.receivingExpectationId ?? undefined,
            targetLocationId: record.targetLocationId,
            confirmedQuantity: record.confirmedQuantity,
            uom: record.uom,
            inventoryStatus: toProtoInventoryStatus(record.inventoryStatus),
            restrictedReasonCode: record.restrictedReason
                ? toProtoRestrictedStatusReasonCode(record.restrictedReason.reasonCode)
                : undefined,
            discrepancyType: record.physicalDiscrepancy
                ? toProtoReceiptPhysicalDiscrepancyType(record.physicalDiscrepancy.discrepancyType)
                : undefined,
            postedAt: record.postedAt ?? undefined
        };
    }
    /** toStockLedgerEntrySummary converts one immutable ledger record into the generated summary shape. */
    static toStockLedgerEntrySummary(record) {
        return {
            stockLedgerEntryId: record.stockLedgerEntryId,
            entryType: toProtoStockLedgerEntryType(record.entryType),
            warehouseId: record.warehouseId,
            locationId: record.locationId,
            itemId: record.itemId,
            quantityDelta: record.quantityDelta,
            uom: record.uom,
            inventoryStatus: toProtoInventoryStatus(record.inventoryStatus),
            restrictedReasonCode: record.restrictedReason
                ? toProtoRestrictedStatusReasonCode(record.restrictedReason.reasonCode)
                : undefined,
            sourceDocumentId: record.sourceDocumentId,
            postedAt: record.postedAt
        };
    }
    /** toInventoryBalance converts one balance projection record into the generated gRPC read shape. */
    static toInventoryBalance(record) {
        return {
            tenantId: record.tenantId,
            orgId: record.orgId ?? undefined,
            warehouseId: record.warehouseId,
            locationId: record.locationId ?? undefined,
            itemId: record.itemId,
            itemCode: record.itemCode ?? undefined,
            itemName: record.itemName ?? undefined,
            uom: record.uom,
            onHandQuantity: record.onHandQuantity,
            availableQuantity: record.availableQuantity,
            restrictedQuantity: record.restrictedQuantity,
            restrictedQuantities: record.restrictedQuantities.map((quantity) => this.toInventoryBalanceRestrictedQuantity(quantity)),
            lastLedgerEntryId: record.lastLedgerEntryId,
            lastPostedAt: record.lastPostedAt,
            updatedAt: record.updatedAt
        };
    }
    /** toInventoryBalanceSummary converts one balance projection record into the generated summary shape. */
    static toInventoryBalanceSummary(record) {
        return {
            warehouseId: record.warehouseId,
            locationId: record.locationId ?? undefined,
            itemId: record.itemId,
            itemCode: record.itemCode ?? undefined,
            itemName: record.itemName ?? undefined,
            uom: record.uom,
            onHandQuantity: record.onHandQuantity,
            availableQuantity: record.availableQuantity,
            restrictedQuantity: record.restrictedQuantity,
            lastPostedAt: record.lastPostedAt
        };
    }
    static toRestrictedStatusReason(record) {
        return {
            reasonCode: toProtoRestrictedStatusReasonCode(record.reasonCode),
            reasonNote: record.reasonNote ?? undefined
        };
    }
    static toReceiptTrackingRef(record) {
        return {
            trackingRefType: toProtoReceiptTrackingRefType(record.trackingRefType),
            trackingRefValue: record.trackingRefValue
        };
    }
    static toReceiptPhysicalDiscrepancy(record) {
        return {
            discrepancyType: toProtoReceiptPhysicalDiscrepancyType(record.discrepancyType),
            discrepancyQuantity: record.discrepancyQuantity ?? undefined,
            note: record.note ?? undefined
        };
    }
    static toInventoryBalanceRestrictedQuantity(record) {
        return {
            reasonCode: toProtoRestrictedStatusReasonCode(record.reasonCode),
            quantity: record.quantity
        };
    }
}
exports.WmsGrpcPresenter = WmsGrpcPresenter;
function toProtoWarehouseScope(value) {
    return value === wms_records_1.WarehouseScope.INTERNAL
        ? wms_service_1.WarehouseScope.WAREHOUSE_SCOPE_INTERNAL
        : wms_service_1.WarehouseScope.WAREHOUSE_SCOPE_UNSPECIFIED;
}
function toProtoWarehouseStatus(value) {
    switch (value) {
        case wms_records_1.WarehouseStatus.INACTIVE:
            return wms_service_1.WarehouseStatus.WAREHOUSE_STATUS_INACTIVE;
        default:
            return wms_service_1.WarehouseStatus.WAREHOUSE_STATUS_ACTIVE;
    }
}
function toProtoLocationScope(value) {
    return value === wms_records_1.LocationScope.INTERNAL
        ? wms_service_1.LocationScope.LOCATION_SCOPE_INTERNAL
        : wms_service_1.LocationScope.LOCATION_SCOPE_UNSPECIFIED;
}
function toProtoLocationType(value) {
    switch (value) {
        case wms_records_1.LocationType.STORAGE:
            return wms_service_1.LocationType.LOCATION_TYPE_STORAGE;
        case wms_records_1.LocationType.STAGING:
            return wms_service_1.LocationType.LOCATION_TYPE_STAGING;
        case wms_records_1.LocationType.RESTRICTED:
            return wms_service_1.LocationType.LOCATION_TYPE_RESTRICTED;
        default:
            return wms_service_1.LocationType.LOCATION_TYPE_RECEIVING;
    }
}
function toProtoLocationStatus(value) {
    return value === wms_records_1.LocationStatus.INACTIVE
        ? wms_service_1.LocationStatus.LOCATION_STATUS_INACTIVE
        : wms_service_1.LocationStatus.LOCATION_STATUS_ACTIVE;
}
function toProtoReceiptStatus(value) {
    switch (value) {
        case wms_records_1.ReceiptStatus.POSTED:
            return wms_service_1.ReceiptStatus.RECEIPT_STATUS_POSTED;
        case wms_records_1.ReceiptStatus.CANCELLED:
            return wms_service_1.ReceiptStatus.RECEIPT_STATUS_CANCELLED;
        default:
            return wms_service_1.ReceiptStatus.RECEIPT_STATUS_DRAFT;
    }
}
function toProtoReceiptSourceType(value) {
    return value === wms_records_1.ReceiptSourceType.RECEIVING_EXPECTATION_REFERENCE
        ? wms_service_1.ReceiptSourceType.RECEIPT_SOURCE_TYPE_RECEIVING_EXPECTATION_REFERENCE
        : wms_service_1.ReceiptSourceType.RECEIPT_SOURCE_TYPE_MANUAL;
}
function toProtoInventoryStatus(value) {
    return value === wms_records_1.InventoryStatus.RESTRICTED
        ? wms_service_1.InventoryStatus.INVENTORY_STATUS_RESTRICTED
        : wms_service_1.InventoryStatus.INVENTORY_STATUS_AVAILABLE;
}
function toProtoRestrictedStatusReasonCode(value) {
    switch (value) {
        case wms_records_1.RestrictedStatusReasonCode.DAMAGED:
            return wms_service_1.RestrictedStatusReasonCode.RESTRICTED_STATUS_REASON_CODE_DAMAGED;
        case wms_records_1.RestrictedStatusReasonCode.QUALITY_HOLD:
            return wms_service_1.RestrictedStatusReasonCode.RESTRICTED_STATUS_REASON_CODE_QUALITY_HOLD;
        case wms_records_1.RestrictedStatusReasonCode.PENDING_IDENTIFICATION:
            return wms_service_1.RestrictedStatusReasonCode.RESTRICTED_STATUS_REASON_CODE_PENDING_IDENTIFICATION;
        case wms_records_1.RestrictedStatusReasonCode.PENDING_DECISION:
            return wms_service_1.RestrictedStatusReasonCode.RESTRICTED_STATUS_REASON_CODE_PENDING_DECISION;
        default:
            return wms_service_1.RestrictedStatusReasonCode.RESTRICTED_STATUS_REASON_CODE_OTHER;
    }
}
function toProtoReceiptTrackingRefType(value) {
    switch (value) {
        case wms_records_1.ReceiptTrackingRefType.UNIT_CODE:
            return wms_service_1.ReceiptTrackingRefType.RECEIPT_TRACKING_REF_TYPE_UNIT_CODE;
        case wms_records_1.ReceiptTrackingRefType.EXTERNAL_CODE:
            return wms_service_1.ReceiptTrackingRefType.RECEIPT_TRACKING_REF_TYPE_EXTERNAL_CODE;
        case wms_records_1.ReceiptTrackingRefType.FREE_TEXT:
            return wms_service_1.ReceiptTrackingRefType.RECEIPT_TRACKING_REF_TYPE_FREE_TEXT;
        default:
            return wms_service_1.ReceiptTrackingRefType.RECEIPT_TRACKING_REF_TYPE_BOX_CODE;
    }
}
function toProtoReceiptPhysicalDiscrepancyType(value) {
    switch (value) {
        case wms_records_1.ReceiptPhysicalDiscrepancyType.SHORT_RECEIVED:
            return wms_service_1.ReceiptPhysicalDiscrepancyType.RECEIPT_PHYSICAL_DISCREPANCY_TYPE_SHORT_RECEIVED;
        case wms_records_1.ReceiptPhysicalDiscrepancyType.OVER_RECEIVED:
            return wms_service_1.ReceiptPhysicalDiscrepancyType.RECEIPT_PHYSICAL_DISCREPANCY_TYPE_OVER_RECEIVED;
        case wms_records_1.ReceiptPhysicalDiscrepancyType.DAMAGED:
            return wms_service_1.ReceiptPhysicalDiscrepancyType.RECEIPT_PHYSICAL_DISCREPANCY_TYPE_DAMAGED;
        case wms_records_1.ReceiptPhysicalDiscrepancyType.WRONG_ITEM:
            return wms_service_1.ReceiptPhysicalDiscrepancyType.RECEIPT_PHYSICAL_DISCREPANCY_TYPE_WRONG_ITEM;
        case wms_records_1.ReceiptPhysicalDiscrepancyType.QUALITY_HOLD:
            return wms_service_1.ReceiptPhysicalDiscrepancyType.RECEIPT_PHYSICAL_DISCREPANCY_TYPE_QUALITY_HOLD;
        default:
            return wms_service_1.ReceiptPhysicalDiscrepancyType.RECEIPT_PHYSICAL_DISCREPANCY_TYPE_OTHER;
    }
}
function toProtoStockLedgerEntryType(value) {
    return value === wms_records_1.StockLedgerEntryType.RECEIPT_POSTED
        ? wms_service_1.StockLedgerEntryType.STOCK_LEDGER_ENTRY_TYPE_RECEIPT_POSTED
        : wms_service_1.StockLedgerEntryType.STOCK_LEDGER_ENTRY_TYPE_UNSPECIFIED;
}
//# sourceMappingURL=wms-grpc.presenter.js.map