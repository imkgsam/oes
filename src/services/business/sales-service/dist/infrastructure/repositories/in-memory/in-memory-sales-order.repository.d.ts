import { PageResult, SalesOrderRecord, SalesOrderSearchInput } from '../../../domain/models/sales-records';
import { SalesOrderRepository } from '../../../domain/repositories/sales-order.repository';
import { SalesInMemoryStore } from '../../store/sales-in-memory-store';
/** InMemorySalesOrderRepository stores established orders, commercial gates, and handoff summaries in-process. */
export declare class InMemorySalesOrderRepository implements SalesOrderRepository {
    private readonly store;
    constructor(store: SalesInMemoryStore);
    nextSalesOrderNo(_tenantId: string): Promise<string>;
    findById(tenantId: string, salesOrderId: string): Promise<SalesOrderRecord | null>;
    findByQuoteVersionId(tenantId: string, quoteVersionId: string): Promise<SalesOrderRecord | null>;
    save(order: SalesOrderRecord): Promise<SalesOrderRecord>;
    search(input: SalesOrderSearchInput): Promise<PageResult<SalesOrderRecord>>;
}
