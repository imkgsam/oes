import { Injectable } from '@nestjs/common'
import {
  cloneRecord,
  CustomerContactRecord
} from '../../../domain/models/crm-records'
import { CustomerContactRepository } from '../../../domain/repositories/customer-contact.repository'
import { CrmInMemoryStore } from '../../store/crm-in-memory-store'

/** InMemoryCustomerContactRepository stores CRM business-contact records inside the process-local runtime store. */
@Injectable()
export class InMemoryCustomerContactRepository implements CustomerContactRepository {
  constructor(private readonly store: CrmInMemoryStore) {}

  async findById(
    tenantId: string,
    customerAccountId: string,
    customerContactId: string
  ): Promise<CustomerContactRecord | null> {
    const contact = this.store.customerContacts.get(customerContactId)
    if (!contact || contact.tenantId !== tenantId || contact.customerAccountId !== customerAccountId) {
      return null
    }

    return cloneRecord(contact)
  }

  async save(contact: CustomerContactRecord): Promise<CustomerContactRecord> {
    const stored = cloneRecord(contact)
    this.store.customerContacts.set(stored.customerContactId, stored)
    return cloneRecord(stored)
  }

  async listByCustomerAccountId(tenantId: string, customerAccountId: string): Promise<CustomerContactRecord[]> {
    return [...this.store.customerContacts.values()]
      .filter((contact) => contact.tenantId === tenantId && contact.customerAccountId === customerAccountId)
      .sort((left, right) => left.displayName.localeCompare(right.displayName))
      .map((contact) => cloneRecord(contact))
  }
}
