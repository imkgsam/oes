/** PublishQuoteCommand captures one explicit request to freeze the current quote draft into a QuoteVersion. */
export declare class PublishQuoteCommand {
    readonly input: {
        tenantId: string;
        quoteId: string;
    };
    constructor(input: {
        tenantId: string;
        quoteId: string;
    });
    get tenantId(): string;
    get quoteId(): string;
}
