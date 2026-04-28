import { Allow } from 'class-validator'

/** GetQuoteQuery captures one tenant-scoped lookup of the current quote draft carrier. */
export class GetQuoteQuery {
  @Allow()
  public readonly tenantId: string

  @Allow()
  public readonly quoteId: string

  constructor(tenantId: string, quoteId: string) {
    this.tenantId = tenantId
    this.quoteId = quoteId
  }
}
