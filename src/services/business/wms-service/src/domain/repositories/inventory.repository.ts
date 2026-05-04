import { GetInventoryBalanceInput, InventoryBalanceRecord, PageResult, SearchInventoryBalancesInput, SearchStockLedgerEntriesInput, StockLedgerEntryRecord } from '../models/wms-records'

/** InventoryRepository persists immutable ledger facts and the balance projection derived from those facts. */
export interface InventoryRepository {
  applyLedgerEntries(entries: StockLedgerEntryRecord[]): Promise<void>
  searchStockLedgerEntries(input: SearchStockLedgerEntriesInput): Promise<PageResult<StockLedgerEntryRecord>>
  getInventoryBalance(input: GetInventoryBalanceInput): Promise<InventoryBalanceRecord | null>
  searchInventoryBalances(input: SearchInventoryBalancesInput): Promise<PageResult<InventoryBalanceRecord>>
}
