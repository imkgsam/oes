import { PageResult } from '../models/sales-records'
import {
  CustomerPriceAgreementVersionListInput,
  CustomerPriceAgreementVersionRecord,
  SalesCurrencyCode
} from '../models/pricing-records'

/** CustomerPriceAgreementRepository persists versioned customer-specific pricing baselines inside sales-service. */
export interface CustomerPriceAgreementRepository {
  findActiveByCustomerCurrency(input: {
    tenantId: string
    customerTenantPartyId: string
    currencyCode: SalesCurrencyCode
  }): Promise<CustomerPriceAgreementVersionRecord | null>
  findHeadByCustomerCurrency(input: {
    tenantId: string
    customerTenantPartyId: string
    currencyCode: SalesCurrencyCode
  }): Promise<CustomerPriceAgreementVersionRecord | null>
  findHeadVersion(
    tenantId: string,
    customerPriceAgreementId: string
  ): Promise<CustomerPriceAgreementVersionRecord | null>
  findVersion(
    tenantId: string,
    customerPriceAgreementId: string,
    versionNo: number
  ): Promise<CustomerPriceAgreementVersionRecord | null>
  saveVersion(record: CustomerPriceAgreementVersionRecord): Promise<CustomerPriceAgreementVersionRecord>
  listVersions(
    input: CustomerPriceAgreementVersionListInput
  ): Promise<PageResult<CustomerPriceAgreementVersionRecord>>
}
