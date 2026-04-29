import { Allow } from 'class-validator'

/** CreatePurchaseOrderDraftCommand carries the initial PO draft payload before formal issue. */
export class CreatePurchaseOrderDraftCommand {
  @Allow()
  public readonly payload: {
    tenantId: string
    orgId?: string
    supplierId: string
    currencyCode: string
    paymentTermsSnapshot?: {
      paymentTermsCode?: string
      paymentTermsText?: string
    }
    supplierCommercialTermsSnapshot?: {
      incotermCode?: string
      commercialTermsText?: string
    }
    sourcePurchaseRequestIds?: string[]
    lines?: Array<{
      purchaseOrderLineId?: string
      lineType: string
      itemId?: string
      description: string
      orderedQuantity: string
      uom: string
      orderedUnitPrice?: string
      sourcePurchaseRequestLineId?: string
      generalStockExcessReason?: string
      allocations: Array<{
        allocationType: string
        sourceReferenceId?: string
        quantity: string
        reason?: string
        targetWarehouseId?: string
        targetReceivingAddressId?: string
      }>
    }>
  }

  constructor(payload: CreatePurchaseOrderDraftCommand['payload']) {
    this.payload = payload
  }
}
