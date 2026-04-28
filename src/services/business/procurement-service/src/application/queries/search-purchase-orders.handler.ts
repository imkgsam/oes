import { Inject, Injectable } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { TOKENS } from '../../common/constants/tokens'
import { PurchaseOrderRepository } from '../../domain/repositories/purchase-order.repository'
import { SearchPurchaseOrdersQuery } from './search-purchase-orders.query'

/** SearchPurchaseOrdersHandler returns the current PO directory page without mutating procurement commitment state. */
@Injectable()
@QueryHandler(SearchPurchaseOrdersQuery)
export class SearchPurchaseOrdersHandler
  implements
    IQueryHandler<
      SearchPurchaseOrdersQuery,
      { purchaseOrders: Awaited<ReturnType<PurchaseOrderRepository['search']>>['items']; total: number; page: number; pageSize: number }
    >
{
  constructor(
    @Inject(TOKENS.PURCHASE_ORDER_REPOSITORY)
    private readonly purchaseOrderRepository: PurchaseOrderRepository
  ) {}

  async execute(query: SearchPurchaseOrdersQuery) {
    const page = await this.purchaseOrderRepository.search(query.input)
    return {
      purchaseOrders: page.items,
      total: page.total,
      page: page.page,
      pageSize: page.pageSize
    }
  }
}
