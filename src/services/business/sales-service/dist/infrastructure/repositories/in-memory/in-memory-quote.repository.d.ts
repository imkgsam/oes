import { PageResult, QuoteRecord, QuoteSearchInput } from '../../../domain/models/sales-records';
import { QuoteRepository } from '../../../domain/repositories/quote.repository';
import { SalesInMemoryStore } from '../../store/sales-in-memory-store';
/** InMemoryQuoteRepository stores current quote draft carriers inside the process-local phase 1 skeleton store. */
export declare class InMemoryQuoteRepository implements QuoteRepository {
    private readonly store;
    constructor(store: SalesInMemoryStore);
    nextQuoteNo(_tenantId: string): Promise<string>;
    findById(tenantId: string, quoteId: string): Promise<QuoteRecord | null>;
    save(quote: QuoteRecord): Promise<QuoteRecord>;
    search(input: QuoteSearchInput): Promise<PageResult<QuoteRecord>>;
}
