import { PageResult, SalesOrderRecord, SalesOrderSearchInput } from '../models/sales-records';
/** SalesOrderRepository persists established sales orders and the phase 1 commercial gate and handoff summaries. */
export interface SalesOrderRepository {
    nextSalesOrderNo(tenantId: string): Promise<string>;
    findById(tenantId: string, salesOrderId: string): Promise<SalesOrderRecord | null>;
    findByQuoteVersionId(tenantId: string, quoteVersionId: string): Promise<SalesOrderRecord | null>;
    findLineById(tenantId: string, salesOrderLineId: string): Promise<{
        order: SalesOrderRecord;
        line: SalesOrderRecord['lines'][number];
    } | null>;
    save(order: SalesOrderRecord): Promise<SalesOrderRecord>;
    search(input: SalesOrderSearchInput): Promise<PageResult<SalesOrderRecord>>;
}
