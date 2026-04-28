import { Allow } from 'class-validator'

/** GetSalesOrderQuery captures one lookup of an established sales order. */
export class GetSalesOrderQuery {
  @Allow()
  public readonly tenantId: string

  @Allow()
  public readonly salesOrderId: string

  constructor(tenantId: string, salesOrderId: string) {
    this.tenantId = tenantId
    this.salesOrderId = salesOrderId
  }
}
