import { AuditEnvelope } from '@oes/common';
import { QuoteRecord, QuoteVersionRecord, SalesOrderRecord } from '../../domain/models/sales-records';
/** SalesInMemoryStore keeps the phase 1 skeleton state local to one runtime process for command and query wiring. */
export declare class SalesInMemoryStore {
    readonly quotes: Map<string, QuoteRecord>;
    readonly quoteVersions: Map<string, QuoteVersionRecord>;
    readonly salesOrders: Map<string, SalesOrderRecord>;
    readonly auditEnvelopes: AuditEnvelope[];
    private quoteSequence;
    private salesOrderSequence;
    /** nextQuoteNo reserves the next tenant-scoped quote number summary for skeleton runtime usage. */
    nextQuoteNo(): string;
    /** nextSalesOrderNo reserves the next tenant-scoped sales order number summary for skeleton runtime usage. */
    nextSalesOrderNo(): string;
}
