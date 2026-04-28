import { IQueryHandler } from '@nestjs/cqrs';
import { ItemRepository } from '../../domain/repositories/item.repository';
import { SupplierItemMappingRepository } from '../../domain/repositories/supplier-item-mapping.repository';
import { ResolveSupplierItemMappingQuery } from './resolve-supplier-item-mapping.query';
import { ResolveSupplierItemMappingResult } from './supplier-item-resolution.view';
/** ResolveSupplierItemMappingHandler returns MATCHED or NO_MATCH without using exceptions for absent mappings. */
export declare class ResolveSupplierItemMappingHandler implements IQueryHandler<ResolveSupplierItemMappingQuery, ResolveSupplierItemMappingResult> {
    private readonly supplierItemMappingRepository;
    private readonly itemRepository;
    constructor(supplierItemMappingRepository: SupplierItemMappingRepository, itemRepository: ItemRepository);
    execute(query: ResolveSupplierItemMappingQuery): Promise<ResolveSupplierItemMappingResult>;
}
