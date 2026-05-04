import { Allow } from 'class-validator'
import { SearchStockLedgerEntriesInput } from '../../domain/models/wms-records'

/** SearchStockLedgerEntriesQuery captures one paged immutable ledger search request. */
export class SearchStockLedgerEntriesQuery {
  @Allow()
  public readonly payload: SearchStockLedgerEntriesInput

  constructor(payload: SearchStockLedgerEntriesInput) {
    this.payload = payload
  }
}
