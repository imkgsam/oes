import { Allow } from 'class-validator'
import { PurchaseOrderStatus } from '../../domain/models/procurement-records'

/** SearchPurchaseOrdersQuery carries the paged PO directory filters frozen for phase 1. */
export class SearchPurchaseOrdersQuery {
  @Allow()
  public readonly input: {
    tenantId: string
    orgId?: string
    keyword?: string
    status?: PurchaseOrderStatus
    supplierId?: string
    itemId?: string
    requestNo?: string
    issuedFrom?: string
    issuedTo?: string
    page?: number
    pageSize?: number
  }

  constructor(input: SearchPurchaseOrdersQuery['input']) {
    this.input = input
  }
}
