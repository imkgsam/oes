/** UpdatePurchaseOrderDraftCommand carries the draft-replacement payload for one editable PO. */
export declare class UpdatePurchaseOrderDraftCommand {
    readonly payload: {
        tenantId: string;
        purchaseOrderId: string;
        supplierId: string;
        currencyCode: string;
        paymentTermsSnapshot?: {
            paymentTermsCode?: string;
            paymentTermsText?: string;
        };
        supplierCommercialTermsSnapshot?: {
            incotermCode?: string;
            commercialTermsText?: string;
        };
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
                sourceReferenceId?: string;
                quantity: string;
                reason?: string;
                targetWarehouseId?: string;
                targetReceivingAddressId?: string;
            }>;
        }>;
    };
    constructor(payload: UpdatePurchaseOrderDraftCommand['payload']);
}
