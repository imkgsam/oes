import { IQueryHandler } from '@nestjs/cqrs';
import { PageResult, QuoteVersionRecord } from '../../domain/models/sales-records';
import { QuoteRepository } from '../../domain/repositories/quote.repository';
import { QuoteVersionRepository } from '../../domain/repositories/quote-version.repository';
import { ListQuoteVersionsQuery } from './list-quote-versions.query';
export interface ListQuoteVersionsResult extends PageResult<QuoteVersionRecord> {
    quoteVersions: QuoteVersionRecord[];
}
/** ListQuoteVersionsHandler lists published history only after confirming the quote carrier exists. */
export declare class ListQuoteVersionsHandler implements IQueryHandler<ListQuoteVersionsQuery, ListQuoteVersionsResult> {
    private readonly quoteRepository;
    private readonly quoteVersionRepository;
    constructor(quoteRepository: QuoteRepository, quoteVersionRepository: QuoteVersionRepository);
    execute(query: ListQuoteVersionsQuery): Promise<ListQuoteVersionsResult>;
}
