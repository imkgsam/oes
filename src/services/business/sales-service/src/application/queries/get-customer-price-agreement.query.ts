/** GetCustomerPriceAgreementQuery captures one read for the current head or one specific version in an agreement family. */
export class GetCustomerPriceAgreementQuery {
  constructor(
    public readonly input: {
      tenantId: string
      customerPriceAgreementId: string
      versionNo?: number
    }
  ) {}
}
