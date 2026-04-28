import { ICommandHandler } from '@nestjs/cqrs';
import { Item } from '../../domain/aggregates/item.aggregate';
import { ItemRepository } from '../../domain/repositories/item.repository';
import { ChangeItemStatusCommand } from './change-item-status.command';
/** ChangeItemStatusHandler switches the minimal lifecycle summary and keeps same-status transitions as no-ops. */
export declare class ChangeItemStatusHandler implements ICommandHandler<ChangeItemStatusCommand, Item> {
    private readonly itemRepository;
    constructor(itemRepository: ItemRepository);
    execute(command: ChangeItemStatusCommand): Promise<Item>;
}
