import { QuoteSearchInput } from '../../domain/models/sales-records';
/** SearchQuotesQuery captures one tenant-scoped quote catalog search with frozen phase 1 filters. */
export declare class SearchQuotesQuery {
    readonly input: QuoteSearchInput;
    constructor(input: QuoteSearchInput);
}
