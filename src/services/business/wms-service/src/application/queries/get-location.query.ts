import { Allow } from 'class-validator'

/** GetLocationQuery captures one tenant-scoped location lookup by location_id. */
export class GetLocationQuery {
  @Allow()
  public readonly tenantId: string

  @Allow()
  public readonly locationId: string

  constructor(
    tenantId: string,
    locationId: string
  ) {
    this.tenantId = tenantId
    this.locationId = locationId
  }
}
