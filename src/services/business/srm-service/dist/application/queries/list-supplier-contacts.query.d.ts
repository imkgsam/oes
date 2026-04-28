/** ListSupplierContactsQuery requests one SRM account's business-contact list. */
export declare class ListSupplierContactsQuery {
    readonly tenantId: string;
    readonly supplierId: string;
    constructor(tenantId: string, supplierId: string);
}
