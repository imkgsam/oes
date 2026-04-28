import { Allow } from 'class-validator'
import { QuoteVersionListInput } from '../../domain/models/sales-records'

/** ListQuoteVersionsQuery captures one published-version history page request for a single quote. */
export class ListQuoteVersionsQuery {
  @Allow()
  public readonly input: QuoteVersionListInput

  constructor(input: QuoteVersionListInput) {
    this.input = input
  }
}
