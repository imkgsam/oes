import { Inject, Injectable } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { TOKENS } from '../../common/constants/tokens'
import { SALES_NOT_FOUND } from '../../common/errors/sales.errors'
import { QuoteRecord } from '../../domain/models/sales-records'
import { QuoteRepository } from '../../domain/repositories/quote.repository'
import { assertRequiredString } from '../support/sales-assertions'
import { GetQuoteQuery } from './get-quote.query'

/** GetQuoteHandler returns the current mutable quote draft or NOT_FOUND for missing targets. */
@Injectable()
@QueryHandler(GetQuoteQuery)
export class GetQuoteHandler implements IQueryHandler<GetQuoteQuery, QuoteRecord> {
  constructor(
    @Inject(TOKENS.QUOTE_REPOSITORY)
    private readonly quoteRepository: QuoteRepository
  ) {}

  async execute(query: GetQuoteQuery): Promise<QuoteRecord> {
    assertRequiredString(query.tenantId, 'tenantId')
    assertRequiredString(query.quoteId, 'quoteId')

    const quote = await this.quoteRepository.findById(query.tenantId, query.quoteId)
    if (!quote) {
      throw ExceptionFactory.domain(SALES_NOT_FOUND, {
        quoteId: query.quoteId
      })
    }

    return quote
  }
}
