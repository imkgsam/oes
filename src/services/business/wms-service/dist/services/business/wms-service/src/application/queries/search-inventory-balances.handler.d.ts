import { IQueryHandler } from '@nestjs/cqrs';
import { InventoryBalanceRecord, PageResult } from '../../domain/models/wms-records';
import { InventoryRepository } from '../../domain/repositories/inventory.repository';
import { SearchInventoryBalancesQuery } from './search-inventory-balances.query';
/** SearchInventoryBalancesHandler returns one filtered balance projection page for the query surface. */
export declare class SearchInventoryBalancesHandler implements IQueryHandler<SearchInventoryBalancesQuery, PageResult<InventoryBalanceRecord>> {
    private readonly inventoryRepository;
    constructor(inventoryRepository: InventoryRepository);
    execute(query: SearchInventoryBalancesQuery): Promise<PageResult<InventoryBalanceRecord>>;
}
