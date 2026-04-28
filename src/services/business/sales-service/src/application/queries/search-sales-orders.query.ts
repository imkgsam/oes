import { Allow } from 'class-validator'
import { SalesOrderSearchInput } from '../../domain/models/sales-records'

/** SearchSalesOrdersQuery captures one tenant-scoped sales order catalog search across gate and source filters. */
export class SearchSalesOrdersQuery {
  @Allow()
  public readonly input: SalesOrderSearchInput

  constructor(input: SalesOrderSearchInput) {
    this.input = input
  }
}
