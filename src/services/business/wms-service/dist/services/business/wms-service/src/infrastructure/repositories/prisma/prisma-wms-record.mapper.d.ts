import { InventoryBalance, Location, Prisma, StockLedgerEntry, Warehouse, WmsInventoryStatus as PrismaWmsInventoryStatus, WmsLocationScope as PrismaWmsLocationScope, WmsLocationStatus as PrismaWmsLocationStatus, WmsLocationType as PrismaWmsLocationType, WmsReceiptSourceType as PrismaWmsReceiptSourceType, WmsReceiptStatus as PrismaWmsReceiptStatus, WmsStockLedgerDirection as PrismaWmsStockLedgerDirection, WmsStockLedgerEntryType as PrismaWmsStockLedgerEntryType, WmsStockLedgerSourceDocumentType as PrismaWmsStockLedgerSourceDocumentType, WmsWarehouseScope as PrismaWmsWarehouseScope, WmsWarehouseStatus as PrismaWmsWarehouseStatus } from '../../../../prisma/generated/prisma';
import { InventoryBalanceRecord, InventoryStatus, LocationRecord, LocationScope, LocationStatus, LocationType, ReceiptLineRecord, ReceiptLineSummaryRecord, ReceiptRecord, ReceiptSourceType, ReceiptStatus, StockLedgerDirection, StockLedgerEntryRecord, StockLedgerEntryType, StockLedgerSourceDocumentType, WarehouseRecord, WarehouseScope, WarehouseStatus } from '../../../domain/models/wms-records';
declare const receiptInclude: {
    lines: {
        orderBy: {
            lineNo: "asc";
        };
    };
};
export type ReceiptAggregateRow = Prisma.ReceiptGetPayload<{
    include: typeof receiptInclude;
}>;
/** PrismaWmsRecordMapper translates Prisma WMS rows into the frozen phase 1 record shapes. */
export declare class PrismaWmsRecordMapper {
    /** receiptIncludeValue exposes the canonical include graph for receipt aggregate round-trips. */
    static receiptIncludeValue(): typeof receiptInclude;
    /** toWarehouse converts one persisted warehouse row into the domain record shape. */
    static toWarehouse(row: Warehouse): WarehouseRecord;
    /** toLocation converts one persisted location row into the domain record shape. */
    static toLocation(row: Location): LocationRecord;
    /** toReceipt converts one persisted receipt aggregate row into the domain record shape. */
    static toReceipt(row: ReceiptAggregateRow): ReceiptRecord;
    /** toReceiptLineSummary combines one stored line and its receipt header into the search-row summary shape. */
    static toReceiptLineSummary(receipt: ReceiptRecord, line: ReceiptLineRecord): ReceiptLineSummaryRecord;
    /** toStockLedgerEntry converts one persisted immutable ledger row into the domain record shape. */
    static toStockLedgerEntry(row: StockLedgerEntry): StockLedgerEntryRecord;
    /** toInventoryBalance converts one persisted balance projection row into the domain record shape. */
    static toInventoryBalance(row: InventoryBalance): InventoryBalanceRecord;
    /** toInputJson deep-clones one plain WMS payload into a Prisma JSON input payload. */
    static toInputJson(value: unknown): Prisma.InputJsonValue;
    /** fromJson casts one stored JSON payload back into the snapshot shape used by WMS records. */
    static fromJson<T>(value: Prisma.JsonValue): T;
    /** toPersistedWarehouseScope converts the domain enum into the Prisma enum value. */
    static toPersistedWarehouseScope(value: WarehouseScope): PrismaWmsWarehouseScope;
    /** toPersistedWarehouseStatus converts the domain enum into the Prisma enum value. */
    static toPersistedWarehouseStatus(value: WarehouseStatus): PrismaWmsWarehouseStatus;
    /** toPersistedLocationScope converts the domain enum into the Prisma enum value. */
    static toPersistedLocationScope(value: LocationScope): PrismaWmsLocationScope;
    /** toPersistedLocationType converts the domain enum into the Prisma enum value. */
    static toPersistedLocationType(value: LocationType): PrismaWmsLocationType;
    /** toPersistedLocationStatus converts the domain enum into the Prisma enum value. */
    static toPersistedLocationStatus(value: LocationStatus): PrismaWmsLocationStatus;
    /** toPersistedReceiptStatus converts the domain enum into the Prisma enum value. */
    static toPersistedReceiptStatus(value: ReceiptStatus): PrismaWmsReceiptStatus;
    /** toPersistedReceiptSourceType converts the domain enum into the Prisma enum value. */
    static toPersistedReceiptSourceType(value: ReceiptSourceType): PrismaWmsReceiptSourceType;
    /** toPersistedInventoryStatus converts the domain enum into the Prisma enum value. */
    static toPersistedInventoryStatus(value: InventoryStatus): PrismaWmsInventoryStatus;
    /** toPersistedStockLedgerEntryType converts the domain enum into the Prisma enum value. */
    static toPersistedStockLedgerEntryType(value: StockLedgerEntryType): PrismaWmsStockLedgerEntryType;
    /** toPersistedStockLedgerDirection converts the domain enum into the Prisma enum value. */
    static toPersistedStockLedgerDirection(value: StockLedgerDirection): PrismaWmsStockLedgerDirection;
    /** toPersistedStockLedgerSourceDocumentType converts the domain enum into the Prisma enum value. */
    static toPersistedStockLedgerSourceDocumentType(value: StockLedgerSourceDocumentType): PrismaWmsStockLedgerSourceDocumentType;
    private static toReceiptLine;
}
export {};
