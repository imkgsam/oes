import {
  CommercialGateName,
  CommercialGateSummary,
  ConvertQuoteVersionToOrderResponse,
  CreateQuoteResponse,
  ExceptionPlaceholder as ProtoExceptionPlaceholder,
  ExchangeRateSnapshot as ProtoExchangeRateSnapshot,
  FulfillmentHandoffStatusCode,
  FulfillmentHandoffSummary,
  GetQuoteResponse,
  GetQuoteVersionResponse,
  GetSalesOrderResponse,
  ListQuoteVersionsResponse,
  MoqSnapshot as ProtoMoqSnapshot,
  PackagingRequirementSnapshot as ProtoPackagingRequirementSnapshot,
  PriceSnapshot as ProtoPriceSnapshot,
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
import {
  ExceptionPlaceholder,
  ExchangeRateSnapshot,
  MoqSnapshot,
  PriceSnapshot
} from '../../domain/models/pricing-records'
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
      requestedDeliveryDate: snapshot.requestedDeliveryDate,
      priceSnapshot: snapshot.priceSnapshot ? this.toPriceSnapshot(snapshot.priceSnapshot) : undefined,
      moqSnapshot: snapshot.moqSnapshot ? this.toMoqSnapshot(snapshot.moqSnapshot) : undefined,
      exchangeRateSnapshot: snapshot.exchangeRateSnapshot
        ? this.toExchangeRateSnapshot(snapshot.exchangeRateSnapshot)
        : undefined,
      exceptionPlaceholders: (snapshot.exceptionPlaceholders ?? []).map((item) =>
        this.toExceptionPlaceholder(item)
      )
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

  /** toPriceSnapshot renders one resolved pricing baseline snapshot. */
  private static toPriceSnapshot(snapshot: PriceSnapshot): ProtoPriceSnapshot {
    return {
      currencyCode: snapshot.currencyCode,
      unitPriceAmount: snapshot.unitPriceAmount,
      sourceType: snapshot.sourceType === 'PRICE_LIST' ? 2 : snapshot.sourceType === 'MANUAL' ? 3 : 1,
      sourceRefId: snapshot.sourceRefId,
      sourceLineRefId: snapshot.sourceLineRefId,
      sourceVersionNo: snapshot.sourceVersionNo,
      resolvedAt: snapshot.resolvedAt
    }
  }

  /** toMoqSnapshot renders one resolved MOQ baseline snapshot. */
  private static toMoqSnapshot(snapshot: MoqSnapshot): ProtoMoqSnapshot {
    return {
      moqQuantity: snapshot.moqQuantity,
      quantityUomCode: snapshot.quantityUomCode,
      sourceType: snapshot.sourceType === 'PRICE_LIST' ? 2 : 1,
      sourceRefId: snapshot.sourceRefId,
      sourceLineRefId: snapshot.sourceLineRefId,
      sourceVersionNo: snapshot.sourceVersionNo,
      resolvedAt: snapshot.resolvedAt
    }
  }

  /** toExchangeRateSnapshot renders one finance-owned FX snapshot as frozen on the sales side. */
  private static toExchangeRateSnapshot(snapshot: ExchangeRateSnapshot): ProtoExchangeRateSnapshot {
    return {
      fromCurrencyCode: snapshot.fromCurrencyCode,
      toCurrencyCode: snapshot.toCurrencyCode,
      exchangeRateValue: snapshot.exchangeRateValue,
      financeRateRef: snapshot.financeRateRef ?? '',
      effectiveAt: snapshot.effectiveAt,
      snapshottedAt: snapshot.snapshottedAt
    }
  }

  /** toExceptionPlaceholder renders a pricing exception placeholder without implying workflow implementation. */
  private static toExceptionPlaceholder(snapshot: ExceptionPlaceholder): ProtoExceptionPlaceholder {
    return {
      exceptionType: snapshot.exceptionType === 'LOW_MOQ' ? 2 : 1,
      status: snapshot.status === 'REQUIRED' ? 2 : 1,
      baselineSourceType: snapshot.baselineSourceType === 'PRICE_LIST' ? 2 : 1,
      baselineValue: snapshot.baselineValue,
      actualValue: snapshot.actualValue,
      currencyCode: snapshot.currencyCode ?? '',
      quantityUomCode: snapshot.quantityUomCode ?? '',
      detectedAt: snapshot.detectedAt
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
