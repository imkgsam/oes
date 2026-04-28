import { Allow } from 'class-validator'

/** GetQuoteVersionQuery captures one lookup of a published quote version baseline by id. */
export class GetQuoteVersionQuery {
  @Allow()
  public readonly tenantId: string

  @Allow()
  public readonly quoteVersionId: string

  constructor(tenantId: string, quoteVersionId: string) {
    this.tenantId = tenantId
    this.quoteVersionId = quoteVersionId
  }
}
