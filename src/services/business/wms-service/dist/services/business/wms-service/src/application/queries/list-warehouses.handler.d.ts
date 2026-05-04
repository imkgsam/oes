import { IQueryHandler } from '@nestjs/cqrs';
import { PageResult, WarehouseRecord } from '../../domain/models/wms-records';
import { WarehouseRepository } from '../../domain/repositories/warehouse.repository';
import { ListWarehousesQuery } from './list-warehouses.query';
/** ListWarehousesHandler returns one filtered internal warehouse page for the query surface. */
export declare class ListWarehousesHandler implements IQueryHandler<ListWarehousesQuery, PageResult<WarehouseRecord>> {
    private readonly warehouseRepository;
    constructor(warehouseRepository: WarehouseRepository);
    execute(query: ListWarehousesQuery): Promise<PageResult<WarehouseRecord>>;
}
