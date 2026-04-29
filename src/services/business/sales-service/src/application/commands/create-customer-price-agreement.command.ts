import { CustomerPriceAgreementLineDraftInput, SalesCurrencyCode } from '../../domain/models/pricing-records'

/** CreateCustomerPriceAgreementCommand captures one request to establish a new customer+currency agreement family with draft version 1. */
export class CreateCustomerPriceAgreementCommand {
  constructor(
    public readonly input: {
      tenantId: string
      customerTenantPartyId: string
      currencyCode: SalesCurrencyCode
      initialLines?: CustomerPriceAgreementLineDraftInput[]
    }
  ) {}
}
