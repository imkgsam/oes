import { Prisma, SalesFulfillmentHandoffStatus as PrismaSalesFulfillmentHandoffStatus, SalesQuoteStatus as PrismaSalesQuoteStatus } from '../../../../prisma/generated/prisma';
import { QuoteRecord, QuoteVersionRecord, SalesFulfillmentHandoffStatus, SalesOrderRecord, SalesQuoteStatus } from '../../../domain/models/sales-records';
declare const quoteInclude: {
    lines: {
        orderBy: {
            lineNo: "asc";
        };
    };
};
declare const quoteVersionInclude: {
    lines: {
        orderBy: {
            lineNo: "asc";
        };
    };
};
declare const salesOrderInclude: {
    lines: {
        orderBy: {
            lineNo: "asc";
        };
    };
    commercialGateSummary: true;
    fulfillmentHandoffSummary: true;
};
export type SalesQuoteWithLines = Prisma.SalesQuoteGetPayload<{
    include: typeof quoteInclude;
}>;
export type SalesQuoteVersionWithLines = Prisma.SalesQuoteVersionGetPayload<{
    include: typeof quoteVersionInclude;
}>;
export type SalesOrderWithChildren = Prisma.SalesOrderGetPayload<{
    include: typeof salesOrderInclude;
}>;
/** PrismaSalesRecordMapper translates Prisma sales persistence rows into the frozen phase 1 record shapes. */
export declare class PrismaSalesRecordMapper {
    /** quoteIncludeValue exposes the canonical include graph for quote repository round-trips. */
    static quoteIncludeValue(): typeof quoteInclude;
    /** quoteVersionIncludeValue exposes the canonical include graph for quote version repository reads. */
    static quoteVersionIncludeValue(): typeof quoteVersionInclude;
    /** salesOrderIncludeValue exposes the canonical include graph for sales order repository reads. */
    static salesOrderIncludeValue(): typeof salesOrderInclude;
    /** toQuote converts one persisted quote and its lines into the domain query and command record shape. */
    static toQuote(record: SalesQuoteWithLines): QuoteRecord;
    /** toQuoteVersion converts one persisted quote version and its lines into the immutable published record shape. */
    static toQuoteVersion(record: SalesQuoteVersionWithLines): QuoteVersionRecord;
    /** toSalesOrder converts one persisted order graph into the phase 1 established order record shape. */
    static toSalesOrder(record: SalesOrderWithChildren): SalesOrderRecord;
    /** toPersistedQuoteStatus converts the domain quote status enum into the Prisma enum value. */
    static toPersistedQuoteStatus(status: SalesQuoteStatus): PrismaSalesQuoteStatus;
    /** toPersistedHandoffStatus converts the domain handoff status enum into the Prisma enum value. */
    static toPersistedHandoffStatus(status: SalesFulfillmentHandoffStatus): PrismaSalesFulfillmentHandoffStatus;
    /** toInputJson deep-clones a plain snapshot object into a Prisma JSON input payload. */
    static toInputJson(value: unknown): Prisma.InputJsonValue;
    /** toQuoteLine converts one persisted quote-style line row into the shared quote line record shape. */
    private static toQuoteLine;
    /** toSalesOrderLine converts one persisted order line row into the frozen order line record shape. */
    private static toSalesOrderLine;
    /** toCommercialGateSummary converts the 1:1 gate summary row into the domain gate summary shape. */
    private static toCommercialGateSummary;
    /** toFulfillmentHandoffSummary converts the 1:1 handoff summary row into the domain handoff shape. */
    private static toFulfillmentHandoffSummary;
    /** fromJson casts one stored JSON payload back into the snapshot shape used by the domain records. */
    private static fromJson;
}
export {};
