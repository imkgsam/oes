import { Injectable } from '@nestjs/common'
import { normalizePageInput, paginate } from '../../../application/support/procurement-assertions'
import {
  PageResult,
  PurchaseRequestRecord,
  SearchPurchaseRequestsInput,
  cloneRecord
} from '../../../domain/models/procurement-records'
import { PurchaseRequestRepository } from '../../../domain/repositories/purchase-request.repository'
import { ProcurementInMemoryStore } from '../../store/procurement-in-memory-store'

/** InMemoryPurchaseRequestRepository stores PR aggregates in-process for behavior and surface tests. */
@Injectable()
export class InMemoryPurchaseRequestRepository implements PurchaseRequestRepository {
  constructor(private readonly store: ProcurementInMemoryStore) {}

  async nextRequestNo(_tenantId: string): Promise<string> {
    return this.store.nextPurchaseRequestNo()
  }

  async findById(tenantId: string, purchaseRequestId: string): Promise<PurchaseRequestRecord | null> {
    const record = this.store.purchaseRequests.get(purchaseRequestId)
    if (!record || record.tenantId !== tenantId) {
      return null
    }

    return cloneRecord(record)
  }

  async save(record: PurchaseRequestRecord): Promise<PurchaseRequestRecord> {
    const stored = cloneRecord(record)
    this.store.purchaseRequests.set(stored.purchaseRequestId, stored)
    return cloneRecord(stored)
  }

  async search(input: SearchPurchaseRequestsInput): Promise<PageResult<PurchaseRequestRecord>> {
    const { page, pageSize } = normalizePageInput(input.page, input.pageSize)
    const filtered = [...this.store.purchaseRequests.values()]
      .filter((record) => record.tenantId === input.tenantId)
      .filter((record) => !input.orgId || record.orgId === input.orgId)
      .filter((record) => !input.requestType || record.requestType === input.requestType)
      .filter((record) => !input.status || record.status === input.status)
      .filter((record) => !input.requesterOperatorId || record.requester.operatorId === input.requesterOperatorId)
      .filter((record) => !input.itemId || record.lines.some((line) => line.itemId === input.itemId))
      .filter((record) => {
        if (!input.neededByDateFrom && !input.neededByDateTo) {
          return true
        }

        return record.lines.some((line) => {
          const date = line.neededByDate
          if (!date) {
            return false
          }
          if (input.neededByDateFrom && date < input.neededByDateFrom) {
            return false
          }
          if (input.neededByDateTo && date > input.neededByDateTo) {
            return false
          }
          return true
        })
      })
      .filter((record) => {
        if (!input.keyword) {
          return true
        }

        const keyword = input.keyword.toLowerCase()
        return (
          record.requestNo.toLowerCase().includes(keyword) ||
          (record.title ?? '').toLowerCase().includes(keyword) ||
          record.requester.displayName.toLowerCase().includes(keyword)
        )
      })
      .sort((left, right) => left.requestNo.localeCompare(right.requestNo))
      .map((record) => cloneRecord(record))

    const { pageItems, total } = paginate(filtered, page, pageSize)
    return {
      items: pageItems,
      total,
      page,
      pageSize
    }
  }
}
