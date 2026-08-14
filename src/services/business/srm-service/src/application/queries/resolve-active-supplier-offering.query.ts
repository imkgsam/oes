import { Allow } from 'class-validator'

/** ResolveActiveSupplierOfferingQuery asks for one exact active supplier/item eligibility fact. */
export class ResolveActiveSupplierOfferingQuery {
  @Allow()
  readonly tenantId: string

  @Allow()
  readonly supplierId: string

  @Allow()
  readonly itemId: string

  constructor(tenantId: string, supplierId: string, itemId: string) {
    this.tenantId = tenantId
    this.supplierId = supplierId
    this.itemId = itemId
  }
}
