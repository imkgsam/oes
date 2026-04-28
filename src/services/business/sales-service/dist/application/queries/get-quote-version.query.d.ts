/** GetQuoteVersionQuery captures one lookup of a published quote version baseline by id. */
export declare class GetQuoteVersionQuery {
    readonly tenantId: string;
    readonly quoteVersionId: string;
    constructor(tenantId: string, quoteVersionId: string);
}
