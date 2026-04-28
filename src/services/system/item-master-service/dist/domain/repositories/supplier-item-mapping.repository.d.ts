export interface SupplierItemMapping {
    id: string;
    tenantId: string;
    supplierId: string;
    supplierItemCode?: string;
    supplierItemName?: string;
    itemId: string;
}
export interface UpsertSupplierItemMappingInput {
    tenantId: string;
    supplierId: string;
    supplierItemCode?: string;
    supplierItemName?: string;
    itemId: string;
}
export interface ResolveSupplierItemMappingInput {
    tenantId: string;
    supplierId: string;
    supplierItemCode?: string;
    supplierItemName?: string;
}
export interface ListSupplierItemMappingsByItemInput {
    tenantId: string;
    itemId: string;
    page: number;
    pageSize: number;
}
export interface ListSupplierItemMappingsByItemResult {
    mappings: SupplierItemMapping[];
    total: number;
    page: number;
    pageSize: number;
}
/** SupplierItemMappingRepository owns supplier identifier to item identity resolution without procurement semantics. */
export interface SupplierItemMappingRepository {
    upsert(input: UpsertSupplierItemMappingInput): Promise<SupplierItemMapping>;
    listByItem(input: ListSupplierItemMappingsByItemInput): Promise<ListSupplierItemMappingsByItemResult>;
    resolve(input: ResolveSupplierItemMappingInput): Promise<SupplierItemMapping | null>;
}
