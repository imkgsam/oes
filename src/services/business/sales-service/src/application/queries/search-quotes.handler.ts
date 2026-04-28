import { Inject, Injectable } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { PageResult, QuoteRecord } from '../../domain/models/sales-records'
import { QuoteRepository } from '../../domain/repositories/quote.repository'
import { TOKENS } from '../../common/constants/tokens'
import { assertRequiredString, normalizePageInput } from '../support/sales-assertions'
import { SearchQuotesQuery } from './search-quotes.query'

export interface SearchQuotesResult extends PageResult<QuoteRecord> {
  quotes: QuoteRecord[]
}

/** SearchQuotesHandler returns paged quote summaries without creating any published version side effects. */
@Injectable()
@QueryHandler(SearchQuotesQuery)
export class SearchQuotesHandler implements IQueryHandler<SearchQuotesQuery, SearchQuotesResult> {
  constructor(
    @Inject(TOKENS.QUOTE_REPOSITORY)
    private readonly quoteRepository: QuoteRepository
  ) {}

  async execute(query: SearchQuotesQuery): Promise<SearchQuotesResult> {
    assertRequiredString(query.input.tenantId, 'tenantId')
    const pageState = normalizePageInput(query.input.page, query.input.pageSize)
    const result = await this.quoteRepository.search({
      ...query.input,
      ...pageState
    })

    return {
      ...result,
      quotes: result.items
    }
  }
}
