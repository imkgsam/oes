import { IQueryHandler } from '@nestjs/cqrs';
import { PageResult, SalesOrderRecord } from '../../domain/models/sales-records';
import { SalesOrderRepository } from '../../domain/repositories/sales-order.repository';
import { SearchSalesOrdersQuery } from './search-sales-orders.query';
export interface SearchSalesOrdersResult extends PageResult<SalesOrderRecord> {
    salesOrders: SalesOrderRecord[];
}
/** SearchSalesOrdersHandler returns paged established order summaries without crossing into fulfillment execution truth. */
export declare class SearchSalesOrdersHandler implements IQueryHandler<SearchSalesOrdersQuery, SearchSalesOrdersResult> {
    private readonly salesOrderRepository;
    constructor(salesOrderRepository: SalesOrderRepository);
    execute(query: SearchSalesOrdersQuery): Promise<SearchSalesOrdersResult>;
}
