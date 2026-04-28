import { Allow } from 'class-validator'

/** SubmitPurchaseRequestCommand carries the transition payload that freezes a PR draft for decision. */
export class SubmitPurchaseRequestCommand {
  @Allow()
  public readonly payload: {
    tenantId: string
    purchaseRequestId: string
    submissionComment?: string
  }

  constructor(payload: SubmitPurchaseRequestCommand['payload']) {
    this.payload = payload
  }
}
