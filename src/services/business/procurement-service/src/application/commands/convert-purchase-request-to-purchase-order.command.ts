import { Allow } from 'class-validator'

/** ConvertPurchaseRequestToPurchaseOrderCommand carries the approved-PR to PO-draft conversion payload. */
export class ConvertPurchaseRequestToPurchaseOrderCommand {
  @Allow()
  public readonly payload: {
    tenantId: string
    purchaseRequestId: string
    supplierId: string
    currencyCode: string
    selectedLines: Array<{
      purchaseRequestLineId: string
      purchaseOrderQuantity: string
      orderedUnitPrice?: string
      generalStockExcessReason?: string
    }>
  }

  constructor(payload: ConvertPurchaseRequestToPurchaseOrderCommand['payload']) {
    this.payload = payload
  }
}
