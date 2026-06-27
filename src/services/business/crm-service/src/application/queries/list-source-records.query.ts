import { Allow } from 'class-validator'

/** ListSourceRecordsQuery carries the tenant-scoped CRM account source-record lookup key. */
export class ListSourceRecordsQuery {
  @Allow()
  readonly tenantId: string

  @Allow()
  readonly crmAccountId: string

  constructor(tenantId: string, crmAccountId: string) {
    this.tenantId = tenantId
    this.crmAccountId = crmAccountId
  }
}
