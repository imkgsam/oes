import { Injectable } from '@nestjs/common'
import {
  cloneRecord,
  SupplierAddressRecord
} from '../../../domain/models/srm-records'
import { SupplierAddressRepository } from '../../../domain/repositories/supplier-address.repository'
import { SrmInMemoryStore } from '../../store/srm-in-memory-store'

/** InMemorySupplierAddressRepository stores SRM business-address records inside the process-local runtime store. */
@Injectable()
export class InMemorySupplierAddressRepository implements SupplierAddressRepository {
  constructor(private readonly store: SrmInMemoryStore) {}

  async findById(
    tenantId: string,
    supplierId: string,
    supplierAddressId: string
  ): Promise<SupplierAddressRecord | null> {
    const address = this.store.supplierAddresses.get(supplierAddressId)
    if (!address || address.tenantId !== tenantId || address.supplierId !== supplierId) {
      return null
    }

    return cloneRecord(address)
  }

  async save(address: SupplierAddressRecord): Promise<SupplierAddressRecord> {
    const stored = cloneRecord(address)
    this.store.supplierAddresses.set(stored.supplierAddressId, stored)
    return cloneRecord(stored)
  }

  async listBySupplierProfileId(tenantId: string, supplierId: string): Promise<SupplierAddressRecord[]> {
    return [...this.store.supplierAddresses.values()]
      .filter((address) => address.tenantId === tenantId && address.supplierId === supplierId)
      .sort((left, right) => left.label.localeCompare(right.label))
      .map((address) => cloneRecord(address))
  }
}
