import { GetInventoryBalanceInput, InventoryBalanceRecord, PageResult, SearchInventoryBalancesInput, SearchStockLedgerEntriesInput, StockLedgerEntryRecord } from '../../../domain/models/wms-records';
import { InventoryRepository } from '../../../domain/repositories/inventory.repository';
import { WmsInMemoryStore } from '../../store/wms-in-memory-store';
/** InMemoryInventoryRepository provides deterministic ledger and projection behavior for WMS L1 tests. */
export declare class InMemoryInventoryRepository implements InventoryRepository {
    private readonly store;
    constructor(store: WmsInMemoryStore);
    applyLedgerEntries(entries: StockLedgerEntryRecord[]): Promise<void>;
    searchStockLedgerEntries(input: SearchStockLedgerEntriesInput): Promise<PageResult<StockLedgerEntryRecord>>;
    getInventoryBalance(input: GetInventoryBalanceInput): Promise<InventoryBalanceRecord | null>;
    searchInventoryBalances(input: SearchInventoryBalancesInput): Promise<PageResult<InventoryBalanceRecord>>;
    private upsertBalance;
}
