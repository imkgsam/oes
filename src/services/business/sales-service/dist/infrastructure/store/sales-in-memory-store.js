"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalesInMemoryStore = void 0;
/** SalesInMemoryStore keeps the phase 1 skeleton state local to one runtime process for command and query wiring. */
class SalesInMemoryStore {
    constructor() {
        this.quotes = new Map();
        this.quoteVersions = new Map();
        this.salesOrders = new Map();
        this.priceLists = new Map();
        this.customerPriceAgreementVersions = new Map();
        this.auditEnvelopes = [];
        this.quoteSequence = 1;
        this.salesOrderSequence = 1;
    }
    /** nextQuoteNo reserves the next tenant-scoped quote number summary for skeleton runtime usage. */
    nextQuoteNo() {
        const value = this.quoteSequence++;
        return `SQ-${String(value).padStart(4, '0')}`;
    }
    /** nextSalesOrderNo reserves the next tenant-scoped sales order number summary for skeleton runtime usage. */
    nextSalesOrderNo() {
        const value = this.salesOrderSequence++;
        return `SO-${String(value).padStart(4, '0')}`;
    }
}
exports.SalesInMemoryStore = SalesInMemoryStore;
//# sourceMappingURL=sales-in-memory-store.js.map