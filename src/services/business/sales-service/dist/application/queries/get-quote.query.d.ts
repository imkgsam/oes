/** GetQuoteQuery captures one tenant-scoped lookup of the current quote draft carrier. */
export declare class GetQuoteQuery {
    readonly tenantId: string;
    readonly quoteId: string;
    constructor(tenantId: string, quoteId: string);
}
