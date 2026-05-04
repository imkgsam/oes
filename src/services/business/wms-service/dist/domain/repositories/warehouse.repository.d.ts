import { LocationRecord, PageResult, SearchLocationsInput, SearchWarehousesInput, WarehouseRecord } from '../models/wms-records';
/** WarehouseRepository persists and queries WMS-owned internal warehouse and location topology truth. */
export interface WarehouseRepository {
    findWarehouseById(tenantId: string, warehouseId: string): Promise<WarehouseRecord | null>;
    searchWarehouses(input: SearchWarehousesInput): Promise<PageResult<WarehouseRecord>>;
    findLocationById(tenantId: string, locationId: string): Promise<LocationRecord | null>;
    searchLocations(input: SearchLocationsInput): Promise<PageResult<LocationRecord>>;
}
