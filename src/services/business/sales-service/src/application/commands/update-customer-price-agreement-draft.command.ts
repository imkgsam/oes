import { CustomerPriceAgreementDraftMutation } from '../../domain/models/pricing-records'

/** UpdateCustomerPriceAgreementDraftCommand captures one explicit mutation against the current draft agreement version. */
export class UpdateCustomerPriceAgreementDraftCommand {
  constructor(
    public readonly input: {
      tenantId: string
      customerPriceAgreementId: string
      draftMutation: CustomerPriceAgreementDraftMutation
    }
  ) {}
}
