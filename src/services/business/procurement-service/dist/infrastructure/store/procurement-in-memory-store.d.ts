import { AuditEnvelope } from '@oes/common';
import { PurchaseOrderRecord, PurchaseRequestRecord, ReceivingExpectationRecord } from '../../domain/models/procurement-records';
/** ProcurementInMemoryStore keeps the phase 1 PR PO receiving state local to one runtime process for command and query wiring. */
export declare class ProcurementInMemoryStore {
    readonly purchaseRequests: Map<string, PurchaseRequestRecord>;
    readonly purchaseOrders: Map<string, PurchaseOrderRecord>;
    readonly receivingExpectations: Map<string, ReceivingExpectationRecord>;
    readonly auditEnvelopes: AuditEnvelope[];
    private purchaseRequestSequence;
    private purchaseOrderSequence;
    private receivingExpectationSequence;
    /** nextPurchaseRequestNo reserves the next request-number summary for in-memory phase 1 usage. */
    nextPurchaseRequestNo(): string;
    /** nextPurchaseOrderNo reserves the next order-number summary for in-memory phase 1 usage. */
    nextPurchaseOrderNo(): string;
    /** nextReceivingExpectationNo reserves the next expectation-number summary for in-memory phase 1 usage. */
    nextReceivingExpectationNo(): string;
}
