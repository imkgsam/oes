import { SalesCurrencyCode } from '../../domain/models/pricing-records'

/** GetActiveCustomerPriceAgreementQuery captures one point read for the current active customer pricing agreement. */
export class GetActiveCustomerPriceAgreementQuery {
  constructor(
    public readonly input: {
      tenantId: string
      customerTenantPartyId: string
      currencyCode: SalesCurrencyCode
    }
  ) {}
}
