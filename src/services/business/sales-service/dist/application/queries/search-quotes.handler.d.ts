import { IQueryHandler } from '@nestjs/cqrs';
import { PageResult, QuoteRecord } from '../../domain/models/sales-records';
import { QuoteRepository } from '../../domain/repositories/quote.repository';
import { SearchQuotesQuery } from './search-quotes.query';
export interface SearchQuotesResult extends PageResult<QuoteRecord> {
    quotes: QuoteRecord[];
}
/** SearchQuotesHandler returns paged quote summaries without creating any published version side effects. */
export declare class SearchQuotesHandler implements IQueryHandler<SearchQuotesQuery, SearchQuotesResult> {
    private readonly quoteRepository;
    constructor(quoteRepository: QuoteRepository);
    execute(query: SearchQuotesQuery): Promise<SearchQuotesResult>;
}
