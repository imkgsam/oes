import { QuoteLineInput, QuoteLineRecord, SalesOrderLineRecord } from '../../domain/models/sales-records';
/** toQuoteLineRecords materializes quote draft inputs into persisted quote line records with stable ids. */
export declare function toQuoteLineRecords(lines: QuoteLineInput[]): QuoteLineRecord[];
/** toSalesOrderLineRecords freezes published quote version lines into established order line records. */
export declare function toSalesOrderLineRecords(lines: QuoteLineRecord[]): SalesOrderLineRecord[];
