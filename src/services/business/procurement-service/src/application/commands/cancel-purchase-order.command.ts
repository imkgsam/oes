import { Allow } from 'class-validator'

/** CancelPurchaseOrderCommand carries the cancellation payload for one still-cancellable PO. */
export class CancelPurchaseOrderCommand {
  @Allow()
  public readonly payload: {
    tenantId: string
    purchaseOrderId: string
    cancelReason: string
  }

  constructor(payload: CancelPurchaseOrderCommand['payload']) {
    this.payload = payload
  }
}
