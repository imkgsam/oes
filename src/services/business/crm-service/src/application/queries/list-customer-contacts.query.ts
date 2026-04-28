import { Allow } from 'class-validator'

/** ListCustomerContactsQuery requests one CRM account's business-contact list. */
export class ListCustomerContactsQuery {
  @Allow()
  public readonly tenantId: string

  @Allow()
  public readonly customerAccountId: string

  constructor(tenantId: string, customerAccountId: string) {
    this.tenantId = tenantId
    this.customerAccountId = customerAccountId
  }
}
