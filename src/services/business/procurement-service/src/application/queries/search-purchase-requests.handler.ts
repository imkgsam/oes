import { Inject, Injectable } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { TOKENS } from '../../common/constants/tokens'
import { PurchaseRequestRepository } from '../../domain/repositories/purchase-request.repository'
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
    private readonly purchaseRequestRepository: PurchaseRequestRepository
  ) {}

  async execute(query: SearchPurchaseRequestsQuery) {
    const page = await this.purchaseRequestRepository.search(query.input)
    return {
      purchaseRequests: page.items,
      total: page.total,
      page: page.page,
      pageSize: page.pageSize
    }
  }
}
