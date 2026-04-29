import { Injectable } from '@nestjs/common'
import { normalizePageInput, paginate } from '../../../application/support/procurement-assertions'
import {
  PageResult,
  ReceivingExpectationRecord,
  SearchReceivingExpectationsInput,
  cloneRecord
} from '../../../domain/models/procurement-records'
import { ReceivingRepository } from '../../../domain/repositories/receiving.repository'
import { ProcurementInMemoryStore } from '../../store/procurement-in-memory-store'

/** InMemoryReceivingRepository stores procurement expectation and discrepancy summaries in-process for behavior tests. */
@Injectable()
export class InMemoryReceivingRepository implements ReceivingRepository {
  constructor(private readonly store: ProcurementInMemoryStore) {}

  async nextExpectationNo(_tenantId: string): Promise<string> {
    return this.store.nextReceivingExpectationNo()
  }

  async findById(tenantId: string, receivingExpectationId: string): Promise<ReceivingExpectationRecord | null> {
    const record = this.store.receivingExpectations.get(receivingExpectationId)
    if (!record || record.tenantId !== tenantId) {
      return null
    }

    return cloneRecord(record)
  }

  async listByPurchaseOrderLineId(
    tenantId: string,
    purchaseOrderLineId: string
  ): Promise<ReceivingExpectationRecord[]> {
    return [...this.store.receivingExpectations.values()]
      .filter((candidate) => candidate.tenantId === tenantId && candidate.purchaseOrderLineId === purchaseOrderLineId)
      .map((record) => cloneRecord(record))
  }

  async save(record: ReceivingExpectationRecord): Promise<ReceivingExpectationRecord> {
    const stored = cloneRecord(record)
    this.store.receivingExpectations.set(stored.receivingExpectationId, stored)
    return cloneRecord(stored)
  }

  async search(input: SearchReceivingExpectationsInput): Promise<PageResult<ReceivingExpectationRecord>> {
    const { page, pageSize } = normalizePageInput(input.page, input.pageSize)
    const filtered = [...this.store.receivingExpectations.values()]
      .filter((record) => record.tenantId === input.tenantId)
      .filter((record) => !input.orgId || record.orgId === input.orgId)
      .filter((record) => !input.purchaseOrderId || record.purchaseOrderId === input.purchaseOrderId)
      .filter((record) => !input.supplierId || record.supplierId === input.supplierId)
      .filter((record) => !input.status || record.status === input.status)
      .filter((record) => !input.targetWarehouseId || record.targetWarehouseId === input.targetWarehouseId)
      .filter(
        (record) =>
          !input.targetReceivingAddressId || record.targetReceivingAddressId === input.targetReceivingAddressId
      )
      .filter((record) => {
        if (input.hasOpenDiscrepancy === undefined) {
          return true
        }

        const hasOpen = record.discrepancy?.status === 'OPEN'
        return input.hasOpenDiscrepancy ? hasOpen : !hasOpen
      })
      .filter((record) => {
        if (!input.expectedReceiptDateFrom && !input.expectedReceiptDateTo) {
          return true
        }
        const expectedDate = record.expectedReceiptDate
        if (!expectedDate) {
          return false
        }
        if (input.expectedReceiptDateFrom && expectedDate < input.expectedReceiptDateFrom) {
          return false
        }
        if (input.expectedReceiptDateTo && expectedDate > input.expectedReceiptDateTo) {
          return false
        }
        return true
      })
      .sort((left, right) => left.receivingExpectationId.localeCompare(right.receivingExpectationId))
      .map((record) => cloneRecord(record))

    const { pageItems, total } = paginate(filtered, page, pageSize)
    return {
      items: pageItems,
      total,
      page,
      pageSize
    }
  }

  async existsByPurchaseOrderId(tenantId: string, purchaseOrderId: string): Promise<boolean> {
    return [...this.store.receivingExpectations.values()].some(
      (record) => record.tenantId === tenantId && record.purchaseOrderId === purchaseOrderId
    )
  }
}
