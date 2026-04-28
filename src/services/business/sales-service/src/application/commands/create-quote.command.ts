import { Allow } from 'class-validator'
import { OpportunityRefSummary, QuoteLineInput } from '../../domain/models/sales-records'

/** CreateQuoteCommand captures one tenant-scoped quote draft creation intent. */
export class CreateQuoteCommand {
  @Allow()
  public readonly input: {
    tenantId: string
    customerTenantPartyId: string
    opportunityRef?: OpportunityRefSummary | null
    draftLines: QuoteLineInput[]
  }

  constructor(input: {
    tenantId: string
    customerTenantPartyId: string
    opportunityRef?: OpportunityRefSummary | null
    draftLines: QuoteLineInput[]
  }) {
    this.input = input
  }

  get tenantId(): string {
    return this.input.tenantId
  }

  get customerTenantPartyId(): string {
    return this.input.customerTenantPartyId
  }

  get opportunityRef(): OpportunityRefSummary | null | undefined {
    return this.input.opportunityRef
  }

  get draftLines(): QuoteLineInput[] {
    return this.input.draftLines
  }
}
