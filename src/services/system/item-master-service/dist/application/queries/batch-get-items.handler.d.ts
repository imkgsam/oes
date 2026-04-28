import { IQueryHandler } from '@nestjs/cqrs';
import { Item } from '../../domain/aggregates/item.aggregate';
import { ItemRepository } from '../../domain/repositories/item.repository';
import { BatchGetItemsQuery } from './batch-get-items.query';
export interface BatchGetItemsResult {
    items: Item[];
    missingItemIds: string[];
}
/** BatchGetItemsHandler preserves normal partial-miss semantics instead of escalating missing ids to errors. */
export declare class BatchGetItemsHandler implements IQueryHandler<BatchGetItemsQuery, BatchGetItemsResult> {
    private readonly itemRepository;
    constructor(itemRepository: ItemRepository);
    execute(query: BatchGetItemsQuery): Promise<BatchGetItemsResult>;
}
