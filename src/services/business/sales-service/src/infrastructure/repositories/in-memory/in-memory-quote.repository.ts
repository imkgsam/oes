import { Injectable } from '@nestjs/common'
import { PageResult, QuoteRecord, QuoteSearchInput, SalesQuoteStatus, cloneRecord } from '../../../domain/models/sales-records'
import { QuoteRepository } from '../../../domain/repositories/quote.repository'
import { paginate } from '../../../application/support/sales-assertions'
import { SalesInMemoryStore } from '../../store/sales-in-memory-store'

/** InMemoryQuoteRepository stores current quote draft carriers inside the process-local phase 1 skeleton store. */
@Injectable()
export class InMemoryQuoteRepository implements QuoteRepository {
  constructor(private readonly store: SalesInMemoryStore) {}

  async nextQuoteNo(_tenantId: string): Promise<string> {
    return this.store.nextQuoteNo()
  }

  async findById(tenantId: string, quoteId: string): Promise<QuoteRecord | null> {
    const quote = this.store.quotes.get(quoteId)
    if (!quote || quote.tenantId !== tenantId) {
      return null
    }

    return cloneRecord(quote)
  }

  async save(quote: QuoteRecord): Promise<QuoteRecord> {
    const stored = cloneRecord(quote)
    this.store.quotes.set(stored.id, stored)
    return cloneRecord(stored)
  }

  async search(input: QuoteSearchInput): Promise<PageResult<QuoteRecord>> {
    const filtered = [...this.store.quotes.values()]
      .filter((quote) => quote.tenantId === input.tenantId)
      .filter((quote) => !input.customerTenantPartyId || quote.customerTenantPartyId === input.customerTenantPartyId)
      .filter((quote) => !input.status || input.status === SalesQuoteStatus.DRAFT || input.status === SalesQuoteStatus.PUBLISHED
        ? quote.status === input.status || !input.status
        : true)
      .filter((quote) => {
        if (!input.keyword) {
          return true
        }

        const keyword = input.keyword.toLowerCase()
        return quote.quoteNo.toLowerCase().includes(keyword) || quote.customerTenantPartyId.toLowerCase().includes(keyword)
      })
      .sort((left, right) => left.quoteNo.localeCompare(right.quoteNo))
      .map((quote) => cloneRecord(quote))

    const { pageItems, total } = paginate(filtered, input.page ?? 1, input.pageSize ?? 20)
    return {
      items: pageItems,
      total,
      page: input.page ?? 1,
      pageSize: input.pageSize ?? 20
    }
  }
}
