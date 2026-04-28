/** UpsertSupplierItemMappingCommand captures the phase 1 supplier identifier mapping replacement intent. */
export declare class UpsertSupplierItemMappingCommand {
    readonly input: {
        tenantId: string;
        supplierId: string;
        supplierItemCode?: string;
        supplierItemName?: string;
        itemId: string;
    };
    constructor(input: {
        tenantId: string;
        supplierId: string;
        supplierItemCode?: string;
        supplierItemName?: string;
        itemId: string;
    });
    get tenantId(): string;
    get supplierId(): string;
    get supplierItemCode(): string | undefined;
    get supplierItemName(): string | undefined;
    get itemId(): string;
}
