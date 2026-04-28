/** ResolveSupplierItemMappingQuery captures the supplier identifier lookup request. */
export declare class ResolveSupplierItemMappingQuery {
    readonly input: {
        tenantId: string;
        supplierId: string;
        supplierItemCode?: string;
        supplierItemName?: string;
    };
    readonly tenantId: string;
    readonly supplierId: string;
    readonly supplierItemCode?: string;
    readonly supplierItemName?: string;
    constructor(input: {
        tenantId: string;
        supplierId: string;
        supplierItemCode?: string;
        supplierItemName?: string;
    });
}
