import { Allow } from 'class-validator'

/** BatchGetItemsQuery captures one tenant-scoped bulk item lookup. */
export class BatchGetItemsQuery {
  @Allow()
  public readonly tenantId: string

  @Allow()
  public readonly itemIds: string[]

  constructor(
    tenantIdOrInput: string | { tenantId: string; itemIds: string[] },
    itemIds: string[] = []
  ) {
    if (typeof tenantIdOrInput === 'string') {
      this.tenantId = tenantIdOrInput
      this.itemIds = itemIds
      return
    }

    this.tenantId = tenantIdOrInput.tenantId
    this.itemIds = tenantIdOrInput.itemIds
  }
}
