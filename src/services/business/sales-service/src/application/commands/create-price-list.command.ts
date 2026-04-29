import { PriceListLineDraftInput, PriceListType, SalesCurrencyCode } from '../../domain/models/pricing-records'

/** CreatePriceListCommand captures one explicit request to create a new sales price list head plus optional seeded lines. */
export class CreatePriceListCommand {
  constructor(
    public readonly input: {
      tenantId: string
      priceListName: string
      priceListType: PriceListType
      currencyCode: SalesCurrencyCode
      effectiveFrom: string
      effectiveTo?: string | null
      initialLines?: PriceListLineDraftInput[]
    }
  ) {}
}
