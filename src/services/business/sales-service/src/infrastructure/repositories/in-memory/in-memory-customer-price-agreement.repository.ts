import { Injectable } from '@nestjs/common'
import {
  CustomerPriceAgreementVersionListInput,
  CustomerPriceAgreementVersionRecord,
  SalesCurrencyCode
} from '../../../domain/models/pricing-records'
import { PageResult, cloneRecord } from '../../../domain/models/sales-records'
import { CustomerPriceAgreementRepository } from '../../../domain/repositories/customer-price-agreement.repository'
import { normalizePageInput, paginate } from '../../../application/support/sales-assertions'
import { SalesInMemoryStore } from '../../store/sales-in-memory-store'

/** InMemoryCustomerPriceAgreementRepository stores versioned agreement records inside the process-local sales skeleton store. */
@Injectable()
export class InMemoryCustomerPriceAgreementRepository implements CustomerPriceAgreementRepository {
  constructor(private readonly store: SalesInMemoryStore) {}

  async findActiveByCustomerCurrency(input: {
    tenantId: string
    customerTenantPartyId: string
    currencyCode: SalesCurrencyCode
  }): Promise<CustomerPriceAgreementVersionRecord | null> {
    const found = [...this.store.customerPriceAgreementVersions.values()]
      .filter(
        (record) =>
          record.tenantId === input.tenantId &&
          record.customerTenantPartyId === input.customerTenantPartyId &&
          record.currencyCode === input.currencyCode &&
          record.status === 'ACTIVE'
      )
      .sort((left, right) => right.versionNo - left.versionNo)[0]

    return found ? cloneRecord(found) : null
  }

  async findHeadByCustomerCurrency(input: {
    tenantId: string
    customerTenantPartyId: string
    currencyCode: SalesCurrencyCode
  }): Promise<CustomerPriceAgreementVersionRecord | null> {
    const versions = [...this.store.customerPriceAgreementVersions.values()]
      .filter(
        (record) =>
          record.tenantId === input.tenantId &&
          record.customerTenantPartyId === input.customerTenantPartyId &&
          record.currencyCode === input.currencyCode
      )
      .sort((left, right) => right.versionNo - left.versionNo)

    const draft = versions.find((record) => record.status === 'DRAFT')
    const active = versions.find((record) => record.status === 'ACTIVE')
    const head = draft ?? active ?? versions[0]
    return head ? cloneRecord(head) : null
  }

  async findHeadVersion(
    tenantId: string,
    customerPriceAgreementId: string
  ): Promise<CustomerPriceAgreementVersionRecord | null> {
    const versions = [...this.store.customerPriceAgreementVersions.values()]
      .filter((record) => record.tenantId === tenantId && record.customerPriceAgreementId === customerPriceAgreementId)
      .sort((left, right) => right.versionNo - left.versionNo)

    const draft = versions.find((record) => record.status === 'DRAFT')
    const active = versions.find((record) => record.status === 'ACTIVE')
    const head = draft ?? active ?? versions[0]
    return head ? cloneRecord(head) : null
  }

  async findVersion(
    tenantId: string,
    customerPriceAgreementId: string,
    versionNo: number
  ): Promise<CustomerPriceAgreementVersionRecord | null> {
    const found = [...this.store.customerPriceAgreementVersions.values()].find(
      (record) =>
        record.tenantId === tenantId &&
        record.customerPriceAgreementId === customerPriceAgreementId &&
        record.versionNo === versionNo
    )
    return found ? cloneRecord(found) : null
  }

  async saveVersion(
    record: CustomerPriceAgreementVersionRecord
  ): Promise<CustomerPriceAgreementVersionRecord> {
    this.store.customerPriceAgreementVersions.set(record.id, cloneRecord(record))
    return cloneRecord(record)
  }

  async listVersions(
    input: CustomerPriceAgreementVersionListInput
  ): Promise<PageResult<CustomerPriceAgreementVersionRecord>> {
    const { page, pageSize } = normalizePageInput(input.page, input.pageSize)
    const filtered = [...this.store.customerPriceAgreementVersions.values()]
      .filter(
        (record) =>
          record.tenantId === input.tenantId &&
          record.customerPriceAgreementId === input.customerPriceAgreementId
      )
      .sort((left, right) => left.versionNo - right.versionNo)
    const { pageItems, total } = paginate(filtered, page, pageSize)
    return {
      items: pageItems.map((item) => cloneRecord(item)),
      total,
      page,
      pageSize
    }
  }
}
