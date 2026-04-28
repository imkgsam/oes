/** IssuePurchaseOrderCommand carries the phase 1 transition payload that makes a PO a formal commitment. */
export declare class IssuePurchaseOrderCommand {
    readonly payload: {
        tenantId: string;
        purchaseOrderId: string;
        issueComment?: string;
    };
    constructor(payload: IssuePurchaseOrderCommand['payload']);
}
