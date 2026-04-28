/** UpdatePurchaseOrderDraftCommand carries the draft-replacement payload for one editable PO. */
export declare class UpdatePurchaseOrderDraftCommand {
    readonly payload: {
        tenantId: string;
        purchaseOrderId: string;
        supplierId: string;
        currencyCode: string;
        sourcePurchaseRequestIds?: string[];
        lines: Array<{
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
    constructor(payload: UpdatePurchaseOrderDraftCommand['payload']);
}
