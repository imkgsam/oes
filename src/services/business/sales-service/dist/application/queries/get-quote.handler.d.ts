import { IQueryHandler } from '@nestjs/cqrs';
import { QuoteRecord } from '../../domain/models/sales-records';
import { QuoteRepository } from '../../domain/repositories/quote.repository';
import { GetQuoteQuery } from './get-quote.query';
/** GetQuoteHandler returns the current mutable quote draft or NOT_FOUND for missing targets. */
export declare class GetQuoteHandler implements IQueryHandler<GetQuoteQuery, QuoteRecord> {
    private readonly quoteRepository;
    constructor(quoteRepository: QuoteRepository);
    execute(query: GetQuoteQuery): Promise<QuoteRecord>;
}
