import { Allow } from 'class-validator'

/** ConvertQuoteVersionToOrderCommand captures the explicit order-establishment action from one published quote version. */
export class ConvertQuoteVersionToOrderCommand {
  @Allow()
  public readonly input: {
    tenantId: string
    quoteVersionId: string
  }

  constructor(input: {
    tenantId: string
    quoteVersionId: string
  }) {
    this.input = input
  }

  get tenantId(): string {
    return this.input.tenantId
  }

  get quoteVersionId(): string {
    return this.input.quoteVersionId
  }
}
