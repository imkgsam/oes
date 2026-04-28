import { IQueryHandler } from '@nestjs/cqrs';
import { QuoteVersionRecord } from '../../domain/models/sales-records';
import { QuoteVersionRepository } from '../../domain/repositories/quote-version.repository';
import { GetQuoteVersionQuery } from './get-quote-version.query';
/** GetQuoteVersionHandler returns one immutable published version or NOT_FOUND when the target is absent. */
export declare class GetQuoteVersionHandler implements IQueryHandler<GetQuoteVersionQuery, QuoteVersionRecord> {
    private readonly quoteVersionRepository;
    constructor(quoteVersionRepository: QuoteVersionRepository);
    execute(query: GetQuoteVersionQuery): Promise<QuoteVersionRecord>;
}
