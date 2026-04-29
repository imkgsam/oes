import { PriceListSearchInput } from '../../domain/models/pricing-records'

/** SearchPriceListsQuery captures one paged read against the tenant-scoped sales price list catalog. */
export class SearchPriceListsQuery {
  constructor(public readonly input: PriceListSearchInput) {}
}
