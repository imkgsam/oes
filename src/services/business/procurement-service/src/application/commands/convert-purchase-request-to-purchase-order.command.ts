import { Allow } from 'class-validator'

/** ConvertPurchaseRequestToPurchaseOrderCommand carries the approved-PR to PO-draft conversion payload. */
export class ConvertPurchaseRequestToPurchaseOrderCommand {
  @Allow()
  public readonly payload: {
    tenantId: string
    targetPurchaseOrderId?: string
    supplierId?: string
    currencyCode?: string
    paymentTermsSnapshot?: {
      paymentTermsCode?: string
      paymentTermsText?: string
    }
    supplierCommercialTermsSnapshot?: {
      incotermCode?: string
      commercialTermsText?: string
    }
    sourceLines: Array<{
      purchaseRequestId: string
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
