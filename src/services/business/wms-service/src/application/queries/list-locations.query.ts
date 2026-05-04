import { Allow } from 'class-validator'
import { SearchLocationsInput } from '../../domain/models/wms-records'

/** ListLocationsQuery captures one paged internal location directory request. */
export class ListLocationsQuery {
  @Allow()
  public readonly payload: SearchLocationsInput

  constructor(payload: SearchLocationsInput) {
    this.payload = payload
  }
}
