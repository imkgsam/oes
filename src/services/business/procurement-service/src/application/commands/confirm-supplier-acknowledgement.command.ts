import { Allow } from 'class-validator'

/** ConfirmSupplierAcknowledgementCommand carries the supplier confirmation summary for one issued PO. */
export class ConfirmSupplierAcknowledgementCommand {
  @Allow()
  public readonly payload: {
    tenantId: string
    purchaseOrderId: string
    externalReference?: string
    comment?: string
    acknowledgedAt?: string
  }

  constructor(payload: ConfirmSupplierAcknowledgementCommand['payload']) {
    this.payload = payload
  }
}
