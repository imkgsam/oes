import { ICommandHandler } from '@nestjs/cqrs';
import { SupplierItemMapping, SupplierItemMappingRepository } from '../../domain/repositories/supplier-item-mapping.repository';
import { ItemRepository } from '../../domain/repositories/item.repository';
import { UpsertSupplierItemMappingCommand } from './upsert-supplier-item-mapping.command';
/** UpsertSupplierItemMappingHandler keeps supplier code or name aliases mapped to one item without procurement fields. */
export declare class UpsertSupplierItemMappingHandler implements ICommandHandler<UpsertSupplierItemMappingCommand, SupplierItemMapping> {
    private readonly supplierItemMappingRepository;
    private readonly itemRepository;
    constructor(supplierItemMappingRepository: SupplierItemMappingRepository, itemRepository: ItemRepository);
    execute(command: UpsertSupplierItemMappingCommand): Promise<SupplierItemMapping>;
}
