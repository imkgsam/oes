import { Allow } from 'class-validator'
import { GetInventoryBalanceInput } from '../../domain/models/wms-records'

/** GetInventoryBalanceQuery captures one warehouse-level or location-level balance lookup key. */
export class GetInventoryBalanceQuery {
  @Allow()
  public readonly payload: GetInventoryBalanceInput

  constructor(payload: GetInventoryBalanceInput) {
    this.payload = payload
  }
}
