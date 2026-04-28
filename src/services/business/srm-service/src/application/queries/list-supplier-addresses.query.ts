import { Allow } from 'class-validator'

/** ListSupplierAddressesQuery requests one SRM account's business-address list. */
export class ListSupplierAddressesQuery {
  @Allow()
  public readonly tenantId: string

  @Allow()
  public readonly supplierId: string

  constructor(tenantId: string, supplierId: string) {
    this.tenantId = tenantId
    this.supplierId = supplierId
  }
}
