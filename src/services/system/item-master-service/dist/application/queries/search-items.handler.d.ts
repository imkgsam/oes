import { IQueryHandler } from '@nestjs/cqrs';
import { ItemCategoryRepository } from '../../domain/repositories/item-category.repository';
import { ItemRepository, SearchItemsResult } from '../../domain/repositories/item.repository';
import { SearchItemsQuery } from './search-items.query';
/** SearchItemsHandler applies filter and pagination validation while preserving empty-page normal responses. */
export declare class SearchItemsHandler implements IQueryHandler<SearchItemsQuery, SearchItemsResult> {
    private readonly itemCategoryRepository;
    private readonly itemRepository;
    constructor(itemCategoryRepository: ItemCategoryRepository, itemRepository: ItemRepository);
    execute(query: SearchItemsQuery): Promise<SearchItemsResult>;
}
