import { Allow } from 'class-validator'

/** GetCrmAccountQuery carries the tenant and account id for one CRM P1 account lookup. */
export class GetCrmAccountQuery {
  @Allow()
  readonly tenantId: string

  @Allow()
  readonly crmAccountId: string

  constructor(tenantId: string, crmAccountId: string) {
    this.tenantId = tenantId
    this.crmAccountId = crmAccountId
  }
}
