import { PageResult, QuoteVersionListInput, QuoteVersionRecord } from '../../../domain/models/sales-records';
import { QuoteVersionRepository } from '../../../domain/repositories/quote-version.repository';
import { SalesInMemoryStore } from '../../store/sales-in-memory-store';
/** InMemoryQuoteVersionRepository stores immutable quote versions in the process-local phase 1 skeleton store. */
export declare class InMemoryQuoteVersionRepository implements QuoteVersionRepository {
    private readonly store;
    constructor(store: SalesInMemoryStore);
    nextVersionNo(tenantId: string, quoteId: string): Promise<number>;
    findById(tenantId: string, quoteVersionId: string): Promise<QuoteVersionRecord | null>;
    save(quoteVersion: QuoteVersionRecord): Promise<QuoteVersionRecord>;
    listByQuoteId(input: QuoteVersionListInput): Promise<PageResult<QuoteVersionRecord>>;
}
