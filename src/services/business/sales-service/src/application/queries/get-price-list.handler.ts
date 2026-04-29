import { Inject, Injectable } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { TOKENS } from '../../common/constants/tokens'
import { SALES_NOT_FOUND } from '../../common/errors/sales.errors'
import { PriceListRecord } from '../../domain/models/pricing-records'
import { PriceListRepository } from '../../domain/repositories/price-list.repository'
import { GetPriceListQuery } from './get-price-list.query'

/** GetPriceListHandler serves one point read for a single price list head and its current line baselines. */
@Injectable()
@QueryHandler(GetPriceListQuery)
export class GetPriceListHandler implements IQueryHandler<GetPriceListQuery, PriceListRecord> {
  constructor(
    @Inject(TOKENS.PRICE_LIST_REPOSITORY)
    private readonly repository: PriceListRepository
  ) {}

  async execute(query: GetPriceListQuery): Promise<PriceListRecord> {
    const record = await this.repository.findById(query.tenantId, query.priceListId)
    if (!record) {
      throw ExceptionFactory.domain(SALES_NOT_FOUND, {
        priceListId: query.priceListId
      })
    }

    return record
  }
}
