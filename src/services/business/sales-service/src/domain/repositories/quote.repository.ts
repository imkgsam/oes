import { PageResult, QuoteRecord, QuoteSearchInput } from '../models/sales-records'

/** QuoteRepository persists tenant-scoped draft quotes and supports current-draft search reads. */
export interface QuoteRepository {
  nextQuoteNo(tenantId: string): Promise<string>
  findById(tenantId: string, quoteId: string): Promise<QuoteRecord | null>
  save(quote: QuoteRecord): Promise<QuoteRecord>
  search(input: QuoteSearchInput): Promise<PageResult<QuoteRecord>>
}
