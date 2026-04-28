import {
  CommercialGateName,
  CommercialGateSummary,
  ConvertQuoteVersionToOrderResponse,
  CreateQuoteResponse,
  FulfillmentHandoffStatusCode,
  FulfillmentHandoffSummary,
  GetQuoteResponse,
  GetQuoteVersionResponse,
  GetSalesOrderResponse,
  ListQuoteVersionsResponse,
  PackagingRequirementSnapshot as ProtoPackagingRequirementSnapshot,
  PriceQuantityDeliverySnapshot as ProtoPriceQuantityDeliverySnapshot,
  PublishQuoteResponse,
  Quote,
  QuoteLine,
  QuoteStatus,
  QuoteVersion,
  SalesConfigSnapshot as ProtoSalesConfigSnapshot,
  SalesOrder,
  SalesOrderLine,
  SearchQuotesResponse,
  SearchSalesOrdersResponse,
  SetOrderCommercialGateResponse,
  SubmitFulfillmentHandoffResponse
} from '@oes/common/generated/sales_service'
import {
  CustomerItemSnapshot,
  FulfillmentHandoffSummary as DomainFulfillmentHandoffSummary,
  ItemSnapshot,
  PackagingRequirementSnapshot,
  PriceQuantityDeliverySnapshot,
  QuoteLineRecord,
  QuoteRecord,
  QuoteVersionRecord,
  SalesConfigSnapshot,
  SalesFulfillmentHandoffStatus,
  SalesOrderRecord,
  SalesQuoteStatus
} from '../../domain/models/sales-records'
import { ListQuoteVersionsResult } from '../../application/queries/list-quote-versions.handler'
import { PublishQuoteResult } from '../../application/commands/publish-quote.handler'
import { SearchQuotesResult } from '../../application/queries/search-quotes.handler'
import { SearchSalesOrdersResult } from '../../application/queries/search-sales-orders.handler'

/** SalesGrpcPresenter maps sales domain records into the frozen phase 1 gRPC response shapes. */
export class SalesGrpcPresenter {
  /** toQuote renders one current quote draft carrier into the query and management response shape. */
  static toQuote(quote: QuoteRecord): Quote {
    return {
      quoteId: quote.id,
      quoteNo: quote.quoteNo,
      tenantId: quote.tenantId,
      customerTenantPartyId: quote.customerTenantPartyId,
      opportunityRef: quote.opportunityRef
        ? {
            opportunityId: quote.opportunityRef.opportunityId,
            opportunityNo: quote.opportunityRef.opportunityNo,
            opportunityName: quote.opportunityRef.opportunityName
          }
        : undefined,
      status: quote.status === SalesQuoteStatus.PUBLISHED ? QuoteStatus.QUOTE_STATUS_PUBLISHED : QuoteStatus.QUOTE_STATUS_DRAFT,
      latestPublishedVersionId: quote.latestPublishedVersionId ?? '',
      lines: quote.lines.map((line) => this.toQuoteLine(line))
    }
  }

  /** toQuoteVersion renders one immutable published quote version record. */
  static toQuoteVersion(quoteVersion: QuoteVersionRecord): QuoteVersion {
    return {
      quoteVersionId: quoteVersion.id,
      quoteId: quoteVersion.quoteId,
      quoteNo: quoteVersion.quoteNo,
      versionNo: quoteVersion.versionNo,
      tenantId: quoteVersion.tenantId,
      customerTenantPartyId: quoteVersion.customerTenantPartyId,
      publishedAt: quoteVersion.publishedAt,
      lines: quoteVersion.lines.map((line) => this.toQuoteLine(line))
    }
  }

  /** toSalesOrder renders one established order with gate and sales-side handoff summaries. */
  static toSalesOrder(order: SalesOrderRecord): SalesOrder {
    return {
      salesOrderId: order.id,
      salesOrderNo: order.salesOrderNo,
      tenantId: order.tenantId,
      customerTenantPartyId: order.customerTenantPartyId,
      quoteId: order.quoteId,
      quoteVersionId: order.quoteVersionId,
      commercialGateSummary: {
        orderEstablished: order.commercialGateSummary.orderEstablished,
        productionGate: order.commercialGateSummary.productionGate,
        stockingGate: order.commercialGateSummary.stockingGate,
        shippingGate: order.commercialGateSummary.shippingGate
      },
      fulfillmentHandoffStatus: this.toHandoffSummary(order.fulfillmentHandoffStatus),
      lines: order.lines.map((line) => ({
        salesOrderLineId: line.salesOrderLineId,
        lineNo: line.lineNo,
        itemId: line.itemId,
        itemSnapshot: this.toItemSnapshot(line.itemSnapshot),
        salesConfigSnapshot: this.toSalesConfigSnapshot(line.salesConfigSnapshot),
        packagingRequirementSnapshot: this.toPackagingRequirementSnapshot(line.packagingRequirementSnapshot),
        priceQuantityDeliverySnapshot: this.toPriceQuantityDeliverySnapshot(line.priceQuantityDeliverySnapshot),
        customerItemSnapshot: this.toCustomerItemSnapshot(line.customerItemSnapshot)
      }))
    }
  }

  /** toGetQuoteResponse renders one GetQuote success payload. */
  static toGetQuoteResponse(quote: QuoteRecord): GetQuoteResponse {
    return { quote: this.toQuote(quote) }
  }

  /** toSearchQuotesResponse renders one SearchQuotes success payload. */
  static toSearchQuotesResponse(result: SearchQuotesResult): SearchQuotesResponse {
    return {
      quotes: result.quotes.map((quote) => this.toQuote(quote)),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize
    }
  }

  /** toGetQuoteVersionResponse renders one GetQuoteVersion success payload. */
  static toGetQuoteVersionResponse(quoteVersion: QuoteVersionRecord): GetQuoteVersionResponse {
    return { quoteVersion: this.toQuoteVersion(quoteVersion) }
  }

  /** toListQuoteVersionsResponse renders one paged quote version history payload. */
  static toListQuoteVersionsResponse(result: ListQuoteVersionsResult): ListQuoteVersionsResponse {
    return {
      quoteVersions: result.quoteVersions.map((quoteVersion) => this.toQuoteVersion(quoteVersion)),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize
    }
  }

  /** toGetSalesOrderResponse renders one GetSalesOrder success payload. */
  static toGetSalesOrderResponse(order: SalesOrderRecord): GetSalesOrderResponse {
    return { salesOrder: this.toSalesOrder(order) }
  }

  /** toSearchSalesOrdersResponse renders one SearchSalesOrders success payload. */
  static toSearchSalesOrdersResponse(result: SearchSalesOrdersResult): SearchSalesOrdersResponse {
    return {
      salesOrders: result.salesOrders.map((order) => this.toSalesOrder(order)),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize
    }
  }

  /** toCreateQuoteResponse renders one CreateQuote success payload. */
  static toCreateQuoteResponse(quote: QuoteRecord): CreateQuoteResponse {
    return { quote: this.toQuote(quote) }
  }

  /** toPublishQuoteResponse renders one PublishQuote success payload with both version and current quote summary. */
  static toPublishQuoteResponse(result: PublishQuoteResult): PublishQuoteResponse {
    return {
      quoteVersion: this.toQuoteVersion(result.quoteVersion),
      quote: this.toQuote(result.quote)
    }
  }

  /** toConvertQuoteVersionToOrderResponse renders one ConvertQuoteVersionToOrder success payload. */
  static toConvertQuoteVersionToOrderResponse(order: SalesOrderRecord): ConvertQuoteVersionToOrderResponse {
    return {
      salesOrder: this.toSalesOrder(order)
    }
  }

  /** toSetOrderCommercialGateResponse renders one gate update success payload. */
  static toSetOrderCommercialGateResponse(order: SalesOrderRecord): SetOrderCommercialGateResponse {
    return {
      salesOrderId: order.id,
      commercialGateSummary: {
        orderEstablished: order.commercialGateSummary.orderEstablished,
        productionGate: order.commercialGateSummary.productionGate,
        stockingGate: order.commercialGateSummary.stockingGate,
        shippingGate: order.commercialGateSummary.shippingGate
      }
    }
  }

  /** toSubmitFulfillmentHandoffResponse renders one handoff submission success payload. */
  static toSubmitFulfillmentHandoffResponse(order: SalesOrderRecord): SubmitFulfillmentHandoffResponse {
    return {
      salesOrderId: order.id,
      commercialGateSummary: {
        orderEstablished: order.commercialGateSummary.orderEstablished,
        productionGate: order.commercialGateSummary.productionGate,
        stockingGate: order.commercialGateSummary.stockingGate,
        shippingGate: order.commercialGateSummary.shippingGate
      },
      fulfillmentHandoffStatus: this.toHandoffSummary(order.fulfillmentHandoffStatus)
    }
  }

  /** toQuoteLine renders one quote line record into the shared gRPC shape reused by quotes and quote versions. */
  private static toQuoteLine(line: QuoteLineRecord): QuoteLine {
    return {
      quoteLineId: line.quoteLineId,
      lineNo: line.lineNo,
      itemId: line.itemId,
      itemSnapshot: this.toItemSnapshot(line.itemSnapshot),
      salesConfigSnapshot: this.toSalesConfigSnapshot(line.salesConfigSnapshot),
      packagingRequirementSnapshot: this.toPackagingRequirementSnapshot(line.packagingRequirementSnapshot),
      priceQuantityDeliverySnapshot: this.toPriceQuantityDeliverySnapshot(line.priceQuantityDeliverySnapshot),
      customerItemSnapshot: this.toCustomerItemSnapshot(line.customerItemSnapshot)
    }
  }

  /** toItemSnapshot renders one frozen item summary snapshot. */
  private static toItemSnapshot(snapshot: ItemSnapshot) {
    return {
      itemCode: snapshot.itemCode,
      itemName: snapshot.itemName
    }
  }

  /** toSalesConfigSnapshot renders one frozen sales configuration snapshot. */
  private static toSalesConfigSnapshot(snapshot: SalesConfigSnapshot): ProtoSalesConfigSnapshot {
    return {
      salesUom: snapshot.salesUom,
      salesUnitLabel: snapshot.salesUnitLabel,
      notes: snapshot.notes
    }
  }

  /** toPackagingRequirementSnapshot renders one frozen packaging requirement snapshot. */
  private static toPackagingRequirementSnapshot(snapshot: PackagingRequirementSnapshot): ProtoPackagingRequirementSnapshot {
    return {
      packageMode: snapshot.packageMode,
      packageLabel: snapshot.packageLabel,
      specialInstructions: snapshot.specialInstructions
    }
  }

  /** toPriceQuantityDeliverySnapshot renders one frozen price, quantity, and delivery commitment snapshot. */
  private static toPriceQuantityDeliverySnapshot(snapshot: PriceQuantityDeliverySnapshot): ProtoPriceQuantityDeliverySnapshot {
    return {
      currencyCode: snapshot.currencyCode,
      unitPrice: snapshot.unitPrice,
      quantity: snapshot.quantity,
      deliveryTerm: snapshot.deliveryTerm,
      requestedDeliveryDate: snapshot.requestedDeliveryDate
    }
  }

  /** toCustomerItemSnapshot renders one customer-facing sku, model, and display summary snapshot. */
  private static toCustomerItemSnapshot(snapshot: CustomerItemSnapshot) {
    return {
      customerSku: snapshot.customerSku,
      customerModel: snapshot.customerModel,
      customerDisplayName: snapshot.customerDisplayName
    }
  }

  /** toHandoffSummary renders the frozen sales-side handoff summary without implying physical release. */
  private static toHandoffSummary(summary: DomainFulfillmentHandoffSummary): FulfillmentHandoffSummary {
    return {
      status:
        summary.status === SalesFulfillmentHandoffStatus.SUBMITTED
          ? FulfillmentHandoffStatusCode.FULFILLMENT_HANDOFF_STATUS_CODE_SUBMITTED
          : FulfillmentHandoffStatusCode.FULFILLMENT_HANDOFF_STATUS_CODE_NOT_SUBMITTED,
      submittedAt: summary.submittedAt ?? ''
    }
  }
}
