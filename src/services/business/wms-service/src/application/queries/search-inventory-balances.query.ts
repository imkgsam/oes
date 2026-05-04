import { Allow } from 'class-validator'
import { SearchInventoryBalancesInput } from '../../domain/models/wms-records'

/** SearchInventoryBalancesQuery captures one paged inventory balance directory request. */
export class SearchInventoryBalancesQuery {
  @Allow()
  public readonly payload: SearchInventoryBalancesInput

  constructor(payload: SearchInventoryBalancesInput) {
    this.payload = payload
  }
}
