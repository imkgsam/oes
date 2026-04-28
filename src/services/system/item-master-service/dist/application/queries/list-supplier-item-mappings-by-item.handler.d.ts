import { IQueryHandler } from '@nestjs/cqrs';
import { ItemRepository } from '../../domain/repositories/item.repository';
import { ListSupplierItemMappingsByItemResult, SupplierItemMappingRepository } from '../../domain/repositories/supplier-item-mapping.repository';
import { ListSupplierItemMappingsByItemQuery } from './list-supplier-item-mappings-by-item.query';
/** ListSupplierItemMappingsByItemHandler validates item existence and returns one supplier mapping page. */
export declare class ListSupplierItemMappingsByItemHandler implements IQueryHandler<ListSupplierItemMappingsByItemQuery, ListSupplierItemMappingsByItemResult> {
    private readonly supplierItemMappingRepository;
    private readonly itemRepository;
    constructor(supplierItemMappingRepository: SupplierItemMappingRepository, itemRepository: ItemRepository);
    execute(query: ListSupplierItemMappingsByItemQuery): Promise<ListSupplierItemMappingsByItemResult>;
}
