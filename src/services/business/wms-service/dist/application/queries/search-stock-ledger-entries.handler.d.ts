import { IQueryHandler } from '@nestjs/cqrs';
import { PageResult, StockLedgerEntryRecord } from '../../domain/models/wms-records';
import { InventoryRepository } from '../../domain/repositories/inventory.repository';
import { SearchStockLedgerEntriesQuery } from './search-stock-ledger-entries.query';
/** SearchStockLedgerEntriesHandler returns one filtered immutable ledger page for the query surface. */
export declare class SearchStockLedgerEntriesHandler implements IQueryHandler<SearchStockLedgerEntriesQuery, PageResult<StockLedgerEntryRecord>> {
    private readonly inventoryRepository;
    constructor(inventoryRepository: InventoryRepository);
    execute(query: SearchStockLedgerEntriesQuery): Promise<PageResult<StockLedgerEntryRecord>>;
}
