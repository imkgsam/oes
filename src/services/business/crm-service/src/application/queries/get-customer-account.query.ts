import { Allow } from 'class-validator'

/** GetCustomerAccountQuery requests one tenant-scoped CRM customer-account read model by id. */
export class GetCustomerAccountQuery {
  @Allow()
  public readonly tenantId: string

  @Allow()
  public readonly customerAccountId: string

  constructor(tenantId: string, customerAccountId: string) {
    this.tenantId = tenantId
    this.customerAccountId = customerAccountId
  }
}
