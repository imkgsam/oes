import { InventoryBalanceRecord, LocationRecord, ReceiptRecord, StockLedgerEntryRecord, WarehouseRecord } from '../../domain/models/wms-records';
/** WmsInMemoryStore holds the isolated aggregate maps used by the L1 in-memory repositories. */
export declare class WmsInMemoryStore {
    readonly warehouses: Map<string, WarehouseRecord>;
    readonly locations: Map<string, LocationRecord>;
    readonly receipts: Map<string, ReceiptRecord>;
    readonly stockLedgerEntries: Map<string, StockLedgerEntryRecord>;
    readonly inventoryBalances: Map<string, InventoryBalanceRecord>;
    nextReceiptNo: number;
}
