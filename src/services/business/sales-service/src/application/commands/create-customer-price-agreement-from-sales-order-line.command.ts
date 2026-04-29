/** CreateCustomerPriceAgreementFromSalesOrderLineCommand captures one explicit request to extract a customer pricing draft from a frozen sales order line snapshot. */
export class CreateCustomerPriceAgreementFromSalesOrderLineCommand {
  constructor(
    public readonly input: {
      tenantId: string
      salesOrderLineId: string
    }
  ) {}
}
