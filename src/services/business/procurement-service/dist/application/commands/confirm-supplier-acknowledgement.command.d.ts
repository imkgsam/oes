/** ConfirmSupplierAcknowledgementCommand carries the supplier confirmation summary for one issued PO. */
export declare class ConfirmSupplierAcknowledgementCommand {
    readonly payload: {
        tenantId: string;
        purchaseOrderId: string;
        externalReference?: string;
        comment?: string;
        acknowledgedAt?: string;
    };
    constructor(payload: ConfirmSupplierAcknowledgementCommand['payload']);
}
