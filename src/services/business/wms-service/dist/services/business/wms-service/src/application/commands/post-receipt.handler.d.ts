import { ICommandHandler } from '@nestjs/cqrs';
import { ReceivingExpectationLookupPort } from '../ports/receiving-expectation-lookup.port';
import { StockableItemLookupPort } from '../ports/stockable-item-lookup.port';
import { InventoryRepository } from '../../domain/repositories/inventory.repository';
import { ReceiptRepository } from '../../domain/repositories/receipt.repository';
import { WarehouseRepository } from '../../domain/repositories/warehouse.repository';
import { ReceiptRecord } from '../../domain/models/wms-records';
import { PostReceiptCommand } from './post-receipt.command';
/** PostReceiptHandler validates a draft receipt and converts it into immutable ledger truth plus refreshed balances. */
export declare class PostReceiptHandler implements ICommandHandler<PostReceiptCommand, ReceiptRecord> {
    private readonly receiptRepository;
    private readonly warehouseRepository;
    private readonly inventoryRepository;
    private readonly stockableItemLookup;
    private readonly receivingExpectationLookup;
    constructor(receiptRepository: ReceiptRepository, warehouseRepository: WarehouseRepository, inventoryRepository: InventoryRepository, stockableItemLookup: StockableItemLookupPort, receivingExpectationLookup: ReceivingExpectationLookupPort);
    execute(command: PostReceiptCommand): Promise<ReceiptRecord>;
}
