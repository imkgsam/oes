import { QuoteVersionListInput } from '../../domain/models/sales-records';
/** ListQuoteVersionsQuery captures one published-version history page request for a single quote. */
export declare class ListQuoteVersionsQuery {
    readonly input: QuoteVersionListInput;
    constructor(input: QuoteVersionListInput);
}
