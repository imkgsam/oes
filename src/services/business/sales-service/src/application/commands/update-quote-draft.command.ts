import { Allow } from 'class-validator'
import { QuoteDraftMutation } from '../../domain/models/sales-records'

/** UpdateQuoteDraftCommand captures one draft overwrite against the current mutable quote working state. */
export class UpdateQuoteDraftCommand {
  @Allow()
  public readonly input: {
    tenantId: string
    quoteId: string
    draftMutation: QuoteDraftMutation
  }

  constructor(input: {
    tenantId: string
    quoteId: string
    draftMutation: QuoteDraftMutation
  }) {
    this.input = input
  }

  get tenantId(): string {
    return this.input.tenantId
  }

  get quoteId(): string {
    return this.input.quoteId
  }

  get draftMutation(): QuoteDraftMutation {
    return this.input.draftMutation
  }
}
