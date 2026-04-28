import { randomUUID } from 'node:crypto'
import {
  QuoteLineInput,
  QuoteLineRecord,
  SalesOrderLineRecord
} from '../../domain/models/sales-records'

/** toQuoteLineRecords materializes quote draft inputs into persisted quote line records with stable ids. */
export function toQuoteLineRecords(lines: QuoteLineInput[]): QuoteLineRecord[] {
  return lines.map((line) => ({
    quoteLineId: randomUUID(),
    lineNo: line.lineNo,
    itemId: line.itemId,
    itemSnapshot: structuredClone(line.itemSnapshot),
    salesConfigSnapshot: structuredClone(line.salesConfigSnapshot),
    packagingRequirementSnapshot: structuredClone(line.packagingRequirementSnapshot),
    priceQuantityDeliverySnapshot: structuredClone(line.priceQuantityDeliverySnapshot),
    customerItemSnapshot: structuredClone(line.customerItemSnapshot)
  }))
}

/** toSalesOrderLineRecords freezes published quote version lines into established order line records. */
export function toSalesOrderLineRecords(lines: QuoteLineRecord[]): SalesOrderLineRecord[] {
  return lines.map((line) => ({
    salesOrderLineId: randomUUID(),
    lineNo: line.lineNo,
    itemId: line.itemId,
    itemSnapshot: structuredClone(line.itemSnapshot),
    salesConfigSnapshot: structuredClone(line.salesConfigSnapshot),
    packagingRequirementSnapshot: structuredClone(line.packagingRequirementSnapshot),
    priceQuantityDeliverySnapshot: structuredClone(line.priceQuantityDeliverySnapshot),
    customerItemSnapshot: structuredClone(line.customerItemSnapshot)
  }))
}
