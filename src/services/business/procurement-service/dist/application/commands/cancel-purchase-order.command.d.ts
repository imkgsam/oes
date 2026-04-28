/** CancelPurchaseOrderCommand carries the cancellation payload for one still-cancellable PO. */
export declare class CancelPurchaseOrderCommand {
    readonly payload: {
        tenantId: string;
        purchaseOrderId: string;
        cancelReason: string;
    };
    constructor(payload: CancelPurchaseOrderCommand['payload']);
}
