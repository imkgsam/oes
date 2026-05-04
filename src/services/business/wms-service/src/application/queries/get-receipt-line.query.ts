import { Allow } from 'class-validator'

/** GetReceiptLineQuery captures one tenant-scoped receipt-line lookup by receipt_line_id. */
export class GetReceiptLineQuery {
  @Allow()
  public readonly tenantId: string

  @Allow()
  public readonly receiptLineId: string

  constructor(
    tenantId: string,
    receiptLineId: string
  ) {
    this.tenantId = tenantId
    this.receiptLineId = receiptLineId
  }
}
