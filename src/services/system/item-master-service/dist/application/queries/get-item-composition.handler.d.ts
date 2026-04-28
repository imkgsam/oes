import { IQueryHandler } from '@nestjs/cqrs';
import { Item } from '../../domain/aggregates/item.aggregate';
import { ItemCompositionRepository } from '../../domain/repositories/item-composition.repository';
import { ItemRepository } from '../../domain/repositories/item.repository';
import { GetItemCompositionQuery } from './get-item-composition.query';
export interface GetItemCompositionResult {
    itemId: string;
    components: Item[];
}
/** GetItemCompositionHandler reads bundle composition and preserves the empty-components success shape. */
export declare class GetItemCompositionHandler implements IQueryHandler<GetItemCompositionQuery, GetItemCompositionResult> {
    private readonly itemRepository;
    private readonly compositionRepository;
    constructor(itemRepository: ItemRepository, compositionRepository: ItemCompositionRepository);
    execute(query: GetItemCompositionQuery): Promise<GetItemCompositionResult>;
}
