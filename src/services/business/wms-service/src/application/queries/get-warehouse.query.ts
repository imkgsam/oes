import { Allow } from 'class-validator'

/** GetWarehouseQuery captures one tenant-scoped warehouse lookup by warehouse_id. */
export class GetWarehouseQuery {
  @Allow()
  public readonly tenantId: string

  @Allow()
  public readonly warehouseId: string

  constructor(
    tenantId: string,
    warehouseId: string
  ) {
    this.tenantId = tenantId
    this.warehouseId = warehouseId
  }
}
