"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcurementInMemoryStore = void 0;
/** ProcurementInMemoryStore keeps the phase 1 PR PO receiving state local to one runtime process for command and query wiring. */
class ProcurementInMemoryStore {
    constructor() {
        this.purchaseRequests = new Map();
        this.purchaseOrders = new Map();
        this.receivingExpectations = new Map();
        this.auditEnvelopes = [];
        this.purchaseRequestSequence = 1;
        this.purchaseOrderSequence = 1;
        this.receivingExpectationSequence = 1;
    }
    /** nextPurchaseRequestNo reserves the next request-number summary for in-memory phase 1 usage. */
    nextPurchaseRequestNo() {
        return `PR-${String(this.purchaseRequestSequence++).padStart(4, '0')}`;
    }
    /** nextPurchaseOrderNo reserves the next order-number summary for in-memory phase 1 usage. */
    nextPurchaseOrderNo() {
        return `PO-${String(this.purchaseOrderSequence++).padStart(4, '0')}`;
    }
    /** nextReceivingExpectationNo reserves the next expectation-number summary for in-memory phase 1 usage. */
    nextReceivingExpectationNo() {
        return `RE-${String(this.receivingExpectationSequence++).padStart(4, '0')}`;
    }
}
exports.ProcurementInMemoryStore = ProcurementInMemoryStore;
//# sourceMappingURL=procurement-in-memory-store.js.map