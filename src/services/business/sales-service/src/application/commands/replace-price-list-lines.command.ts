import { PriceListLineDraftInput } from '../../domain/models/pricing-records'

/** ReplacePriceListLinesCommand captures one full-replace write for all line-level sales pricing baselines on a price list. */
export class ReplacePriceListLinesCommand {
  constructor(
    public readonly input: {
      tenantId: string
      priceListId: string
      lines: PriceListLineDraftInput[]
    }
  ) {}
}
