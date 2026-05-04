import { IQueryHandler } from '@nestjs/cqrs';
import { InventoryBalanceRecord } from '../../domain/models/wms-records';
import { InventoryRepository } from '../../domain/repositories/inventory.repository';
import { GetInventoryBalanceQuery } from './get-inventory-balance.query';
/** GetInventoryBalanceHandler returns one balance projection snapshot derived from immutable ledger truth. */
export declare class GetInventoryBalanceHandler implements IQueryHandler<GetInventoryBalanceQuery, InventoryBalanceRecord> {
    private readonly inventoryRepository;
    constructor(inventoryRepository: InventoryRepository);
    execute(query: GetInventoryBalanceQuery): Promise<InventoryBalanceRecord>;
}
