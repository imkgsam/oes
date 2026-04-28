import { Injectable } from '@nestjs/common'
import {
  cloneRecord,
  CustomerAddressRecord
} from '../../../domain/models/crm-records'
import { CustomerAddressRepository } from '../../../domain/repositories/customer-address.repository'
import { CrmInMemoryStore } from '../../store/crm-in-memory-store'

/** InMemoryCustomerAddressRepository stores CRM business-address records inside the process-local runtime store. */
@Injectable()
export class InMemoryCustomerAddressRepository implements CustomerAddressRepository {
  constructor(private readonly store: CrmInMemoryStore) {}

  async findById(
    tenantId: string,
    customerAccountId: string,
    customerAddressId: string
  ): Promise<CustomerAddressRecord | null> {
    const address = this.store.customerAddresses.get(customerAddressId)
    if (!address || address.tenantId !== tenantId || address.customerAccountId !== customerAccountId) {
      return null
    }

    return cloneRecord(address)
  }

  async save(address: CustomerAddressRecord): Promise<CustomerAddressRecord> {
    const stored = cloneRecord(address)
    this.store.customerAddresses.set(stored.customerAddressId, stored)
    return cloneRecord(stored)
  }

  async listByCustomerAccountId(tenantId: string, customerAccountId: string): Promise<CustomerAddressRecord[]> {
    return [...this.store.customerAddresses.values()]
      .filter((address) => address.tenantId === tenantId && address.customerAccountId === customerAccountId)
      .sort((left, right) => left.label.localeCompare(right.label))
      .map((address) => cloneRecord(address))
  }
}
