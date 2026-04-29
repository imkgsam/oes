import { PriceListLineListInput } from '../../domain/models/pricing-records'

/** GetPriceListLinesQuery captures one paged line-level read scoped to a single sales price list. */
export class GetPriceListLinesQuery {
  constructor(public readonly input: PriceListLineListInput) {}
}
