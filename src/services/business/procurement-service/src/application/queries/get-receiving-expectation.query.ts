/** GetReceivingExpectationQuery carries the tenant-scoped expectation lookup key. */
export class GetReceivingExpectationQuery {
  constructor(
    public readonly tenantId: string,
    public readonly receivingExpectationId: string
  ) {}
}
