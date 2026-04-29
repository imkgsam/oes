/** PublishCustomerPriceAgreementVersionCommand captures one explicit publish action that promotes the current agreement draft into the active version. */
export class PublishCustomerPriceAgreementVersionCommand {
  constructor(
    public readonly input: {
      tenantId: string
      customerPriceAgreementId: string
    }
  ) {}
}
