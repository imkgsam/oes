import { Allow } from 'class-validator'
import { PurchaseRequestStatus, PurchaseRequestType } from '../../domain/models/procurement-records'

/** SearchPurchaseRequestsQuery carries the paged PR directory filters frozen for phase 1. */
export class SearchPurchaseRequestsQuery {
  @Allow()
  public readonly input: {
    tenantId: string
    orgId?: string
    keyword?: string
    requestType?: PurchaseRequestType
    status?: PurchaseRequestStatus
    requesterOperatorId?: string
    itemId?: string
    purchaseOrderId?: string
    neededByDateFrom?: string
    neededByDateTo?: string
    page?: number
    pageSize?: number
  }

  constructor(input: SearchPurchaseRequestsQuery['input']) {
    this.input = input
  }
}
