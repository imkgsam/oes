import { Inject, Injectable } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { TOKENS } from '../../common/constants/tokens'
import { SALES_NOT_FOUND } from '../../common/errors/sales.errors'
import { PageResult } from '../../domain/models/sales-records'
import { PriceListRecord } from '../../domain/models/pricing-records'
import { PriceListRepository } from '../../domain/repositories/price-list.repository'
import { GetPriceListLinesQuery } from './get-price-list-lines.query'

export type GetPriceListLinesResult = PageResult<PriceListRecord['lines'][number]>

/** GetPriceListLinesHandler serves paged line-level reads for one price list, returning empty pages but not phantom lists. */
@Injectable()
@QueryHandler(GetPriceListLinesQuery)
export class GetPriceListLinesHandler implements IQueryHandler<GetPriceListLinesQuery, GetPriceListLinesResult> {
  constructor(
    @Inject(TOKENS.PRICE_LIST_REPOSITORY)
    private readonly repository: PriceListRepository
  ) {}

  async execute(query: GetPriceListLinesQuery): Promise<GetPriceListLinesResult> {
    const head = await this.repository.findById(query.input.tenantId, query.input.priceListId)
    if (!head) {
      throw ExceptionFactory.domain(SALES_NOT_FOUND, {
        priceListId: query.input.priceListId
      })
    }

    return this.repository.listLines(query.input)
  }
}
