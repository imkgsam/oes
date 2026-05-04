import { Allow } from 'class-validator'
import { SearchWarehousesInput } from '../../domain/models/wms-records'

/** ListWarehousesQuery captures one paged internal warehouse directory request. */
export class ListWarehousesQuery {
  @Allow()
  public readonly payload: SearchWarehousesInput

  constructor(payload: SearchWarehousesInput) {
    this.payload = payload
  }
}
