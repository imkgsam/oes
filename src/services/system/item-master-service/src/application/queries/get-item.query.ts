import { Allow } from 'class-validator'

/** GetItemQuery captures one tenant-scoped item lookup by item_id. */
export class GetItemQuery {
  @Allow()
  public readonly tenantId: string

  @Allow()
  public readonly itemId: string

  constructor(tenantId: string, itemId: string) {
    this.tenantId = tenantId
    this.itemId = itemId
  }
}
