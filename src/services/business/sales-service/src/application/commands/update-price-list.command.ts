/** UpdatePriceListCommand captures one explicit request to mutate a price list header without changing lines or snapshots. */
export class UpdatePriceListCommand {
  constructor(
    public readonly input: {
      tenantId: string
      priceListId: string
      priceListName?: string
      effectiveFrom?: string
      effectiveTo?: string | null
    }
  ) {}
}
