/** GetReceiptLineQuery captures one tenant-scoped receipt-line lookup by receipt_line_id. */
export declare class GetReceiptLineQuery {
    readonly tenantId: string;
    readonly receiptLineId: string;
    constructor(tenantId: string, receiptLineId: string);
}
