/** GetSupplierQuery requests one tenant-scoped SRM supplier-profile read model by id. */
export declare class GetSupplierQuery {
    readonly tenantId: string;
    readonly supplierId: string;
    constructor(tenantId: string, supplierId: string);
}
