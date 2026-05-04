export interface CancelReceiptDraftPayload {
    tenantId: string;
    receiptId: string;
    cancelReason: string;
}
/** CancelReceiptDraftCommand captures one request to cancel a still-unposted WMS draft receipt. */
export declare class CancelReceiptDraftCommand {
    readonly payload: CancelReceiptDraftPayload;
    constructor(payload: CancelReceiptDraftPayload);
}
