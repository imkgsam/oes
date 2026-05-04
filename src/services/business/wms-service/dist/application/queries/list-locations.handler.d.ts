import { IQueryHandler } from '@nestjs/cqrs';
import { LocationRecord, PageResult } from '../../domain/models/wms-records';
import { WarehouseRepository } from '../../domain/repositories/warehouse.repository';
import { ListLocationsQuery } from './list-locations.query';
/** ListLocationsHandler returns one filtered internal location page for the query surface. */
export declare class ListLocationsHandler implements IQueryHandler<ListLocationsQuery, PageResult<LocationRecord>> {
    private readonly warehouseRepository;
    constructor(warehouseRepository: WarehouseRepository);
    execute(query: ListLocationsQuery): Promise<PageResult<LocationRecord>>;
}
