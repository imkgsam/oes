import { ListSupplierItemMappingsByItemInput, ListSupplierItemMappingsByItemResult, ResolveSupplierItemMappingInput, SupplierItemMapping, SupplierItemMappingRepository, UpsertSupplierItemMappingInput } from '../../../domain/repositories/supplier-item-mapping.repository';
import { PrismaService } from '../../prisma/prisma.service';
/** PrismaSupplierItemMappingRepository persists supplier-to-item alias mappings without procurement fields. */
export declare class PrismaSupplierItemMappingRepository implements SupplierItemMappingRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    upsert(input: UpsertSupplierItemMappingInput): Promise<SupplierItemMapping>;
    listByItem(input: ListSupplierItemMappingsByItemInput): Promise<ListSupplierItemMappingsByItemResult>;
    resolve(input: ResolveSupplierItemMappingInput): Promise<SupplierItemMapping | null>;
}
