/** GetPurchaseOrderQuery carries the tenant-scoped PO lookup key. */
export class GetPurchaseOrderQuery {
  constructor(
    public readonly tenantId: string,
    public readonly purchaseOrderId: string
  ) {}
}
