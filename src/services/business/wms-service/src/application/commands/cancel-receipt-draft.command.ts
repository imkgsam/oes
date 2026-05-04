import { Allow } from 'class-validator'

export interface CancelReceiptDraftPayload {
  tenantId: string
  receiptId: string
  cancelReason: string
}

/** CancelReceiptDraftCommand captures one request to cancel a still-unposted WMS draft receipt. */
export class CancelReceiptDraftCommand {
  @Allow()
  public readonly payload: CancelReceiptDraftPayload

  constructor(payload: CancelReceiptDraftPayload) {
    this.payload = payload
  }
}
