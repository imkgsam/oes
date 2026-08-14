import { Allow } from 'class-validator'

/** ResolveActiveSupplierQuery asks for one exact active supplier eligibility projection. */
export class ResolveActiveSupplierQuery {
  @Allow()
  readonly tenantId: string

  @Allow()
  readonly supplierId: string

  constructor(tenantId: string, supplierId: string) {
    this.tenantId = tenantId
    this.supplierId = supplierId
  }
}
