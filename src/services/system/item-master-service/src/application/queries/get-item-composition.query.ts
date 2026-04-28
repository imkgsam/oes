import { Allow } from 'class-validator'

/** GetItemCompositionQuery captures one bundle composition read by parent item_id. */
export class GetItemCompositionQuery {
  @Allow()
  public readonly tenantId: string

  @Allow()
  public readonly itemId: string

  constructor(tenantId: string, itemId: string) {
    this.tenantId = tenantId
    this.itemId = itemId
  }
}
