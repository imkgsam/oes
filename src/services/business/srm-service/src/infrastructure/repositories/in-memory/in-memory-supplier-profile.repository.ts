import { Injectable } from '@nestjs/common'
import { paginate } from '../../../application/support/srm-assertions'
import {
  cloneRecord,
  SupplierProfileRecord,
  SupplierStatus,
  PageResult,
  SearchSuppliersInput
} from '../../../domain/models/srm-records'
import { SupplierProfileRepository } from '../../../domain/repositories/supplier-profile.repository'
import { SrmInMemoryStore } from '../../store/srm-in-memory-store'

/** InMemorySupplierProfileRepository stores current SRM supplier-profile aggregates inside the process-local store. */
@Injectable()
export class InMemorySupplierProfileRepository implements SupplierProfileRepository {
  constructor(private readonly store: SrmInMemoryStore) {}

  async nextSupplierProfileNo(_tenantId: string): Promise<string> {
    return this.store.nextSupplierProfileNo()
  }

  async findById(tenantId: string, supplierId: string): Promise<SupplierProfileRecord | null> {
    const profile = this.store.supplierProfiles.get(supplierId)
    if (!profile || profile.tenantId !== tenantId) {
      return null
    }

    return cloneRecord(profile)
  }

  async findByTenantPartyId(tenantId: string, tenantPartyId: string): Promise<SupplierProfileRecord | null> {
    const match = [...this.store.supplierProfiles.values()].find(
      (profile) =>
        profile.tenantId === tenantId &&
        profile.partyBinding?.tenantPartyId === tenantPartyId
    )

    return match ? cloneRecord(match) : null
  }

  async save(profile: SupplierProfileRecord): Promise<SupplierProfileRecord> {
    const stored = cloneRecord(profile)
    this.store.supplierProfiles.set(stored.id, stored)
    return cloneRecord(stored)
  }

  async search(input: SearchSuppliersInput): Promise<PageResult<SupplierProfileRecord>> {
    const page = input.page ?? 1
    const pageSize = input.pageSize ?? 20
    const filtered = [...this.store.supplierProfiles.values()]
      .filter((profile) => profile.tenantId === input.tenantId)
      .filter((profile) => !input.status || profile.status === input.status)
      .filter((profile) => !input.tenantPartyId || profile.partyBinding?.tenantPartyId === input.tenantPartyId)
      .filter((profile) => matchesKeyword(profile, input.keyword))
      .sort((left, right) => left.supplierNo.localeCompare(right.supplierNo))
      .map((profile) => cloneRecord(profile))

    const { pageItems, total } = paginate(filtered, page, pageSize)
    return {
      items: pageItems,
      total,
      page,
      pageSize
    }
  }
}

/** matchesKeyword applies the frozen phase 1 supplier-number, display-name, and binding-summary search rule. */
function matchesKeyword(profile: SupplierProfileRecord, keyword?: string): boolean {
  if (!keyword) {
    return true
  }

  const normalized = keyword.toLowerCase()
  return (
    profile.supplierNo.toLowerCase().includes(normalized) ||
    profile.displayName.toLowerCase().includes(normalized) ||
    profile.partyBinding?.partyDisplayName?.toLowerCase().includes(normalized) === true
  )
}
