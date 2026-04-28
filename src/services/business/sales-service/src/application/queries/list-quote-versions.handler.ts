import { Inject, Injectable } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { TOKENS } from '../../common/constants/tokens'
import { SALES_NOT_FOUND } from '../../common/errors/sales.errors'
import { PageResult, QuoteVersionRecord } from '../../domain/models/sales-records'
import { QuoteRepository } from '../../domain/repositories/quote.repository'
import { QuoteVersionRepository } from '../../domain/repositories/quote-version.repository'
import { assertRequiredString, normalizePageInput } from '../support/sales-assertions'
import { ListQuoteVersionsQuery } from './list-quote-versions.query'

export interface ListQuoteVersionsResult extends PageResult<QuoteVersionRecord> {
  quoteVersions: QuoteVersionRecord[]
}

/** ListQuoteVersionsHandler lists published history only after confirming the quote carrier exists. */
@Injectable()
@QueryHandler(ListQuoteVersionsQuery)
export class ListQuoteVersionsHandler
  implements IQueryHandler<ListQuoteVersionsQuery, ListQuoteVersionsResult>
{
  constructor(
    @Inject(TOKENS.QUOTE_REPOSITORY)
    private readonly quoteRepository: QuoteRepository,
    @Inject(TOKENS.QUOTE_VERSION_REPOSITORY)
    private readonly quoteVersionRepository: QuoteVersionRepository
  ) {}

  async execute(query: ListQuoteVersionsQuery): Promise<ListQuoteVersionsResult> {
    assertRequiredString(query.input.tenantId, 'tenantId')
    assertRequiredString(query.input.quoteId, 'quoteId')

    const quote = await this.quoteRepository.findById(query.input.tenantId, query.input.quoteId)
    if (!quote) {
      throw ExceptionFactory.domain(SALES_NOT_FOUND, {
        quoteId: query.input.quoteId
      })
    }

    const pageState = normalizePageInput(query.input.page, query.input.pageSize)
    const result = await this.quoteVersionRepository.listByQuoteId({
      ...query.input,
      ...pageState
    })

    return {
      ...result,
      quoteVersions: result.items
    }
  }
}
