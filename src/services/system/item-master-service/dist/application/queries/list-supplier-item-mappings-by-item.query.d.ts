/** ListSupplierItemMappingsByItemQuery captures one item-scoped supplier mapping page request. */
export declare class ListSupplierItemMappingsByItemQuery {
    readonly input: {
        tenantId: string;
        itemId: string;
        page?: number;
        pageSize?: number;
    };
    readonly tenantId: string;
    readonly itemId: string;
    readonly page?: number;
    readonly pageSize?: number;
    constructor(input: {
        tenantId: string;
        itemId: string;
        page?: number;
        pageSize?: number;
    });
}
