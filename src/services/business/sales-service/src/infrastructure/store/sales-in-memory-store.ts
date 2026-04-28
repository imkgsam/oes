import { AuditEnvelope } from '@oes/common'
import { QuoteRecord, QuoteVersionRecord, SalesOrderRecord } from '../../domain/models/sales-records'

/** SalesInMemoryStore keeps the phase 1 skeleton state local to one runtime process for command and query wiring. */
export class SalesInMemoryStore {
  public readonly quotes = new Map<string, QuoteRecord>()
  public readonly quoteVersions = new Map<string, QuoteVersionRecord>()
  public readonly salesOrders = new Map<string, SalesOrderRecord>()
  public readonly auditEnvelopes: AuditEnvelope[] = []

  private quoteSequence = 1
  private salesOrderSequence = 1

  /** nextQuoteNo reserves the next tenant-scoped quote number summary for skeleton runtime usage. */
  nextQuoteNo(): string {
    const value = this.quoteSequence++
    return `SQ-${String(value).padStart(4, '0')}`
  }

  /** nextSalesOrderNo reserves the next tenant-scoped sales order number summary for skeleton runtime usage. */
  nextSalesOrderNo(): string {
    const value = this.salesOrderSequence++
    return `SO-${String(value).padStart(4, '0')}`
  }
}
