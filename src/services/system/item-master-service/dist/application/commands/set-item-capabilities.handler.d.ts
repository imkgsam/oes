import { ICommandHandler } from '@nestjs/cqrs';
import { Item } from '../../domain/aggregates/item.aggregate';
import { ItemRepository } from '../../domain/repositories/item.repository';
import { SetItemCapabilitiesCommand } from './set-item-capabilities.command';
/** SetItemCapabilitiesHandler replaces the entire capability set under the frozen PHYSICAL-only invariants. */
export declare class SetItemCapabilitiesHandler implements ICommandHandler<SetItemCapabilitiesCommand, Item> {
    private readonly itemRepository;
    constructor(itemRepository: ItemRepository);
    execute(command: SetItemCapabilitiesCommand): Promise<Item>;
}
