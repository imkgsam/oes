import { LocationRecord, PageResult, SearchLocationsInput, SearchWarehousesInput, WarehouseRecord } from '../../../domain/models/wms-records';
import { WarehouseRepository } from '../../../domain/repositories/warehouse.repository';
import { PrismaService } from '../../prisma/prisma.service';
/** PrismaWarehouseRepository persists and queries the internal warehouse and location topology owned by WMS. */
export declare class PrismaWarehouseRepository implements WarehouseRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findWarehouseById(tenantId: string, warehouseId: string): Promise<WarehouseRecord | null>;
    searchWarehouses(input: SearchWarehousesInput): Promise<PageResult<WarehouseRecord>>;
    findLocationById(tenantId: string, locationId: string): Promise<LocationRecord | null>;
    searchLocations(input: SearchLocationsInput): Promise<PageResult<LocationRecord>>;
}
