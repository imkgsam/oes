import { Allow } from 'class-validator'
import { ReceivingExpectationStatus } from '../../domain/models/procurement-records'

/** SearchReceivingExpectationsQuery carries the paged procurement expectation filters frozen for phase 1. */
export class SearchReceivingExpectationsQuery {
  @Allow()
  public readonly input: {
    tenantId: string
    orgId?: string
    purchaseOrderId?: string
    supplierId?: string
    status?: ReceivingExpectationStatus
    hasOpenDiscrepancy?: boolean
    targetWarehouseId?: string
    targetReceivingAddressId?: string
    expectedReceiptDateFrom?: string
    expectedReceiptDateTo?: string
    page?: number
    pageSize?: number
  }

  constructor(input: SearchReceivingExpectationsQuery['input']) {
    this.input = input
  }
}
