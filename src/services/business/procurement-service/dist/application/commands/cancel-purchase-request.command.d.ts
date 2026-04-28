/** CancelPurchaseRequestCommand carries the cancellation payload for one still-cancellable PR. */
export declare class CancelPurchaseRequestCommand {
    readonly payload: {
        tenantId: string;
        purchaseRequestId: string;
        cancelReason: string;
    };
    constructor(payload: CancelPurchaseRequestCommand['payload']);
}
