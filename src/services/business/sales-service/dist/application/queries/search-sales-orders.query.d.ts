import { SalesOrderSearchInput } from '../../domain/models/sales-records';
/** SearchSalesOrdersQuery captures one tenant-scoped sales order catalog search across gate and source filters. */
export declare class SearchSalesOrdersQuery {
    readonly input: SalesOrderSearchInput;
    constructor(input: SalesOrderSearchInput);
}
