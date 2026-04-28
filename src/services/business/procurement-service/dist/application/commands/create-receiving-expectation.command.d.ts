/** CreateReceivingExpectationCommand carries the procurement-owned expectation payload for one issued PO line. */
export declare class CreateReceivingExpectationCommand {
    readonly payload: {
        tenantId: string;
        purchaseOrderId: string;
        purchaseOrderLineId: string;
        expectedQuantity: string;
        expectedReceiptDate?: string;
    };
    constructor(payload: CreateReceivingExpectationCommand['payload']);
}
