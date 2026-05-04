import { LocationRecord, PageResult, SearchLocationsInput, SearchWarehousesInput, WarehouseRecord } from '../../../domain/models/wms-records';
import { WarehouseRepository } from '../../../domain/repositories/warehouse.repository';
import { WmsInMemoryStore } from '../../store/wms-in-memory-store';
/** InMemoryWarehouseRepository provides a deterministic topology repository for WMS L1 tests. */
export declare class InMemoryWarehouseRepository implements WarehouseRepository {
    private readonly store;
    constructor(store: WmsInMemoryStore);
    findWarehouseById(tenantId: string, warehouseId: string): Promise<WarehouseRecord | null>;
    searchWarehouses(input: SearchWarehousesInput): Promise<PageResult<WarehouseRecord>>;
    findLocationById(tenantId: string, locationId: string): Promise<LocationRecord | null>;
    searchLocations(input: SearchLocationsInput): Promise<PageResult<LocationRecord>>;
}
