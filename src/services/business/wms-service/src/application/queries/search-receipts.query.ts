import { Allow } from 'class-validator'
import { SearchReceiptsInput } from '../../domain/models/wms-records'

/** SearchReceiptsQuery captures one paged receipt directory search request. */
export class SearchReceiptsQuery {
  @Allow()
  public readonly payload: SearchReceiptsInput

  constructor(payload: SearchReceiptsInput) {
    this.payload = payload
  }
}
