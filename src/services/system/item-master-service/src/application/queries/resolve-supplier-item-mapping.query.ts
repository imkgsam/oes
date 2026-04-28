import { Allow } from 'class-validator'

/** ResolveSupplierItemMappingQuery captures the supplier identifier lookup request. */
export class ResolveSupplierItemMappingQuery {
  @Allow()
  public readonly input: {
    tenantId: string
    supplierId: string
    supplierItemCode?: string
    supplierItemName?: string
  }

  @Allow()
  public readonly tenantId: string

  @Allow()
  public readonly supplierId: string

  @Allow()
  public readonly supplierItemCode?: string

  @Allow()
  public readonly supplierItemName?: string

  constructor(input: {
    tenantId: string
    supplierId: string
    supplierItemCode?: string
    supplierItemName?: string
  }) {
    this.input = input
    this.tenantId = input.tenantId
    this.supplierId = input.supplierId
    this.supplierItemCode = input.supplierItemCode
    this.supplierItemName = input.supplierItemName
  }
}
