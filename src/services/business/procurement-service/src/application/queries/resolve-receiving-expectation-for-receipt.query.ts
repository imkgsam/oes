/** Carries the verified-tenant key for WMS's narrow receipt expectation lookup. */
export class ResolveReceivingExpectationForReceiptQuery {
  constructor(
    public readonly tenantId: string,
    public readonly receivingExpectationId: string
  ) {}
}
