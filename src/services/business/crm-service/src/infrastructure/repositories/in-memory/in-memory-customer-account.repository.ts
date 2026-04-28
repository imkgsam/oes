import { Injectable } from '@nestjs/common'
import { paginate } from '../../../application/support/crm-assertions'
import {
  cloneRecord,
  CustomerAccountRecord,
  CustomerStatus,
  PageResult,
  SearchCustomerAccountsInput,
  SearchSelectableCustomersInput,
  SelectableCustomerRecord
} from '../../../domain/models/crm-records'
import { CustomerAccountRepository } from '../../../domain/repositories/customer-account.repository'
import { CrmInMemoryStore } from '../../store/crm-in-memory-store'

/** InMemoryCustomerAccountRepository stores current CRM customer-account aggregates inside the process-local store. */
@Injectable()
export class InMemoryCustomerAccountRepository implements CustomerAccountRepository {
  constructor(private readonly store: CrmInMemoryStore) {}

  async nextCustomerAccountNo(_tenantId: string): Promise<string> {
    return this.store.nextCustomerAccountNo()
  }

  async findById(tenantId: string, customerAccountId: string): Promise<CustomerAccountRecord | null> {
    const account = this.store.customerAccounts.get(customerAccountId)
    if (!account || account.tenantId !== tenantId) {
      return null
    }

    return cloneRecord(account)
  }

  async findActiveByTenantPartyId(tenantId: string, tenantPartyId: string): Promise<CustomerAccountRecord | null> {
    const match = [...this.store.customerAccounts.values()].find(
      (account) =>
        account.tenantId === tenantId &&
        account.status === CustomerStatus.ACTIVE_CUSTOMER &&
        account.primaryBinding?.tenantPartyId === tenantPartyId
    )

    return match ? cloneRecord(match) : null
  }

  async save(account: CustomerAccountRecord): Promise<CustomerAccountRecord> {
    const stored = cloneRecord(account)
    this.store.customerAccounts.set(stored.id, stored)
    return cloneRecord(stored)
  }

  async search(input: SearchCustomerAccountsInput): Promise<PageResult<CustomerAccountRecord>> {
    const page = input.page ?? 1
    const pageSize = input.pageSize ?? 20
    const filtered = [...this.store.customerAccounts.values()]
      .filter((account) => account.tenantId === input.tenantId)
      .filter((account) => !input.status || account.status === input.status)
      .filter((account) => !input.primaryTenantPartyId || account.primaryBinding?.tenantPartyId === input.primaryTenantPartyId)
      .filter((account) => matchesKeyword(account, input.keyword))
      .sort((left, right) => left.customerAccountNo.localeCompare(right.customerAccountNo))
      .map((account) => cloneRecord(account))

    const { pageItems, total } = paginate(filtered, page, pageSize)
    return {
      items: pageItems,
      total,
      page,
      pageSize
    }
  }

  async searchSelectable(input: SearchSelectableCustomersInput): Promise<PageResult<SelectableCustomerRecord>> {
    const page = input.page ?? 1
    const pageSize = input.pageSize ?? 20
    const filtered = [...this.store.customerAccounts.values()]
      .filter((account) => account.tenantId === input.tenantId)
      .filter((account) => account.status === CustomerStatus.ACTIVE_CUSTOMER)
      .filter((account) => Boolean(account.primaryBinding))
      .filter((account) => matchesKeyword(account, input.keyword))
      .sort((left, right) => left.customerAccountNo.localeCompare(right.customerAccountNo))
      .map((account) => ({
        customerAccountId: account.id,
        customerAccountNo: account.customerAccountNo,
        displayName: account.displayName,
        status: account.status,
        primaryTenantPartyId: account.primaryBinding!.tenantPartyId,
        primaryPartyDisplayName: account.primaryBinding?.partyDisplayName ?? null
      }))

    const { pageItems, total } = paginate(filtered, page, pageSize)
    return {
      items: cloneRecord(pageItems),
      total,
      page,
      pageSize
    }
  }
}

/** matchesKeyword applies the frozen phase 1 account-number, display-name, and primary-binding summary search rule. */
function matchesKeyword(account: CustomerAccountRecord, keyword?: string): boolean {
  if (!keyword) {
    return true
  }

  const normalized = keyword.toLowerCase()
  return (
    account.customerAccountNo.toLowerCase().includes(normalized) ||
    account.displayName.toLowerCase().includes(normalized) ||
    account.primaryBinding?.partyDisplayName?.toLowerCase().includes(normalized) === true
  )
}
