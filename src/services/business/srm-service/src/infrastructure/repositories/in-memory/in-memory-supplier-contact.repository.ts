import { Injectable } from '@nestjs/common'
import {
  cloneRecord,
  SupplierContactRecord
} from '../../../domain/models/srm-records'
import { SupplierContactRepository } from '../../../domain/repositories/supplier-contact.repository'
import { SrmInMemoryStore } from '../../store/srm-in-memory-store'

/** InMemorySupplierContactRepository stores SRM business-contact records inside the process-local runtime store. */
@Injectable()
export class InMemorySupplierContactRepository implements SupplierContactRepository {
  constructor(private readonly store: SrmInMemoryStore) {}

  async findById(
    tenantId: string,
    supplierId: string,
    supplierContactId: string
  ): Promise<SupplierContactRecord | null> {
    const contact = this.store.supplierContacts.get(supplierContactId)
    if (!contact || contact.tenantId !== tenantId || contact.supplierId !== supplierId) {
      return null
    }

    return cloneRecord(contact)
  }

  async save(contact: SupplierContactRecord): Promise<SupplierContactRecord> {
    const stored = cloneRecord(contact)
    this.store.supplierContacts.set(stored.supplierContactId, stored)
    return cloneRecord(stored)
  }

  async listBySupplierProfileId(tenantId: string, supplierId: string): Promise<SupplierContactRecord[]> {
    return [...this.store.supplierContacts.values()]
      .filter((contact) => contact.tenantId === tenantId && contact.supplierId === supplierId)
      .sort((left, right) => left.displayName.localeCompare(right.displayName))
      .map((contact) => cloneRecord(contact))
  }
}
