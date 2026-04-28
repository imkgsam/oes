import { IQueryHandler } from '@nestjs/cqrs';
import { Item } from '../../domain/aggregates/item.aggregate';
import { ItemRepository } from '../../domain/repositories/item.repository';
import { GetItemQuery } from './get-item.query';
/** GetItemHandler resolves one item summary or raises NOT_FOUND for missing targets. */
export declare class GetItemHandler implements IQueryHandler<GetItemQuery, Item> {
    private readonly itemRepository;
    constructor(itemRepository: ItemRepository);
    execute(query: GetItemQuery): Promise<Item>;
}
