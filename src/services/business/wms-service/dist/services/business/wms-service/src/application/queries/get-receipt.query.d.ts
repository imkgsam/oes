/** GetReceiptQuery captures one tenant-scoped receipt lookup by receipt_id. */
export declare class GetReceiptQuery {
    readonly tenantId: string;
    readonly receiptId: string;
    constructor(tenantId: string, receiptId: string);
}
