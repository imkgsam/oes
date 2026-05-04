import { Allow } from 'class-validator'
import { SearchReceiptLinesInput } from '../../domain/models/wms-records'

/** SearchReceiptLinesQuery captures one paged receipt-line directory search request. */
export class SearchReceiptLinesQuery {
  @Allow()
  public readonly payload: SearchReceiptLinesInput

  constructor(payload: SearchReceiptLinesInput) {
    this.payload = payload
  }
}
