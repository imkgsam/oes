/** GetPriceListQuery captures one point read for a single sales price list head. */
export class GetPriceListQuery {
  constructor(
    public readonly tenantId: string,
    public readonly priceListId: string
  ) {}
}
