import { AuditEnvelope } from '@oes/common'
import { PurchaseOrderRecord, PurchaseRequestRecord, ReceivingExpectationRecord } from '../../domain/models/procurement-records'

/** ProcurementInMemoryStore keeps the phase 1 PR PO receiving state local to one runtime process for command and query wiring. */
export class ProcurementInMemoryStore {
  public readonly purchaseRequests = new Map<string, PurchaseRequestRecord>()
  public readonly purchaseOrders = new Map<string, PurchaseOrderRecord>()
  public readonly receivingExpectations = new Map<string, ReceivingExpectationRecord>()
  public readonly auditEnvelopes: AuditEnvelope[] = []

  private purchaseRequestSequence = 1
  private purchaseOrderSequence = 1
  private receivingExpectationSequence = 1

  /** nextPurchaseRequestNo reserves the next request-number summary for in-memory phase 1 usage. */
  nextPurchaseRequestNo(): string {
    return `PR-${String(this.purchaseRequestSequence++).padStart(4, '0')}`
  }

  /** nextPurchaseOrderNo reserves the next order-number summary for in-memory phase 1 usage. */
  nextPurchaseOrderNo(): string {
    return `PO-${String(this.purchaseOrderSequence++).padStart(4, '0')}`
  }

  /** nextReceivingExpectationNo reserves the next expectation-number summary for in-memory phase 1 usage. */
  nextReceivingExpectationNo(): string {
    return `RE-${String(this.receivingExpectationSequence++).padStart(4, '0')}`
  }
}
