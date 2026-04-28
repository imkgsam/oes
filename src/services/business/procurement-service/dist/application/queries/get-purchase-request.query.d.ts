/** GetPurchaseRequestQuery carries the tenant-scoped PR lookup key. */
export declare class GetPurchaseRequestQuery {
    readonly tenantId: string;
    readonly purchaseRequestId: string;
    constructor(tenantId: string, purchaseRequestId: string);
}
