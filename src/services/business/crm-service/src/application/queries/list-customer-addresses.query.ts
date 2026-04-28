import { Allow } from 'class-validator'

/** ListCustomerAddressesQuery requests one CRM account's business-address list. */
export class ListCustomerAddressesQuery {
  @Allow()
  public readonly tenantId: string

  @Allow()
  public readonly customerAccountId: string

  constructor(tenantId: string, customerAccountId: string) {
    this.tenantId = tenantId
    this.customerAccountId = customerAccountId
  }
}
