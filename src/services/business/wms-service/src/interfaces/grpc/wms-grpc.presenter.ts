import {
  AddOrReplaceReceiptLinesResponse,
  CancelReceiptDraftResponse,
  CreateReceiptDraftResponse,
  GetInventoryBalanceResponse,
  GetLocationResponse,
  GetReceiptLineResponse,
  GetReceiptResponse,
  GetWarehouseResponse,
  InventoryBalance,
  InventoryBalanceRestrictedQuantity,
  InventoryBalanceStatusFilter as ProtoInventoryBalanceStatusFilter,
  InventoryBalanceSummary,
  InventoryStatus as ProtoInventoryStatus,
  ListLocationsResponse,
  ListWarehousesResponse,
  Location,
  LocationScope as ProtoLocationScope,
  LocationStatus as ProtoLocationStatus,
  LocationSummary,
  LocationType as ProtoLocationType,
  PostReceiptResponse,
  Receipt,
  ReceiptLine,
  ReceiptLineSummary,
  ReceiptPhysicalDiscrepancy,
  ReceiptPhysicalDiscrepancyType as ProtoReceiptPhysicalDiscrepancyType,
  ReceiptSourceType as ProtoReceiptSourceType,
  ReceiptStatus as ProtoReceiptStatus,
  ReceiptSummary,
  ReceiptTrackingRef,
  ReceiptTrackingRefType as ProtoReceiptTrackingRefType,
  RestrictedStatusReason,
  RestrictedStatusReasonCode as ProtoRestrictedStatusReasonCode,
  SearchInventoryBalancesResponse,
  SearchReceiptLinesResponse,
  SearchReceiptsResponse,
  SearchStockLedgerEntriesResponse,
  StockLedgerEntrySummary,
  StockLedgerEntryType as ProtoStockLedgerEntryType,
  Warehouse,
  WarehouseScope as ProtoWarehouseScope,
  WarehouseStatus as ProtoWarehouseStatus,
  WarehouseSummary
} from '@oes/common/generated/wms_service'
import {
  InventoryBalanceRecord,
  InventoryBalanceRestrictedQuantityRecord,
  InventoryStatus,
  LocationRecord,
  LocationScope,
  LocationStatus,
  LocationType,
  PageResult,
  ReceiptLineRecord,
  ReceiptLineSummaryRecord,
  ReceiptPhysicalDiscrepancyRecord,
  ReceiptPhysicalDiscrepancyType,
  ReceiptRecord,
  ReceiptSourceType,
  ReceiptStatus,
  ReceiptTrackingRefRecord,
  ReceiptTrackingRefType,
  RestrictedStatusReasonCode,
  RestrictedStatusReasonRecord,
  StockLedgerEntryRecord,
  StockLedgerEntryType,
  WarehouseRecord,
  WarehouseScope,
  WarehouseStatus
} from '../../domain/models/wms-records'
import { hasPhysicalDiscrepancy, hasRestrictedLines } from '../../application/support/wms-write-support'

/** WmsGrpcPresenter translates WMS phase 1 records into the generated gRPC response surface. */
export class WmsGrpcPresenter {
  /** toCreateReceiptDraftResponse presents one created receipt draft on the gRPC command surface. */
  static toCreateReceiptDraftResponse(record: ReceiptRecord): CreateReceiptDraftResponse {
    return {
      receipt: this.toReceipt(record)
    }
  }

  /** toAddOrReplaceReceiptLinesResponse presents one updated draft receipt on the gRPC command surface. */
  static toAddOrReplaceReceiptLinesResponse(record: ReceiptRecord): AddOrReplaceReceiptLinesResponse {
    return {
      receipt: this.toReceipt(record)
    }
  }

  /** toPostReceiptResponse presents one posted receipt plus its newly created ledger ids on the gRPC command surface. */
  static toPostReceiptResponse(record: ReceiptRecord): PostReceiptResponse {
    return {
      receipt: this.toReceipt(record),
      postedStockLedgerEntryIds: record.lines.flatMap((line) => line.postedStockLedgerEntryIds)
    }
  }

  /** toCancelReceiptDraftResponse presents one cancelled draft receipt on the gRPC command surface. */
  static toCancelReceiptDraftResponse(record: ReceiptRecord): CancelReceiptDraftResponse {
    return {
      receipt: this.toReceipt(record)
    }
  }

  /** toGetWarehouseResponse presents one warehouse truth row on the gRPC query surface. */
  static toGetWarehouseResponse(record: WarehouseRecord): GetWarehouseResponse {
    return {
      warehouse: this.toWarehouse(record)
    }
  }

  /** toListWarehousesResponse presents one warehouse page on the gRPC query surface. */
  static toListWarehousesResponse(input: PageResult<WarehouseRecord>): ListWarehousesResponse {
    return {
      warehouses: input.items.map((record) => this.toWarehouseSummary(record)),
      total: input.total,
      page: input.page,
      pageSize: input.pageSize
    }
  }

  /** toGetLocationResponse presents one location truth row on the gRPC query surface. */
  static toGetLocationResponse(record: LocationRecord): GetLocationResponse {
    return {
      location: this.toLocation(record)
    }
  }

  /** toListLocationsResponse presents one location page on the gRPC query surface. */
  static toListLocationsResponse(input: PageResult<LocationRecord>): ListLocationsResponse {
    return {
      locations: input.items.map((record) => this.toLocationSummary(record)),
      total: input.total,
      page: input.page,
      pageSize: input.pageSize
    }
  }

  /** toGetReceiptResponse presents one receipt aggregate on the gRPC query surface. */
  static toGetReceiptResponse(record: ReceiptRecord): GetReceiptResponse {
    return {
      receipt: this.toReceipt(record)
    }
  }

  /** toSearchReceiptsResponse presents one receipt summary page on the gRPC query surface. */
  static toSearchReceiptsResponse(input: PageResult<ReceiptRecord>): SearchReceiptsResponse {
    return {
      receipts: input.items.map((record) => this.toReceiptSummary(record)),
      total: input.total,
      page: input.page,
      pageSize: input.pageSize
    }
  }

  /** toGetReceiptLineResponse presents one receipt-line truth row on the gRPC query surface. */
  static toGetReceiptLineResponse(record: ReceiptLineSummaryRecord): GetReceiptLineResponse {
    return {
      receiptLine: this.toReceiptLine(record)
    }
  }

  /** toSearchReceiptLinesResponse presents one receipt-line summary page on the gRPC query surface. */
  static toSearchReceiptLinesResponse(input: PageResult<ReceiptLineSummaryRecord>): SearchReceiptLinesResponse {
    return {
      receiptLines: input.items.map((record) => this.toReceiptLineSummary(record)),
      total: input.total,
      page: input.page,
      pageSize: input.pageSize
    }
  }

  /** toSearchStockLedgerEntriesResponse presents one immutable ledger page on the gRPC query surface. */
  static toSearchStockLedgerEntriesResponse(
    input: PageResult<StockLedgerEntryRecord>
  ): SearchStockLedgerEntriesResponse {
    return {
      entries: input.items.map((record) => this.toStockLedgerEntrySummary(record)),
      total: input.total,
      page: input.page,
      pageSize: input.pageSize
    }
  }

  /** toGetInventoryBalanceResponse presents one balance projection snapshot on the gRPC query surface. */
  static toGetInventoryBalanceResponse(record: InventoryBalanceRecord): GetInventoryBalanceResponse {
    return {
      inventoryBalance: this.toInventoryBalance(record)
    }
  }

  /** toSearchInventoryBalancesResponse presents one balance page on the gRPC query surface. */
  static toSearchInventoryBalancesResponse(
    input: PageResult<InventoryBalanceRecord>
  ): SearchInventoryBalancesResponse {
    return {
      inventoryBalances: input.items.map((record) => this.toInventoryBalanceSummary(record)),
      total: input.total,
      page: input.page,
      pageSize: input.pageSize
    }
  }

  /** toWarehouse converts one WMS warehouse record into the generated gRPC read shape. */
  static toWarehouse(record: WarehouseRecord): Warehouse {
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
    }
  }

  /** toWarehouseSummary converts one warehouse record into the generated summary shape. */
  static toWarehouseSummary(record: WarehouseRecord): WarehouseSummary {
    return {
      warehouseId: record.warehouseId,
      warehouseCode: record.warehouseCode,
      warehouseName: record.warehouseName,
      warehouseScope: toProtoWarehouseScope(record.warehouseScope),
      status: toProtoWarehouseStatus(record.status),
      defaultReceivingLocationId: record.defaultReceivingLocationId ?? undefined
    }
  }

  /** toLocation converts one WMS location record into the generated gRPC read shape. */
  static toLocation(record: LocationRecord): Location {
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
    }
  }

  /** toLocationSummary converts one location record into the generated summary shape. */
  static toLocationSummary(record: LocationRecord): LocationSummary {
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
    }
  }

  /** toReceipt converts one WMS receipt aggregate into the generated gRPC read shape. */
  static toReceipt(record: ReceiptRecord): Receipt {
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
    }
  }

  /** toReceiptLine converts one receipt-line record into the generated gRPC read shape. */
  static toReceiptLine(record: ReceiptLineRecord): ReceiptLine {
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
    }
  }

  /** toReceiptSummary converts one receipt aggregate into the generated summary shape. */
  static toReceiptSummary(record: ReceiptRecord): ReceiptSummary {
    return {
      receiptId: record.receiptId,
      receiptNo: record.receiptNo,
      warehouseId: record.warehouseId,
      status: toProtoReceiptStatus(record.status),
      receiptSourceType: toProtoReceiptSourceType(record.receiptSourceType),
      receiptDate: record.receiptDate,
      lineCount: record.lineCount,
      postedAt: record.postedAt ?? undefined,
      hasRestrictedLines: hasRestrictedLines(record),
      hasPhysicalDiscrepancy: hasPhysicalDiscrepancy(record)
    }
  }

  /** toReceiptLineSummary converts one receipt-line summary record into the generated summary shape. */
  static toReceiptLineSummary(record: ReceiptLineSummaryRecord): ReceiptLineSummary {
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
    }
  }

  /** toStockLedgerEntrySummary converts one immutable ledger record into the generated summary shape. */
  static toStockLedgerEntrySummary(record: StockLedgerEntryRecord): StockLedgerEntrySummary {
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
    }
  }

  /** toInventoryBalance converts one balance projection record into the generated gRPC read shape. */
  static toInventoryBalance(record: InventoryBalanceRecord): InventoryBalance {
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
      restrictedQuantities: record.restrictedQuantities.map((quantity) =>
        this.toInventoryBalanceRestrictedQuantity(quantity)
      ),
      lastLedgerEntryId: record.lastLedgerEntryId,
      lastPostedAt: record.lastPostedAt,
      updatedAt: record.updatedAt
    }
  }

  /** toInventoryBalanceSummary converts one balance projection record into the generated summary shape. */
  static toInventoryBalanceSummary(record: InventoryBalanceRecord): InventoryBalanceSummary {
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
    }
  }

  private static toRestrictedStatusReason(record: RestrictedStatusReasonRecord): RestrictedStatusReason {
    return {
      reasonCode: toProtoRestrictedStatusReasonCode(record.reasonCode),
      reasonNote: record.reasonNote ?? undefined
    }
  }

  private static toReceiptTrackingRef(record: ReceiptTrackingRefRecord): ReceiptTrackingRef {
    return {
      trackingRefType: toProtoReceiptTrackingRefType(record.trackingRefType),
      trackingRefValue: record.trackingRefValue
    }
  }

  private static toReceiptPhysicalDiscrepancy(
    record: ReceiptPhysicalDiscrepancyRecord
  ): ReceiptPhysicalDiscrepancy {
    return {
      discrepancyType: toProtoReceiptPhysicalDiscrepancyType(record.discrepancyType),
      discrepancyQuantity: record.discrepancyQuantity ?? undefined,
      note: record.note ?? undefined
    }
  }

  private static toInventoryBalanceRestrictedQuantity(
    record: InventoryBalanceRestrictedQuantityRecord
  ): InventoryBalanceRestrictedQuantity {
    return {
      reasonCode: toProtoRestrictedStatusReasonCode(record.reasonCode),
      quantity: record.quantity
    }
  }
}

function toProtoWarehouseScope(value: WarehouseScope): ProtoWarehouseScope {
  return value === WarehouseScope.INTERNAL
    ? ProtoWarehouseScope.WAREHOUSE_SCOPE_INTERNAL
    : ProtoWarehouseScope.WAREHOUSE_SCOPE_UNSPECIFIED
}

function toProtoWarehouseStatus(value: WarehouseStatus): ProtoWarehouseStatus {
  switch (value) {
    case WarehouseStatus.INACTIVE:
      return ProtoWarehouseStatus.WAREHOUSE_STATUS_INACTIVE
    default:
      return ProtoWarehouseStatus.WAREHOUSE_STATUS_ACTIVE
  }
}

function toProtoLocationScope(value: LocationScope): ProtoLocationScope {
  return value === LocationScope.INTERNAL
    ? ProtoLocationScope.LOCATION_SCOPE_INTERNAL
    : ProtoLocationScope.LOCATION_SCOPE_UNSPECIFIED
}

function toProtoLocationType(value: LocationType): ProtoLocationType {
  switch (value) {
    case LocationType.STORAGE:
      return ProtoLocationType.LOCATION_TYPE_STORAGE
    case LocationType.STAGING:
      return ProtoLocationType.LOCATION_TYPE_STAGING
    case LocationType.RESTRICTED:
      return ProtoLocationType.LOCATION_TYPE_RESTRICTED
    default:
      return ProtoLocationType.LOCATION_TYPE_RECEIVING
  }
}

function toProtoLocationStatus(value: LocationStatus): ProtoLocationStatus {
  return value === LocationStatus.INACTIVE
    ? ProtoLocationStatus.LOCATION_STATUS_INACTIVE
    : ProtoLocationStatus.LOCATION_STATUS_ACTIVE
}

function toProtoReceiptStatus(value: ReceiptStatus): ProtoReceiptStatus {
  switch (value) {
    case ReceiptStatus.POSTED:
      return ProtoReceiptStatus.RECEIPT_STATUS_POSTED
    case ReceiptStatus.CANCELLED:
      return ProtoReceiptStatus.RECEIPT_STATUS_CANCELLED
    default:
      return ProtoReceiptStatus.RECEIPT_STATUS_DRAFT
  }
}

function toProtoReceiptSourceType(value: ReceiptSourceType): ProtoReceiptSourceType {
  return value === ReceiptSourceType.RECEIVING_EXPECTATION_REFERENCE
    ? ProtoReceiptSourceType.RECEIPT_SOURCE_TYPE_RECEIVING_EXPECTATION_REFERENCE
    : ProtoReceiptSourceType.RECEIPT_SOURCE_TYPE_MANUAL
}

function toProtoInventoryStatus(value: InventoryStatus): ProtoInventoryStatus {
  return value === InventoryStatus.RESTRICTED
    ? ProtoInventoryStatus.INVENTORY_STATUS_RESTRICTED
    : ProtoInventoryStatus.INVENTORY_STATUS_AVAILABLE
}

function toProtoRestrictedStatusReasonCode(
  value: RestrictedStatusReasonCode
): ProtoRestrictedStatusReasonCode {
  switch (value) {
    case RestrictedStatusReasonCode.DAMAGED:
      return ProtoRestrictedStatusReasonCode.RESTRICTED_STATUS_REASON_CODE_DAMAGED
    case RestrictedStatusReasonCode.QUALITY_HOLD:
      return ProtoRestrictedStatusReasonCode.RESTRICTED_STATUS_REASON_CODE_QUALITY_HOLD
    case RestrictedStatusReasonCode.PENDING_IDENTIFICATION:
      return ProtoRestrictedStatusReasonCode.RESTRICTED_STATUS_REASON_CODE_PENDING_IDENTIFICATION
    case RestrictedStatusReasonCode.PENDING_DECISION:
      return ProtoRestrictedStatusReasonCode.RESTRICTED_STATUS_REASON_CODE_PENDING_DECISION
    default:
      return ProtoRestrictedStatusReasonCode.RESTRICTED_STATUS_REASON_CODE_OTHER
  }
}

function toProtoReceiptTrackingRefType(value: ReceiptTrackingRefType): ProtoReceiptTrackingRefType {
  switch (value) {
    case ReceiptTrackingRefType.UNIT_CODE:
      return ProtoReceiptTrackingRefType.RECEIPT_TRACKING_REF_TYPE_UNIT_CODE
    case ReceiptTrackingRefType.EXTERNAL_CODE:
      return ProtoReceiptTrackingRefType.RECEIPT_TRACKING_REF_TYPE_EXTERNAL_CODE
    case ReceiptTrackingRefType.FREE_TEXT:
      return ProtoReceiptTrackingRefType.RECEIPT_TRACKING_REF_TYPE_FREE_TEXT
    default:
      return ProtoReceiptTrackingRefType.RECEIPT_TRACKING_REF_TYPE_BOX_CODE
  }
}

function toProtoReceiptPhysicalDiscrepancyType(
  value: ReceiptPhysicalDiscrepancyType
): ProtoReceiptPhysicalDiscrepancyType {
  switch (value) {
    case ReceiptPhysicalDiscrepancyType.SHORT_RECEIVED:
      return ProtoReceiptPhysicalDiscrepancyType.RECEIPT_PHYSICAL_DISCREPANCY_TYPE_SHORT_RECEIVED
    case ReceiptPhysicalDiscrepancyType.OVER_RECEIVED:
      return ProtoReceiptPhysicalDiscrepancyType.RECEIPT_PHYSICAL_DISCREPANCY_TYPE_OVER_RECEIVED
    case ReceiptPhysicalDiscrepancyType.DAMAGED:
      return ProtoReceiptPhysicalDiscrepancyType.RECEIPT_PHYSICAL_DISCREPANCY_TYPE_DAMAGED
    case ReceiptPhysicalDiscrepancyType.WRONG_ITEM:
      return ProtoReceiptPhysicalDiscrepancyType.RECEIPT_PHYSICAL_DISCREPANCY_TYPE_WRONG_ITEM
    case ReceiptPhysicalDiscrepancyType.QUALITY_HOLD:
      return ProtoReceiptPhysicalDiscrepancyType.RECEIPT_PHYSICAL_DISCREPANCY_TYPE_QUALITY_HOLD
    default:
      return ProtoReceiptPhysicalDiscrepancyType.RECEIPT_PHYSICAL_DISCREPANCY_TYPE_OTHER
  }
}

function toProtoStockLedgerEntryType(value: StockLedgerEntryType): ProtoStockLedgerEntryType {
  return value === StockLedgerEntryType.RECEIPT_POSTED
    ? ProtoStockLedgerEntryType.STOCK_LEDGER_ENTRY_TYPE_RECEIPT_POSTED
    : ProtoStockLedgerEntryType.STOCK_LEDGER_ENTRY_TYPE_UNSPECIFIED
}
