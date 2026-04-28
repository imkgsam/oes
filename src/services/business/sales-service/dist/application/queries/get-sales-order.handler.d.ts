import { IQueryHandler } from '@nestjs/cqrs';
import { SalesOrderRecord } from '../../domain/models/sales-records';
import { SalesOrderRepository } from '../../domain/repositories/sales-order.repository';
import { GetSalesOrderQuery } from './get-sales-order.query';
/** GetSalesOrderHandler returns one established sales order or NOT_FOUND when the target is absent. */
export declare class GetSalesOrderHandler implements IQueryHandler<GetSalesOrderQuery, SalesOrderRecord> {
    private readonly salesOrderRepository;
    constructor(salesOrderRepository: SalesOrderRepository);
    execute(query: GetSalesOrderQuery): Promise<SalesOrderRecord>;
}
