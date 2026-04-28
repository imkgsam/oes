import { Allow } from 'class-validator'

/** IssuePurchaseOrderCommand carries the phase 1 transition payload that makes a PO a formal commitment. */
export class IssuePurchaseOrderCommand {
  @Allow()
  public readonly payload: {
    tenantId: string
    purchaseOrderId: string
    issueComment?: string
  }

  constructor(payload: IssuePurchaseOrderCommand['payload']) {
    this.payload = payload
  }
}
