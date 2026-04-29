/** ListCustomerPriceAgreementVersionsQuery captures one paged read for the version history of an agreement family. */
export class ListCustomerPriceAgreementVersionsQuery {
  constructor(
    public readonly input: {
      tenantId: string
      customerPriceAgreementId: string
      page?: number
      pageSize?: number
    }
  ) {}
}
