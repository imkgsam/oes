import { Allow } from 'class-validator'

/** GetReceiptQuery captures one tenant-scoped receipt lookup by receipt_id. */
export class GetReceiptQuery {
  @Allow()
  public readonly tenantId: string

  @Allow()
  public readonly receiptId: string

  constructor(
    tenantId: string,
    receiptId: string
  ) {
    this.tenantId = tenantId
    this.receiptId = receiptId
  }
}
