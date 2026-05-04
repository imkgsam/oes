import {
  InventoryBalance,
  Location,
  Prisma,
  Receipt,
  ReceiptLine,
  StockLedgerEntry,
  Warehouse,
  WmsInventoryStatus as PrismaWmsInventoryStatus,
  WmsLocationScope as PrismaWmsLocationScope,
  WmsLocationStatus as PrismaWmsLocationStatus,
  WmsLocationType as PrismaWmsLocationType,
  WmsReceiptSourceType as PrismaWmsReceiptSourceType,
  WmsReceiptStatus as PrismaWmsReceiptStatus,
  WmsStockLedgerDirection as PrismaWmsStockLedgerDirection,
  WmsStockLedgerEntryType as PrismaWmsStockLedgerEntryType,
  WmsStockLedgerSourceDocumentType as PrismaWmsStockLedgerSourceDocumentType,
  WmsWarehouseScope as PrismaWmsWarehouseScope,
  WmsWarehouseStatus as PrismaWmsWarehouseStatus
} from '../../../../prisma/generated/prisma'
import {
  InventoryBalanceRecord,
  InventoryBalanceRestrictedQuantityRecord,
  InventoryStatus,
  LocationRecord,
  LocationScope,
  LocationStatus,
  LocationType,
  ProcurementReceiptSummaryRecord,
  ReceiptLineRecord,
  ReceiptLineSummaryRecord,
  ReceiptPhysicalDiscrepancyRecord,
  ReceiptRecord,
  ReceiptSourceType,
  ReceiptStatus,
  ReceiptTrackingRefRecord,
  RestrictedStatusReasonRecord,
  StockLedgerDirection,
  StockLedgerEntryRecord,
  StockLedgerEntryType,
  StockLedgerSourceDocumentType,
  WarehouseRecord,
  WarehouseScope,
  WarehouseStatus
} from '../../../domain/models/wms-records'

const receiptInclude = {
  lines: {
    orderBy: {
      lineNo: 'asc'
    }
  }
} satisfies Prisma.ReceiptInclude

export type ReceiptAggregateRow = Prisma.ReceiptGetPayload<{
  include: typeof receiptInclude
}>

/** PrismaWmsRecordMapper translates Prisma WMS rows into the frozen phase 1 record shapes. */
export class PrismaWmsRecordMapper {
  /** receiptIncludeValue exposes the canonical include graph for receipt aggregate round-trips. */
  static receiptIncludeValue(): typeof receiptInclude {
    return receiptInclude
  }

  /** toWarehouse converts one persisted warehouse row into the domain record shape. */
  static toWarehouse(row: Warehouse): WarehouseRecord {
    return {
      warehouseId: row.id,
      warehouseCode: row.warehouseCode,
      warehouseName: row.warehouseName,
      tenantId: row.tenantId,
      orgId: row.orgId,
      warehouseScope: row.warehouseScope as unknown as WarehouseScope,
      status: row.status as unknown as WarehouseStatus,
      defaultReceivingLocationId: row.defaultReceivingLocationId,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString()
    }
  }

  /** toLocation converts one persisted location row into the domain record shape. */
  static toLocation(row: Location): LocationRecord {
    return {
      locationId: row.id,
      warehouseId: row.warehouseId,
      parentLocationId: row.parentLocationId,
      locationCode: row.locationCode,
      locationName: row.locationName,
      locationScope: row.locationScope as unknown as LocationScope,
      locationType: row.locationType as unknown as LocationType,
      status: row.status as unknown as LocationStatus,
      supportsReceipt: row.supportsReceipt,
      supportsStorage: row.supportsStorage,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString()
    }
  }

  /** toReceipt converts one persisted receipt aggregate row into the domain record shape. */
  static toReceipt(row: ReceiptAggregateRow): ReceiptRecord {
    return {
      receiptId: row.id,
      receiptNo: row.receiptNo,
      tenantId: row.tenantId,
      orgId: row.orgId,
      warehouseId: row.warehouseId,
      status: row.status as unknown as ReceiptStatus,
      receiptSourceType: row.receiptSourceType as unknown as ReceiptSourceType,
      referencedReceivingExpectationIds: this.fromJson<string[]>(row.referencedReceivingExpectationIds),
      receiptDate: row.receiptDate,
      note: row.note,
      attachmentRefs: this.fromJson<string[]>(row.attachmentRefs),
      lineCount: row.lineCount,
      postedAt: row.postedAt?.toISOString() ?? null,
      cancelledAt: row.cancelledAt?.toISOString() ?? null,
      cancelReason: row.cancelReason,
      postComment: row.postComment,
      procurementReceiptSummary: row.procurementReceiptSummary
        ? this.fromJson<ProcurementReceiptSummaryRecord>(row.procurementReceiptSummary)
        : null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      lines: row.lines.map((line) => this.toReceiptLine(line))
    }
  }

  /** toReceiptLineSummary combines one stored line and its receipt header into the search-row summary shape. */
  static toReceiptLineSummary(receipt: ReceiptRecord, line: ReceiptLineRecord): ReceiptLineSummaryRecord {
    return {
      ...line,
      receiptNo: receipt.receiptNo,
      warehouseId: receipt.warehouseId,
      postedAt: receipt.postedAt ?? null
    }
  }

  /** toStockLedgerEntry converts one persisted immutable ledger row into the domain record shape. */
  static toStockLedgerEntry(row: StockLedgerEntry): StockLedgerEntryRecord {
    return {
      stockLedgerEntryId: row.id,
      tenantId: row.tenantId,
      orgId: row.orgId,
      entryType: row.entryType as unknown as StockLedgerEntryType,
      direction: row.direction as unknown as StockLedgerDirection,
      warehouseId: row.warehouseId,
      locationId: row.locationId,
      itemId: row.itemId,
      itemCode: row.itemCode,
      itemName: row.itemName,
      quantityDelta: row.quantityDelta,
      uom: row.uom,
      inventoryStatus: row.inventoryStatus as unknown as InventoryStatus,
      restrictedReason: row.restrictedReason
        ? this.fromJson<RestrictedStatusReasonRecord>(row.restrictedReason)
        : null,
      sourceDocumentType: row.sourceDocumentType as unknown as StockLedgerSourceDocumentType,
      sourceDocumentId: row.sourceDocumentId,
      sourceDocumentLineId: row.sourceDocumentLineId,
      receivingExpectationId: row.receivingExpectationId,
      trackingRefs: this.fromJson<ReceiptTrackingRefRecord[]>(row.trackingRefs),
      postedAt: row.postedAt.toISOString()
    }
  }

  /** toInventoryBalance converts one persisted balance projection row into the domain record shape. */
  static toInventoryBalance(row: InventoryBalance): InventoryBalanceRecord {
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
      restrictedQuantities: this.fromJson<InventoryBalanceRestrictedQuantityRecord[]>(
        row.restrictedQuantities
      ),
      lastLedgerEntryId: row.lastLedgerEntryId,
      lastPostedAt: row.lastPostedAt.toISOString(),
      updatedAt: row.updatedAt.toISOString()
    }
  }

  /** toInputJson deep-clones one plain WMS payload into a Prisma JSON input payload. */
  static toInputJson(value: unknown): Prisma.InputJsonValue {
    return structuredClone(value) as Prisma.InputJsonValue
  }

  /** fromJson casts one stored JSON payload back into the snapshot shape used by WMS records. */
  static fromJson<T>(value: Prisma.JsonValue): T {
    return structuredClone(value) as T
  }

  /** toPersistedWarehouseScope converts the domain enum into the Prisma enum value. */
  static toPersistedWarehouseScope(value: WarehouseScope): PrismaWmsWarehouseScope {
    return value as unknown as PrismaWmsWarehouseScope
  }

  /** toPersistedWarehouseStatus converts the domain enum into the Prisma enum value. */
  static toPersistedWarehouseStatus(value: WarehouseStatus): PrismaWmsWarehouseStatus {
    return value as unknown as PrismaWmsWarehouseStatus
  }

  /** toPersistedLocationScope converts the domain enum into the Prisma enum value. */
  static toPersistedLocationScope(value: LocationScope): PrismaWmsLocationScope {
    return value as unknown as PrismaWmsLocationScope
  }

  /** toPersistedLocationType converts the domain enum into the Prisma enum value. */
  static toPersistedLocationType(value: LocationType): PrismaWmsLocationType {
    return value as unknown as PrismaWmsLocationType
  }

  /** toPersistedLocationStatus converts the domain enum into the Prisma enum value. */
  static toPersistedLocationStatus(value: LocationStatus): PrismaWmsLocationStatus {
    return value as unknown as PrismaWmsLocationStatus
  }

  /** toPersistedReceiptStatus converts the domain enum into the Prisma enum value. */
  static toPersistedReceiptStatus(value: ReceiptStatus): PrismaWmsReceiptStatus {
    return value as unknown as PrismaWmsReceiptStatus
  }

  /** toPersistedReceiptSourceType converts the domain enum into the Prisma enum value. */
  static toPersistedReceiptSourceType(value: ReceiptSourceType): PrismaWmsReceiptSourceType {
    return value as unknown as PrismaWmsReceiptSourceType
  }

  /** toPersistedInventoryStatus converts the domain enum into the Prisma enum value. */
  static toPersistedInventoryStatus(value: InventoryStatus): PrismaWmsInventoryStatus {
    return value as unknown as PrismaWmsInventoryStatus
  }

  /** toPersistedStockLedgerEntryType converts the domain enum into the Prisma enum value. */
  static toPersistedStockLedgerEntryType(value: StockLedgerEntryType): PrismaWmsStockLedgerEntryType {
    return value as unknown as PrismaWmsStockLedgerEntryType
  }

  /** toPersistedStockLedgerDirection converts the domain enum into the Prisma enum value. */
  static toPersistedStockLedgerDirection(value: StockLedgerDirection): PrismaWmsStockLedgerDirection {
    return value as unknown as PrismaWmsStockLedgerDirection
  }

  /** toPersistedStockLedgerSourceDocumentType converts the domain enum into the Prisma enum value. */
  static toPersistedStockLedgerSourceDocumentType(
    value: StockLedgerSourceDocumentType
  ): PrismaWmsStockLedgerSourceDocumentType {
    return value as unknown as PrismaWmsStockLedgerSourceDocumentType
  }

  private static toReceiptLine(row: ReceiptLine): ReceiptLineRecord {
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
      inventoryStatus: row.inventoryStatus as unknown as InventoryStatus,
      restrictedReason: row.restrictedReason
        ? this.fromJson<RestrictedStatusReasonRecord>(row.restrictedReason)
        : null,
      trackingRefs: this.fromJson<ReceiptTrackingRefRecord[]>(row.trackingRefs),
      physicalDiscrepancy: row.physicalDiscrepancy
        ? this.fromJson<ReceiptPhysicalDiscrepancyRecord>(row.physicalDiscrepancy)
        : null,
      evidenceAttachmentRefs: this.fromJson<string[]>(row.evidenceAttachmentRefs),
      postedStockLedgerEntryIds: this.fromJson<string[]>(row.postedStockLedgerEntryIds),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString()
    }
  }
}
