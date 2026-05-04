import { GetInventoryBalanceInput, InventoryBalanceRecord, PageResult, SearchInventoryBalancesInput, SearchStockLedgerEntriesInput, StockLedgerEntryRecord } from '../../../domain/models/wms-records';
import { InventoryRepository } from '../../../domain/repositories/inventory.repository';
import { PrismaService } from '../../prisma/prisma.service';
/** PrismaInventoryRepository persists immutable ledger facts and balance projections derived from those facts. */
export declare class PrismaInventoryRepository implements InventoryRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    applyLedgerEntries(entries: StockLedgerEntryRecord[]): Promise<void>;
    searchStockLedgerEntries(input: SearchStockLedgerEntriesInput): Promise<PageResult<StockLedgerEntryRecord>>;
    getInventoryBalance(input: GetInventoryBalanceInput): Promise<InventoryBalanceRecord | null>;
    searchInventoryBalances(input: SearchInventoryBalancesInput): Promise<PageResult<InventoryBalanceRecord>>;
    private upsertBalance;
}
