import { Injectable } from '@nestjs/common'
import { normalizePageInput, paginate } from '../../../application/support/procurement-assertions'
import {
  PageResult,
  PurchaseOrderChangeRecord,
  PurchaseOrderRecord,
  SearchPurchaseOrdersInput,
  cloneRecord
} from '../../../domain/models/procurement-records'
import {
  ListPurchaseOrderChangesInput,
  PurchaseOrderRepository
} from '../../../domain/repositories/purchase-order.repository'
import { ProcurementInMemoryStore } from '../../store/procurement-in-memory-store'

/** InMemoryPurchaseOrderRepository stores PO aggregates and applied changes in-process for behavior tests. */
@Injectable()
export class InMemoryPurchaseOrderRepository implements PurchaseOrderRepository {
  constructor(private readonly store: ProcurementInMemoryStore) {}

  async nextOrderNo(_tenantId: string): Promise<string> {
    return this.store.nextPurchaseOrderNo()
  }

  async findById(tenantId: string, purchaseOrderId: string): Promise<PurchaseOrderRecord | null> {
    const record = this.store.purchaseOrders.get(purchaseOrderId)
    if (!record || record.tenantId !== tenantId) {
      return null
    }

    return cloneRecord(record)
  }

  async save(record: PurchaseOrderRecord): Promise<PurchaseOrderRecord> {
    const stored = cloneRecord(record)
    this.store.purchaseOrders.set(stored.purchaseOrderId, stored)
    return cloneRecord(stored)
  }

  async search(input: SearchPurchaseOrdersInput): Promise<PageResult<PurchaseOrderRecord>> {
    const { page, pageSize } = normalizePageInput(input.page, input.pageSize)
    const filtered = [...this.store.purchaseOrders.values()]
      .filter((record) => record.tenantId === input.tenantId)
      .filter((record) => !input.orgId || record.orgId === input.orgId)
      .filter((record) => !input.status || record.status === input.status)
      .filter((record) => !input.supplierId || record.supplierId === input.supplierId)
      .filter((record) => !input.itemId || record.lines.some((line) => line.itemId === input.itemId))
      .filter((record) => !input.requestNo || record.sourcePurchaseRequestIds.includes(input.requestNo) || record.sourcePurchaseRequestIds.some((id) => id.includes(input.requestNo!)))
      .filter((record) => {
        if (!input.issuedFrom && !input.issuedTo) {
          return true
        }
        const issuedAt = record.issuedAt
        if (!issuedAt) {
          return false
        }
        if (input.issuedFrom && issuedAt < input.issuedFrom) {
          return false
        }
        if (input.issuedTo && issuedAt > input.issuedTo) {
          return false
        }
        return true
      })
      .filter((record) => {
        if (!input.keyword) {
          return true
        }

        const keyword = input.keyword.toLowerCase()
        return (
          record.orderNo.toLowerCase().includes(keyword) ||
          record.supplierSnapshot.supplierDisplayName.toLowerCase().includes(keyword) ||
          record.sourcePurchaseRequestIds.some((id) => id.toLowerCase().includes(keyword))
        )
      })
      .sort((left, right) => left.orderNo.localeCompare(right.orderNo))
      .map((record) => cloneRecord(record))

    const { pageItems, total } = paginate(filtered, page, pageSize)
    return {
      items: pageItems,
      total,
      page,
      pageSize
    }
  }

  async listChanges(input: ListPurchaseOrderChangesInput): Promise<PageResult<PurchaseOrderChangeRecord>> {
    const { page, pageSize } = normalizePageInput(input.page, input.pageSize)
    const record = this.store.purchaseOrders.get(input.purchaseOrderId)
    if (!record || record.tenantId !== input.tenantId) {
      return {
        items: [],
        total: 0,
        page,
        pageSize
      }
    }

    const changes = record.changes.map((change) => cloneRecord(change))
    const { pageItems, total } = paginate(changes, page, pageSize)
    return {
      items: pageItems,
      total,
      page,
      pageSize
    }
  }

  async existsBySourcePurchaseRequestId(tenantId: string, purchaseRequestId: string): Promise<boolean> {
    return [...this.store.purchaseOrders.values()].some(
      (record) => record.tenantId === tenantId && record.sourcePurchaseRequestIds.includes(purchaseRequestId)
    )
  }

  async findBySourcePurchaseRequestId(
    tenantId: string,
    purchaseRequestId: string
  ): Promise<PurchaseOrderRecord[]> {
    return [...this.store.purchaseOrders.values()]
      .filter(
        (record) => record.tenantId === tenantId && record.sourcePurchaseRequestIds.includes(purchaseRequestId)
      )
      .map((record) => cloneRecord(record))
  }
}
