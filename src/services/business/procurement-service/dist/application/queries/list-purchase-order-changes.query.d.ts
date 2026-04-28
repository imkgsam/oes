/** ListPurchaseOrderChangesQuery carries the paged applied-change lookup key for one PO. */
export declare class ListPurchaseOrderChangesQuery {
    readonly input: {
        tenantId: string;
        purchaseOrderId: string;
        page?: number;
        pageSize?: number;
    };
    constructor(input: ListPurchaseOrderChangesQuery['input']);
}
