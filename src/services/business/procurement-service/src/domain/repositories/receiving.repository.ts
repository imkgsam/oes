import { PageResult, ReceivingExpectationRecord, SearchReceivingExpectationsInput } from '../models/procurement-records'

/** ReceivingRepository persists procurement-owned expectation and discrepancy summaries. */
export interface ReceivingRepository {
  nextExpectationNo(tenantId: string): Promise<string>
  findById(tenantId: string, receivingExpectationId: string): Promise<ReceivingExpectationRecord | null>
  listByPurchaseOrderLineId(tenantId: string, purchaseOrderLineId: string): Promise<ReceivingExpectationRecord[]>
  save(record: ReceivingExpectationRecord): Promise<ReceivingExpectationRecord>
  search(input: SearchReceivingExpectationsInput): Promise<PageResult<ReceivingExpectationRecord>>
  existsByPurchaseOrderId(tenantId: string, purchaseOrderId: string): Promise<boolean>
}
