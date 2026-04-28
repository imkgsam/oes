import { Allow } from 'class-validator'

/** PublishQuoteCommand captures one explicit request to freeze the current quote draft into a QuoteVersion. */
export class PublishQuoteCommand {
  @Allow()
  public readonly input: {
    tenantId: string
    quoteId: string
  }

  constructor(input: {
    tenantId: string
    quoteId: string
  }) {
    this.input = input
  }

  get tenantId(): string {
    return this.input.tenantId
  }

  get quoteId(): string {
    return this.input.quoteId
  }
}
