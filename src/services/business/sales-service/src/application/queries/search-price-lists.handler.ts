import { Inject, Injectable } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { TOKENS } from '../../common/constants/tokens'
import { PageResult } from '../../domain/models/sales-records'
import { PriceListRecord } from '../../domain/models/pricing-records'
import { PriceListRepository } from '../../domain/repositories/price-list.repository'
import { SearchPriceListsQuery } from './search-price-lists.query'

export type SearchPriceListsResult = PageResult<PriceListRecord>

/** SearchPriceListsHandler serves the paged phase 1 price list catalog query. */
@Injectable()
@QueryHandler(SearchPriceListsQuery)
export class SearchPriceListsHandler implements IQueryHandler<SearchPriceListsQuery, SearchPriceListsResult> {
  constructor(
    @Inject(TOKENS.PRICE_LIST_REPOSITORY)
    private readonly repository: PriceListRepository
  ) {}

  async execute(query: SearchPriceListsQuery): Promise<SearchPriceListsResult> {
    return this.repository.search(query.input)
  }
}
