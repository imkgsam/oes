import { Allow } from 'class-validator'

/** ListSupplierContactsQuery requests one SRM account's business-contact list. */
export class ListSupplierContactsQuery {
  @Allow()
  public readonly tenantId: string

  @Allow()
  public readonly supplierId: string

  constructor(tenantId: string, supplierId: string) {
    this.tenantId = tenantId
    this.supplierId = supplierId
  }
}
