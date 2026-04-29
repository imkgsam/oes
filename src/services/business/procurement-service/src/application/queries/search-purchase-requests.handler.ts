import { Inject, Injectable } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { TOKENS } from '../../common/constants/tokens'
import { PurchaseOrderRepository } from '../../domain/repositories/purchase-order.repository'
import { PurchaseRequestRepository } from '../../domain/repositories/purchase-request.repository'
import { ReceivingRepository } from '../../domain/repositories/receiving.repository'
import { paginateEnrichedPurchaseRequests, enrichPurchaseRequestForQuery } from '../support/procurement-query-enrichment'
import { SearchPurchaseRequestsQuery } from './search-purchase-requests.query'

/** SearchPurchaseRequestsHandler returns the current PR directory page without mutating procurement demand state. */
@Injectable()
@QueryHandler(SearchPurchaseRequestsQuery)
export class SearchPurchaseRequestsHandler
  implements
    IQueryHandler<
      SearchPurchaseRequestsQuery,
      { purchaseRequests: Awaited<ReturnType<PurchaseRequestRepository['search']>>['items']; total: number; page: number; pageSize: number }
    >
{
  constructor(
    @Inject(TOKENS.PURCHASE_REQUEST_REPOSITORY)
    private readonly purchaseRequestRepository: PurchaseRequestRepository,
    @Inject(TOKENS.PURCHASE_ORDER_REPOSITORY)
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
    @Inject(TOKENS.RECEIVING_REPOSITORY)
    private readonly receivingRepository: ReceivingRepository
  ) {}

  async execute(query: SearchPurchaseRequestsQuery) {
    const page = await this.purchaseRequestRepository.search({
      ...query.input,
      status:
        query.input.status === undefined ||
        query.input.status === 'PARTIALLY_CONVERTED' ||
        query.input.status === 'CONVERTED'
          ? undefined
          : query.input.status,
      purchaseOrderId: undefined
    })
    const enrichedItems = await Promise.all(
      page.items.map((record) =>
        enrichPurchaseRequestForQuery(record, this.purchaseOrderRepository, this.receivingRepository)
      )
    )
    const enrichedPage = paginateEnrichedPurchaseRequests({
      items: enrichedItems,
      page: query.input.page,
      pageSize: query.input.pageSize,
      status: query.input.status,
      purchaseOrderId: query.input.purchaseOrderId
    })
    return {
      purchaseRequests: enrichedPage.items,
      total: enrichedPage.total,
      page: enrichedPage.page,
      pageSize: enrichedPage.pageSize
    }
  }
}
