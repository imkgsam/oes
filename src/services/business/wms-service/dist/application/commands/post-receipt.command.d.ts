export interface PostReceiptPayload {
    tenantId: string;
    receiptId: string;
    postComment?: string;
}
/** PostReceiptCommand captures one request to convert a draft receipt into immutable inventory truth. */
export declare class PostReceiptCommand {
    readonly payload: PostReceiptPayload;
    constructor(payload: PostReceiptPayload);
}
