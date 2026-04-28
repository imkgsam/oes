import { Allow } from 'class-validator'
import { QuoteSearchInput } from '../../domain/models/sales-records'

/** SearchQuotesQuery captures one tenant-scoped quote catalog search with frozen phase 1 filters. */
export class SearchQuotesQuery {
  @Allow()
  public readonly input: QuoteSearchInput

  constructor(input: QuoteSearchInput) {
    this.input = input
  }
}
