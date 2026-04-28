import { Allow } from 'class-validator'

/** GetSupplierQuery requests one tenant-scoped SRM supplier-profile read model by id. */
export class GetSupplierQuery {
  @Allow()
  public readonly tenantId: string

  @Allow()
  public readonly supplierId: string

  constructor(tenantId: string, supplierId: string) {
    this.tenantId = tenantId
    this.supplierId = supplierId
  }
}
