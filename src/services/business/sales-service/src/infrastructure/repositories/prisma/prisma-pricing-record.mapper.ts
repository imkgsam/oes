import {
  CustomerPriceAgreementStatus as PrismaCustomerPriceAgreementStatus,
  PriceListStatus as PrismaPriceListStatus,
  PriceListType as PrismaPriceListType,
  Prisma
} from '../../../../prisma/generated/prisma'
import {
  CustomerPriceAgreementVersionRecord,
  MoqSnapshot,
  PriceListRecord,
  PriceSnapshot
} from '../../../domain/models/pricing-records'

const priceListInclude = {
  lines: {
    orderBy: {
      lineNo: 'asc'
    }
  }
} satisfies Prisma.SalesPriceListInclude

const customerPriceAgreementVersionInclude = {
  lines: {
    orderBy: {
      lineNo: 'asc'
    }
  }
} satisfies Prisma.SalesCustomerPriceAgreementVersionInclude

export type SalesPriceListWithLines = Prisma.SalesPriceListGetPayload<{
  include: typeof priceListInclude
}>

export type SalesCustomerPriceAgreementVersionWithLines = Prisma.SalesCustomerPriceAgreementVersionGetPayload<{
  include: typeof customerPriceAgreementVersionInclude
}>

/** PrismaPricingRecordMapper translates Prisma pricing rows into the frozen sales pricing domain record shapes. */
export class PrismaPricingRecordMapper {
  static priceListIncludeValue(): typeof priceListInclude {
    return priceListInclude
  }

  static customerPriceAgreementVersionIncludeValue(): typeof customerPriceAgreementVersionInclude {
    return customerPriceAgreementVersionInclude
  }

  static toPriceList(record: SalesPriceListWithLines): PriceListRecord {
    return {
      id: record.id,
      tenantId: record.tenantId,
      priceListName: record.priceListName,
      priceListType:
        record.priceListType === PrismaPriceListType.ACTIVITY
          ? 'ACTIVITY'
          : record.priceListType === PrismaPriceListType.EXHIBITION
            ? 'EXHIBITION'
            : 'STANDARD',
      status:
        record.status === PrismaPriceListStatus.ACTIVE
          ? 'ACTIVE'
          : record.status === PrismaPriceListStatus.INACTIVE
            ? 'INACTIVE'
            : 'DRAFT',
      currencyCode: record.currencyCode as 'USD' | 'CNY',
      effectiveFrom: record.effectiveFrom.toISOString(),
      effectiveTo: record.effectiveTo?.toISOString() ?? null,
      lines: record.lines.map((line) => ({
        priceListLineId: line.id,
        lineNo: line.lineNo,
        itemId: line.itemId,
        brandKey: line.brandKey ?? '',
        priceSnapshot: this.fromJson<PriceSnapshot>(line.priceSnapshot),
        moqSnapshot: this.fromJson<MoqSnapshot>(line.moqSnapshot)
      }))
    }
  }

  static toCustomerPriceAgreementVersion(
    record: SalesCustomerPriceAgreementVersionWithLines
  ): CustomerPriceAgreementVersionRecord {
    return {
      id: record.id,
      customerPriceAgreementId: record.customerPriceAgreementId,
      tenantId: record.tenantId,
      customerTenantPartyId: record.customerTenantPartyId,
      currencyCode: record.currencyCode as 'USD' | 'CNY',
      versionNo: record.versionNo,
      status:
        record.status === PrismaCustomerPriceAgreementStatus.ACTIVE
          ? 'ACTIVE'
          : record.status === PrismaCustomerPriceAgreementStatus.SUPERSEDED
            ? 'SUPERSEDED'
            : 'DRAFT',
      publishedAt: record.publishedAt?.toISOString() ?? null,
      lines: record.lines.map((line) => ({
        customerPriceAgreementLineId: line.id,
        lineNo: line.lineNo,
        itemId: line.itemId,
        brandKey: line.brandKey ?? '',
        priceSnapshot: this.fromJson<PriceSnapshot>(line.priceSnapshot),
        moqSnapshot: this.fromJson<MoqSnapshot>(line.moqSnapshot)
      }))
    }
  }

  static toPersistedPriceListType(value: PriceListRecord['priceListType']): PrismaPriceListType {
    if (value === 'ACTIVITY') {
      return PrismaPriceListType.ACTIVITY
    }
    if (value === 'EXHIBITION') {
      return PrismaPriceListType.EXHIBITION
    }
    return PrismaPriceListType.STANDARD
  }

  static toPersistedPriceListStatus(value: PriceListRecord['status']): PrismaPriceListStatus {
    if (value === 'ACTIVE') {
      return PrismaPriceListStatus.ACTIVE
    }
    if (value === 'INACTIVE') {
      return PrismaPriceListStatus.INACTIVE
    }
    return PrismaPriceListStatus.DRAFT
  }

  static toPersistedAgreementStatus(
    value: CustomerPriceAgreementVersionRecord['status']
  ): PrismaCustomerPriceAgreementStatus {
    if (value === 'ACTIVE') {
      return PrismaCustomerPriceAgreementStatus.ACTIVE
    }
    if (value === 'SUPERSEDED') {
      return PrismaCustomerPriceAgreementStatus.SUPERSEDED
    }
    return PrismaCustomerPriceAgreementStatus.DRAFT
  }

  static toInputJson(value: unknown): Prisma.InputJsonValue {
    return structuredClone(value) as Prisma.InputJsonValue
  }

  private static fromJson<T>(value: Prisma.JsonValue): T {
    return structuredClone(value) as T
  }
}
