import { IQueryHandler } from '@nestjs/cqrs';
import { LocationRecord } from '../../domain/models/wms-records';
import { WarehouseRepository } from '../../domain/repositories/warehouse.repository';
import { GetLocationQuery } from './get-location.query';
/** GetLocationHandler returns one WMS-owned location truth row for the query surface. */
export declare class GetLocationHandler implements IQueryHandler<GetLocationQuery, LocationRecord> {
    private readonly warehouseRepository;
    constructor(warehouseRepository: WarehouseRepository);
    execute(query: GetLocationQuery): Promise<LocationRecord>;
}
