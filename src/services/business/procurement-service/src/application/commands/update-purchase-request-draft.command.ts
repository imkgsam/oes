import { Allow } from 'class-validator'

/** UpdatePurchaseRequestDraftCommand carries the draft-replacement payload for one editable PR. */
export class UpdatePurchaseRequestDraftCommand {
  @Allow()
  public readonly payload: {
    tenantId: string
    purchaseRequestId: string
    title?: string
    reason?: string
    lines: Array<{
      lineType: string
      itemId?: string
      description: string
      requestedQuantity: string
      uom: string
      neededByDate?: string
      demandReferenceType?: string
      demandReferenceId?: string
    }>
  }

  constructor(payload: UpdatePurchaseRequestDraftCommand['payload']) {
    this.payload = payload
  }
}
