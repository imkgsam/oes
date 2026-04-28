import {
  Prisma,
  SalesFulfillmentHandoffStatus as PrismaSalesFulfillmentHandoffStatus,
  SalesQuoteStatus as PrismaSalesQuoteStatus
} from '../../../../prisma/generated/prisma'
import {
  CommercialGateSummary,
  CustomerItemSnapshot,
  FulfillmentHandoffSummary,
  ItemSnapshot,
  PackagingRequirementSnapshot,
  PriceQuantityDeliverySnapshot,
  QuoteLineRecord,
  QuoteRecord,
  QuoteVersionRecord,
  SalesConfigSnapshot,
  SalesFulfillmentHandoffStatus,
  SalesOrderLineRecord,
  SalesOrderRecord,
  SalesQuoteStatus
} from '../../../domain/models/sales-records'

const quoteInclude = {
  lines: {
    orderBy: {
      lineNo: 'asc'
    }
  }
} satisfies Prisma.SalesQuoteInclude

const quoteVersionInclude = {
  lines: {
    orderBy: {
      lineNo: 'asc'
    }
  }
} satisfies Prisma.SalesQuoteVersionInclude

const salesOrderInclude = {
  lines: {
    orderBy: {
      lineNo: 'asc'
    }
  },
  commercialGateSummary: true,
  fulfillmentHandoffSummary: true
} satisfies Prisma.SalesOrderInclude

export type SalesQuoteWithLines = Prisma.SalesQuoteGetPayload<{
  include: typeof quoteInclude
}>

export type SalesQuoteVersionWithLines = Prisma.SalesQuoteVersionGetPayload<{
  include: typeof quoteVersionInclude
}>

export type SalesOrderWithChildren = Prisma.SalesOrderGetPayload<{
  include: typeof salesOrderInclude
}>

/** PrismaSalesRecordMapper translates Prisma sales persistence rows into the frozen phase 1 record shapes. */
export class PrismaSalesRecordMapper {
  /** quoteIncludeValue exposes the canonical include graph for quote repository round-trips. */
  static quoteIncludeValue(): typeof quoteInclude {
    return quoteInclude
  }

  /** quoteVersionIncludeValue exposes the canonical include graph for quote version repository reads. */
  static quoteVersionIncludeValue(): typeof quoteVersionInclude {
    return quoteVersionInclude
  }

  /** salesOrderIncludeValue exposes the canonical include graph for sales order repository reads. */
  static salesOrderIncludeValue(): typeof salesOrderInclude {
    return salesOrderInclude
  }

  /** toQuote converts one persisted quote and its lines into the domain query and command record shape. */
  static toQuote(record: SalesQuoteWithLines): QuoteRecord {
    return {
      id: record.id,
      quoteNo: record.quoteNo,
      tenantId: record.tenantId,
      customerTenantPartyId: record.customerTenantPartyId,
      opportunityRef: record.opportunityId && record.opportunityNo && record.opportunityName
        ? {
            opportunityId: record.opportunityId,
            opportunityNo: record.opportunityNo,
            opportunityName: record.opportunityName
          }
        : null,
      status: record.status === PrismaSalesQuoteStatus.PUBLISHED
        ? SalesQuoteStatus.PUBLISHED
        : SalesQuoteStatus.DRAFT,
      latestPublishedVersionId: record.latestPublishedVersionId,
      lines: record.lines.map((line) => this.toQuoteLine(line))
    }
  }

  /** toQuoteVersion converts one persisted quote version and its lines into the immutable published record shape. */
  static toQuoteVersion(record: SalesQuoteVersionWithLines): QuoteVersionRecord {
    return {
      id: record.id,
      quoteId: record.quoteId,
      quoteNo: record.quoteNo,
      versionNo: record.versionNo,
      tenantId: record.tenantId,
      customerTenantPartyId: record.customerTenantPartyId,
      publishedAt: record.publishedAt.toISOString(),
      lines: record.lines.map((line) => this.toQuoteLine(line))
    }
  }

  /** toSalesOrder converts one persisted order graph into the phase 1 established order record shape. */
  static toSalesOrder(record: SalesOrderWithChildren): SalesOrderRecord {
    return {
      id: record.id,
      salesOrderNo: record.salesOrderNo,
      tenantId: record.tenantId,
      customerTenantPartyId: record.customerTenantPartyId,
      quoteId: record.quoteId,
      quoteVersionId: record.quoteVersionId,
      commercialGateSummary: this.toCommercialGateSummary(record.commercialGateSummary),
      fulfillmentHandoffStatus: this.toFulfillmentHandoffSummary(record.fulfillmentHandoffSummary),
      lines: record.lines.map((line) => this.toSalesOrderLine(line))
    }
  }

  /** toPersistedQuoteStatus converts the domain quote status enum into the Prisma enum value. */
  static toPersistedQuoteStatus(status: SalesQuoteStatus): PrismaSalesQuoteStatus {
    return status === SalesQuoteStatus.PUBLISHED
      ? PrismaSalesQuoteStatus.PUBLISHED
      : PrismaSalesQuoteStatus.DRAFT
  }

  /** toPersistedHandoffStatus converts the domain handoff status enum into the Prisma enum value. */
  static toPersistedHandoffStatus(
    status: SalesFulfillmentHandoffStatus
  ): PrismaSalesFulfillmentHandoffStatus {
    return status === SalesFulfillmentHandoffStatus.SUBMITTED
      ? PrismaSalesFulfillmentHandoffStatus.SUBMITTED
      : PrismaSalesFulfillmentHandoffStatus.NOT_SUBMITTED
  }

  /** toInputJson deep-clones a plain snapshot object into a Prisma JSON input payload. */
  static toInputJson(value: unknown): Prisma.InputJsonValue {
    return structuredClone(value) as Prisma.InputJsonValue
  }

  /** toQuoteLine converts one persisted quote-style line row into the shared quote line record shape. */
  private static toQuoteLine(
    line:
      | SalesQuoteWithLines['lines'][number]
      | SalesQuoteVersionWithLines['lines'][number]
  ): QuoteLineRecord {
    return {
      quoteLineId: line.id,
      lineNo: line.lineNo,
      itemId: line.itemId,
      itemSnapshot: this.fromJson<ItemSnapshot>(line.itemSnapshot),
      salesConfigSnapshot: this.fromJson<SalesConfigSnapshot>(line.salesConfigSnapshot),
      packagingRequirementSnapshot: this.fromJson<PackagingRequirementSnapshot>(
        line.packagingRequirementSnapshot
      ),
      priceQuantityDeliverySnapshot: this.fromJson<PriceQuantityDeliverySnapshot>(
        line.priceQuantityDeliverySnapshot
      ),
      customerItemSnapshot: this.fromJson<CustomerItemSnapshot>(line.customerItemSnapshot)
    }
  }

  /** toSalesOrderLine converts one persisted order line row into the frozen order line record shape. */
  private static toSalesOrderLine(line: SalesOrderWithChildren['lines'][number]): SalesOrderLineRecord {
    return {
      salesOrderLineId: line.id,
      lineNo: line.lineNo,
      itemId: line.itemId,
      itemSnapshot: this.fromJson<ItemSnapshot>(line.itemSnapshot),
      salesConfigSnapshot: this.fromJson<SalesConfigSnapshot>(line.salesConfigSnapshot),
      packagingRequirementSnapshot: this.fromJson<PackagingRequirementSnapshot>(
        line.packagingRequirementSnapshot
      ),
      priceQuantityDeliverySnapshot: this.fromJson<PriceQuantityDeliverySnapshot>(
        line.priceQuantityDeliverySnapshot
      ),
      customerItemSnapshot: this.fromJson<CustomerItemSnapshot>(line.customerItemSnapshot)
    }
  }

  /** toCommercialGateSummary converts the 1:1 gate summary row into the domain gate summary shape. */
  private static toCommercialGateSummary(
    record: SalesOrderWithChildren['commercialGateSummary']
  ): CommercialGateSummary {
    return {
      orderEstablished: record?.orderEstablished ?? false,
      productionGate: record?.productionGate ?? false,
      stockingGate: record?.stockingGate ?? false,
      shippingGate: record?.shippingGate ?? false
    }
  }

  /** toFulfillmentHandoffSummary converts the 1:1 handoff summary row into the domain handoff shape. */
  private static toFulfillmentHandoffSummary(
    record: SalesOrderWithChildren['fulfillmentHandoffSummary']
  ): FulfillmentHandoffSummary {
    return {
      status: record?.status === PrismaSalesFulfillmentHandoffStatus.SUBMITTED
        ? SalesFulfillmentHandoffStatus.SUBMITTED
        : SalesFulfillmentHandoffStatus.NOT_SUBMITTED,
      submittedAt: record?.submittedAt?.toISOString() ?? null
    }
  }

  /** fromJson casts one stored JSON payload back into the snapshot shape used by the domain records. */
  private static fromJson<T>(value: Prisma.JsonValue): T {
    return structuredClone(value) as T
  }
}
