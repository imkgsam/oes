import { IQueryHandler } from '@nestjs/cqrs';
import { WarehouseRecord } from '../../domain/models/wms-records';
import { WarehouseRepository } from '../../domain/repositories/warehouse.repository';
import { GetWarehouseQuery } from './get-warehouse.query';
/** GetWarehouseHandler returns one WMS-owned warehouse truth row for the query surface. */
export declare class GetWarehouseHandler implements IQueryHandler<GetWarehouseQuery, WarehouseRecord> {
    private readonly warehouseRepository;
    constructor(warehouseRepository: WarehouseRepository);
    execute(query: GetWarehouseQuery): Promise<WarehouseRecord>;
}
