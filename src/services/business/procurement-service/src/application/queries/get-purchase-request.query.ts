/** GetPurchaseRequestQuery carries the tenant-scoped PR lookup key. */
export class GetPurchaseRequestQuery {
  constructor(
    public readonly tenantId: string,
    public readonly purchaseRequestId: string
  ) {}
}
