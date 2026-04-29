import { Allow } from 'class-validator'

/** CreateReceivingExpectationCommand carries the procurement-owned expectation payload for one issued PO line. */
export class CreateReceivingExpectationCommand {
  @Allow()
  public readonly payload: {
    tenantId: string
    purchaseOrderId: string
    purchaseOrderLineId: string
    allocationGroupingKey: string
    sourceAllocationIds: string[]
    targetWarehouseId?: string
    targetReceivingAddressId?: string
    expectedQuantity: string
    expectedReceiptDate?: string
  }

  constructor(payload: CreateReceivingExpectationCommand['payload']) {
    this.payload = payload
  }
}
