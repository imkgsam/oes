import { Allow } from 'class-validator'

/** CancelPurchaseRequestCommand carries the cancellation payload for one still-cancellable PR. */
export class CancelPurchaseRequestCommand {
  @Allow()
  public readonly payload: {
    tenantId: string
    purchaseRequestId: string
    cancelReason: string
  }

  constructor(payload: CancelPurchaseRequestCommand['payload']) {
    this.payload = payload
  }
}
