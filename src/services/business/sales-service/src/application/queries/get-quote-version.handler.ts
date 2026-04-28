import { Inject, Injectable } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { TOKENS } from '../../common/constants/tokens'
import { SALES_NOT_FOUND } from '../../common/errors/sales.errors'
import { QuoteVersionRecord } from '../../domain/models/sales-records'
import { QuoteVersionRepository } from '../../domain/repositories/quote-version.repository'
import { assertRequiredString } from '../support/sales-assertions'
import { GetQuoteVersionQuery } from './get-quote-version.query'

/** GetQuoteVersionHandler returns one immutable published version or NOT_FOUND when the target is absent. */
@Injectable()
@QueryHandler(GetQuoteVersionQuery)
export class GetQuoteVersionHandler implements IQueryHandler<GetQuoteVersionQuery, QuoteVersionRecord> {
  constructor(
    @Inject(TOKENS.QUOTE_VERSION_REPOSITORY)
    private readonly quoteVersionRepository: QuoteVersionRepository
  ) {}

  async execute(query: GetQuoteVersionQuery): Promise<QuoteVersionRecord> {
    assertRequiredString(query.tenantId, 'tenantId')
    assertRequiredString(query.quoteVersionId, 'quoteVersionId')

    const quoteVersion = await this.quoteVersionRepository.findById(query.tenantId, query.quoteVersionId)
    if (!quoteVersion) {
      throw ExceptionFactory.domain(SALES_NOT_FOUND, {
        quoteVersionId: query.quoteVersionId
      })
    }

    return quoteVersion
  }
}
