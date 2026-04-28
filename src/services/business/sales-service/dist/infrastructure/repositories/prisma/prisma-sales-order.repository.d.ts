import { PageResult, SalesOrderRecord, SalesOrderSearchInput } from '../../../domain/models/sales-records';
import { SalesOrderRepository } from '../../../domain/repositories/sales-order.repository';
import { PrismaService } from '../../prisma/prisma.service';
/** PrismaSalesOrderRepository persists established orders plus gate and handoff summaries in PostgreSQL. */
export declare class PrismaSalesOrderRepository implements SalesOrderRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    nextSalesOrderNo(tenantId: string): Promise<string>;
    findById(tenantId: string, salesOrderId: string): Promise<SalesOrderRecord | null>;
    findByQuoteVersionId(tenantId: string, quoteVersionId: string): Promise<SalesOrderRecord | null>;
    save(order: SalesOrderRecord): Promise<SalesOrderRecord>;
    search(input: SalesOrderSearchInput): Promise<PageResult<SalesOrderRecord>>;
}
