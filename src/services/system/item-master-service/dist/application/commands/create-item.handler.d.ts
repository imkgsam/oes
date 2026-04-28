import { ICommandHandler } from '@nestjs/cqrs';
import { Item } from '../../domain/aggregates/item.aggregate';
import { ItemRepository } from '../../domain/repositories/item.repository';
import { CreateItemCommand } from './create-item.command';
/** CreateItemHandler creates tenant-scoped items while preserving code uniqueness and immutable classification. */
export declare class CreateItemHandler implements ICommandHandler<CreateItemCommand, Item> {
    private readonly itemRepository;
    constructor(itemRepository: ItemRepository);
    execute(command: CreateItemCommand): Promise<Item>;
}
