/** GetPurchaseOrderQuery carries the tenant-scoped PO lookup key. */
export declare class GetPurchaseOrderQuery {
    readonly tenantId: string;
    readonly purchaseOrderId: string;
    constructor(tenantId: string, purchaseOrderId: string);
}
