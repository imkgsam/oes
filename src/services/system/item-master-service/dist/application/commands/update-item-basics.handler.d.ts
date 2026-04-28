import { ICommandHandler } from '@nestjs/cqrs';
import { Item } from '../../domain/aggregates/item.aggregate';
import { ItemRepository } from '../../domain/repositories/item.repository';
import { UpdateItemBasicsCommand } from './update-item-basics.command';
/** UpdateItemBasicsHandler updates only code and name while rejecting classification mutations. */
export declare class UpdateItemBasicsHandler implements ICommandHandler<UpdateItemBasicsCommand, Item> {
    private readonly itemRepository;
    constructor(itemRepository: ItemRepository);
    execute(command: UpdateItemBasicsCommand): Promise<Item>;
}
