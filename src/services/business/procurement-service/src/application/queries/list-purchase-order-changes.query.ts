import { Allow } from 'class-validator'

/** ListPurchaseOrderChangesQuery carries the paged applied-change lookup key for one PO. */
export class ListPurchaseOrderChangesQuery {
  @Allow()
  public readonly input: {
    tenantId: string
    purchaseOrderId: string
    page?: number
    pageSize?: number
  }

  constructor(input: ListPurchaseOrderChangesQuery['input']) {
    this.input = input
  }
}
