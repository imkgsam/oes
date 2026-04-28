/** ConvertQuoteVersionToOrderCommand captures the explicit order-establishment action from one published quote version. */
export declare class ConvertQuoteVersionToOrderCommand {
    readonly input: {
        tenantId: string;
        quoteVersionId: string;
    };
    constructor(input: {
        tenantId: string;
        quoteVersionId: string;
    });
    get tenantId(): string;
    get quoteVersionId(): string;
}
