/** ListSupplierAddressesQuery requests one SRM account's business-address list. */
export declare class ListSupplierAddressesQuery {
    readonly tenantId: string;
    readonly supplierId: string;
    constructor(tenantId: string, supplierId: string);
}
