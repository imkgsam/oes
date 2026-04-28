import { PageResult, QuoteVersionListInput, QuoteVersionRecord } from '../models/sales-records';
/** QuoteVersionRepository persists immutable published quote baselines and history listing queries. */
export interface QuoteVersionRepository {
    nextVersionNo(tenantId: string, quoteId: string): Promise<number>;
    findById(tenantId: string, quoteVersionId: string): Promise<QuoteVersionRecord | null>;
    save(quoteVersion: QuoteVersionRecord): Promise<QuoteVersionRecord>;
    listByQuoteId(input: QuoteVersionListInput): Promise<PageResult<QuoteVersionRecord>>;
}
