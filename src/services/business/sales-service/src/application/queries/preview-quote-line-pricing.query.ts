import { PreviewQuoteLinePricingInput } from '../../domain/models/pricing-records'

/** PreviewQuoteLinePricingQuery captures one non-mutating request to resolve the sales pricing snapshot for a potential quote line. */
export class PreviewQuoteLinePricingQuery {
  constructor(public readonly input: PreviewQuoteLinePricingInput) {}
}
