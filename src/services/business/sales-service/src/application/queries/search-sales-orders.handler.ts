import { Inject, Injectable } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { TOKENS } from '../../common/constants/tokens'
import { PageResult, SalesOrderRecord } from '../../domain/models/sales-records'
import { SalesOrderRepository } from '../../domain/repositories/sales-order.repository'
import { assertRequiredString, normalizePageInput } from '../support/sales-assertions'
import { SearchSalesOrdersQuery } from './search-sales-orders.query'

export interface SearchSalesOrdersResult extends PageResult<SalesOrderRecord> {
  salesOrders: SalesOrderRecord[]
}

/** SearchSalesOrdersHandler returns paged established order summaries without crossing into fulfillment execution truth. */
@Injectable()
@QueryHandler(SearchSalesOrdersQuery)
export class SearchSalesOrdersHandler
  implements IQueryHandler<SearchSalesOrdersQuery, SearchSalesOrdersResult>
{
  constructor(
    @Inject(TOKENS.SALES_ORDER_REPOSITORY)
    private readonly salesOrderRepository: SalesOrderRepository
  ) {}

  async execute(query: SearchSalesOrdersQuery): Promise<SearchSalesOrdersResult> {
    assertRequiredString(query.input.tenantId, 'tenantId')
    const pageState = normalizePageInput(query.input.page, query.input.pageSize)
    const result = await this.salesOrderRepository.search({
      ...query.input,
      ...pageState
    })

    return {
      ...result,
      salesOrders: result.items
    }
  }
}
