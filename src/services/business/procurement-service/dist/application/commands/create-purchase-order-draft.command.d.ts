/** CreatePurchaseOrderDraftCommand carries the initial PO draft payload before formal issue. */
export declare class CreatePurchaseOrderDraftCommand {
    readonly payload: {
        tenantId: string;
        orgId?: string;
        supplierId: string;
        currencyCode: string;
        sourcePurchaseRequestIds?: string[];
        lines?: Array<{
            purchaseOrderLineId?: string;
            lineType: string;
            itemId?: string;
            description: string;
            orderedQuantity: string;
            uom: string;
            orderedUnitPrice?: string;
            sourcePurchaseRequestLineId?: string;
            generalStockExcessReason?: string;
            allocations: Array<{
                allocationType: string;
                referenceId?: string;
                quantity: string;
                reason?: string;
            }>;
        }>;
    };
    constructor(payload: CreatePurchaseOrderDraftCommand['payload']);
}
