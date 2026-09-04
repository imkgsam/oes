import { InventoryBalanceRecord, LocationRecord, ReceiptRecord, StockLedgerEntryRecord, WarehouseRecord } from '../../domain/models/wms-records'

/** WmsInMemoryStore holds the isolated aggregate maps used by the Unit in-memory repositories. */
export class WmsInMemoryStore {
  readonly warehouses = new Map<string, WarehouseRecord>()
  readonly locations = new Map<string, LocationRecord>()
  readonly receipts = new Map<string, ReceiptRecord>()
  readonly stockLedgerEntries = new Map<string, StockLedgerEntryRecord>()
  readonly inventoryBalances = new Map<string, InventoryBalanceRecord>()
  nextReceiptNo = 1
}
