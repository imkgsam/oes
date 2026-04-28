/** SubmitPurchaseRequestCommand carries the transition payload that freezes a PR draft for decision. */
export declare class SubmitPurchaseRequestCommand {
    readonly payload: {
        tenantId: string;
        purchaseRequestId: string;
        submissionComment?: string;
    };
    constructor(payload: SubmitPurchaseRequestCommand['payload']);
}
