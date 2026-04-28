import { Allow } from 'class-validator'

/** ListSupplierItemMappingsByItemQuery captures one item-scoped supplier mapping page request. */
export class ListSupplierItemMappingsByItemQuery {
  @Allow()
  public readonly input: {
    tenantId: string
    itemId: string
    page?: number
    pageSize?: number
  }

  @Allow()
  public readonly tenantId: string

  @Allow()
  public readonly itemId: string

  @Allow()
  public readonly page?: number

  @Allow()
  public readonly pageSize?: number

  constructor(input: {
    tenantId: string
    itemId: string
    page?: number
    pageSize?: number
  }) {
    this.input = input
    this.tenantId = input.tenantId
    this.itemId = input.itemId
    this.page = input.page
    this.pageSize = input.pageSize
  }
}
