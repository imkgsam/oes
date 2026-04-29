import { PriceListStatus } from '../../domain/models/pricing-records'

/** ChangePriceListStatusCommand captures one lifecycle transition for a mutable phase 1 price list. */
export class ChangePriceListStatusCommand {
  constructor(
    public readonly input: {
      tenantId: string
      priceListId: string
      targetStatus: PriceListStatus
    }
  ) {}
}
