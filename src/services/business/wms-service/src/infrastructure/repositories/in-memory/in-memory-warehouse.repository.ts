import { LocationRecord, PageResult, SearchLocationsInput, SearchWarehousesInput, WarehouseRecord } from '../../../domain/models/wms-records'
import { WarehouseRepository } from '../../../domain/repositories/warehouse.repository'
import { normalizeOptionalString, normalizePageInput, paginate } from '../../../application/support/wms-assertions'
import { WmsInMemoryStore } from '../../store/wms-in-memory-store'

/** InMemoryWarehouseRepository provides a deterministic topology repository for WMS L1 tests. */
export class InMemoryWarehouseRepository implements WarehouseRepository {
  constructor(private readonly store: WmsInMemoryStore) {}

  async findWarehouseById(tenantId: string, warehouseId: string): Promise<WarehouseRecord | null> {
    const record = this.store.warehouses.get(warehouseId)
    return record?.tenantId === tenantId ? structuredClone(record) : null
  }

  async searchWarehouses(input: SearchWarehousesInput): Promise<PageResult<WarehouseRecord>> {
    const { page, pageSize } = normalizePageInput(input.page, input.pageSize)
    const keyword = normalizeOptionalString(input.keyword)?.toLowerCase()
    const filtered = [...this.store.warehouses.values()]
      .filter((record) => record.tenantId === input.tenantId)
      .filter((record) => !input.orgId || record.orgId === input.orgId)
      .filter((record) => !input.status || record.status === input.status)
      .filter((record) => {
        if (!keyword) {
          return true
        }
        return (
          record.warehouseCode.toLowerCase().includes(keyword) ||
          record.warehouseName.toLowerCase().includes(keyword)
        )
      })
      .sort((left, right) => left.warehouseCode.localeCompare(right.warehouseCode))
      .map((record) => structuredClone(record))

    const { pageItems, total } = paginate(filtered, page, pageSize)
    return { items: pageItems, total, page, pageSize }
  }

  async findLocationById(tenantId: string, locationId: string): Promise<LocationRecord | null> {
    const record = this.store.locations.get(locationId)
    return record && this.store.warehouses.get(record.warehouseId)?.tenantId === tenantId
      ? structuredClone(record)
      : null
  }

  async searchLocations(input: SearchLocationsInput): Promise<PageResult<LocationRecord>> {
    const { page, pageSize } = normalizePageInput(input.page, input.pageSize)
    const filtered = [...this.store.locations.values()]
      .filter((record) => this.store.warehouses.get(record.warehouseId)?.tenantId === input.tenantId)
      .filter((record) => !input.warehouseId || record.warehouseId === input.warehouseId)
      .filter(
        (record) =>
          !input.parentLocationId || (record.parentLocationId ?? null) === input.parentLocationId
      )
      .filter((record) => !input.locationType || record.locationType === input.locationType)
      .filter((record) => !input.status || record.status === input.status)
      .filter(
        (record) =>
          input.supportsReceipt === undefined || record.supportsReceipt === input.supportsReceipt
      )
      .filter(
        (record) =>
          input.supportsStorage === undefined || record.supportsStorage === input.supportsStorage
      )
      .sort((left, right) => left.locationCode.localeCompare(right.locationCode))
      .map((record) => structuredClone(record))

    const { pageItems, total } = paginate(filtered, page, pageSize)
    return { items: pageItems, total, page, pageSize }
  }
}
