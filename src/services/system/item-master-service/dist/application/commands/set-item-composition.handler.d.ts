import { ICommandHandler } from '@nestjs/cqrs';
import { Item } from '../../domain/aggregates/item.aggregate';
import { ItemCompositionRepository } from '../../domain/repositories/item-composition.repository';
import { ItemRepository } from '../../domain/repositories/item.repository';
import { SetItemCompositionCommand } from './set-item-composition.command';
export interface SetItemCompositionResult {
    itemId: string;
    components: Item[];
}
/** SetItemCompositionHandler replaces bundle composition while rejecting non-bundle, self, and nested bundle inputs. */
export declare class SetItemCompositionHandler implements ICommandHandler<SetItemCompositionCommand, SetItemCompositionResult> {
    private readonly itemRepository;
    private readonly compositionRepository;
    constructor(itemRepository: ItemRepository, compositionRepository: ItemCompositionRepository);
    execute(command: SetItemCompositionCommand): Promise<SetItemCompositionResult>;
}
