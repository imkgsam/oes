import { Injectable } from '@nestjs/common'
import { paginate } from '../../../application/support/srm-assertions'
import {
  cloneRecord,
  PageResult,
  SupplierOfferingRecord,
  SupplierOfferingStatus
} from '../../../domain/models/srm-records'
import { SupplierOfferingRepository } from '../../../domain/repositories/supplier-offering.repository'
import { SrmInMemoryStore } from '../../store/srm-in-memory-store'

/** InMemorySupplierOfferingRepository stores current supplyability facts inside the process-local SRM store. */
@Injectable()
export class InMemorySupplierOfferingRepository implements SupplierOfferingRepository {
  constructor(private readonly store: SrmInMemoryStore) {}

  async findById(tenantId: string, supplierOfferingId: string): Promise<SupplierOfferingRecord | null> {
    const offering = this.store.supplierOfferings.get(supplierOfferingId)
    if (!offering || offering.tenantId !== tenantId) {
      return null
    }

    return cloneRecord(offering)
  }

  async findBySupplierAndItem(
    tenantId: string,
    supplierId: string,
    itemId: string
  ): Promise<SupplierOfferingRecord | null> {
    const offering = [...this.store.supplierOfferings.values()].find(
      (candidate) =>
        candidate.tenantId === tenantId &&
        candidate.supplierId === supplierId &&
        candidate.itemId === itemId
    )

    return offering ? cloneRecord(offering) : null
  }

  async save(offering: SupplierOfferingRecord): Promise<SupplierOfferingRecord> {
    const stored = cloneRecord(offering)
    this.store.supplierOfferings.set(stored.supplierOfferingId, stored)
    return cloneRecord(stored)
  }

  async listBySupplierId(
    tenantId: string,
    supplierId: string,
    status?: SupplierOfferingStatus,
    page = 1,
    pageSize = 20
  ): Promise<PageResult<SupplierOfferingRecord>> {
    const filtered = [...this.store.supplierOfferings.values()]
      .filter((offering) => offering.tenantId === tenantId && offering.supplierId === supplierId)
      .filter((offering) => !status || offering.status === status)
      .sort((left, right) => left.itemId.localeCompare(right.itemId))
      .map((offering) => cloneRecord(offering))

    const { pageItems, total } = paginate(filtered, page, pageSize)
    return {
      items: pageItems,
      total,
      page,
      pageSize
    }
  }

  async listByItemId(
    tenantId: string,
    itemId: string,
    status?: SupplierOfferingStatus,
    page = 1,
    pageSize = 20
  ): Promise<PageResult<SupplierOfferingRecord>> {
    const filtered = [...this.store.supplierOfferings.values()]
      .filter((offering) => offering.tenantId === tenantId && offering.itemId === itemId)
      .filter((offering) => !status || offering.status === status)
      .sort((left, right) => left.supplierId.localeCompare(right.supplierId))
      .map((offering) => cloneRecord(offering))

    const { pageItems, total } = paginate(filtered, page, pageSize)
    return {
      items: pageItems,
      total,
      page,
      pageSize
    }
  }

  async hasActiveBySupplierId(tenantId: string, supplierId: string): Promise<boolean> {
    return [...this.store.supplierOfferings.values()].some(
      (offering) =>
        offering.tenantId === tenantId &&
        offering.supplierId === supplierId &&
        offering.status === SupplierOfferingStatus.ACTIVE
    )
  }
}
