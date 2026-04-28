"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalesGrpcPresenter = void 0;
const sales_service_1 = require("@oes/common/generated/sales_service");
const sales_records_1 = require("../../domain/models/sales-records");
/** SalesGrpcPresenter maps sales domain records into the frozen phase 1 gRPC response shapes. */
class SalesGrpcPresenter {
    /** toQuote renders one current quote draft carrier into the query and management response shape. */
    static toQuote(quote) {
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
            status: quote.status === sales_records_1.SalesQuoteStatus.PUBLISHED ? sales_service_1.QuoteStatus.QUOTE_STATUS_PUBLISHED : sales_service_1.QuoteStatus.QUOTE_STATUS_DRAFT,
            latestPublishedVersionId: quote.latestPublishedVersionId ?? '',
            lines: quote.lines.map((line) => this.toQuoteLine(line))
        };
    }
    /** toQuoteVersion renders one immutable published quote version record. */
    static toQuoteVersion(quoteVersion) {
        return {
            quoteVersionId: quoteVersion.id,
            quoteId: quoteVersion.quoteId,
            quoteNo: quoteVersion.quoteNo,
            versionNo: quoteVersion.versionNo,
            tenantId: quoteVersion.tenantId,
            customerTenantPartyId: quoteVersion.customerTenantPartyId,
            publishedAt: quoteVersion.publishedAt,
            lines: quoteVersion.lines.map((line) => this.toQuoteLine(line))
        };
    }
    /** toSalesOrder renders one established order with gate and sales-side handoff summaries. */
    static toSalesOrder(order) {
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
        };
    }
    /** toGetQuoteResponse renders one GetQuote success payload. */
    static toGetQuoteResponse(quote) {
        return { quote: this.toQuote(quote) };
    }
    /** toSearchQuotesResponse renders one SearchQuotes success payload. */
    static toSearchQuotesResponse(result) {
        return {
            quotes: result.quotes.map((quote) => this.toQuote(quote)),
            total: result.total,
            page: result.page,
            pageSize: result.pageSize
        };
    }
    /** toGetQuoteVersionResponse renders one GetQuoteVersion success payload. */
    static toGetQuoteVersionResponse(quoteVersion) {
        return { quoteVersion: this.toQuoteVersion(quoteVersion) };
    }
    /** toListQuoteVersionsResponse renders one paged quote version history payload. */
    static toListQuoteVersionsResponse(result) {
        return {
            quoteVersions: result.quoteVersions.map((quoteVersion) => this.toQuoteVersion(quoteVersion)),
            total: result.total,
            page: result.page,
            pageSize: result.pageSize
        };
    }
    /** toGetSalesOrderResponse renders one GetSalesOrder success payload. */
    static toGetSalesOrderResponse(order) {
        return { salesOrder: this.toSalesOrder(order) };
    }
    /** toSearchSalesOrdersResponse renders one SearchSalesOrders success payload. */
    static toSearchSalesOrdersResponse(result) {
        return {
            salesOrders: result.salesOrders.map((order) => this.toSalesOrder(order)),
            total: result.total,
            page: result.page,
            pageSize: result.pageSize
        };
    }
    /** toCreateQuoteResponse renders one CreateQuote success payload. */
    static toCreateQuoteResponse(quote) {
        return { quote: this.toQuote(quote) };
    }
    /** toPublishQuoteResponse renders one PublishQuote success payload with both version and current quote summary. */
    static toPublishQuoteResponse(result) {
        return {
            quoteVersion: this.toQuoteVersion(result.quoteVersion),
            quote: this.toQuote(result.quote)
        };
    }
    /** toConvertQuoteVersionToOrderResponse renders one ConvertQuoteVersionToOrder success payload. */
    static toConvertQuoteVersionToOrderResponse(order) {
        return {
            salesOrder: this.toSalesOrder(order)
        };
    }
    /** toSetOrderCommercialGateResponse renders one gate update success payload. */
    static toSetOrderCommercialGateResponse(order) {
        return {
            salesOrderId: order.id,
            commercialGateSummary: {
                orderEstablished: order.commercialGateSummary.orderEstablished,
                productionGate: order.commercialGateSummary.productionGate,
                stockingGate: order.commercialGateSummary.stockingGate,
                shippingGate: order.commercialGateSummary.shippingGate
            }
        };
    }
    /** toSubmitFulfillmentHandoffResponse renders one handoff submission success payload. */
    static toSubmitFulfillmentHandoffResponse(order) {
        return {
            salesOrderId: order.id,
            commercialGateSummary: {
                orderEstablished: order.commercialGateSummary.orderEstablished,
                productionGate: order.commercialGateSummary.productionGate,
                stockingGate: order.commercialGateSummary.stockingGate,
                shippingGate: order.commercialGateSummary.shippingGate
            },
            fulfillmentHandoffStatus: this.toHandoffSummary(order.fulfillmentHandoffStatus)
        };
    }
    /** toQuoteLine renders one quote line record into the shared gRPC shape reused by quotes and quote versions. */
    static toQuoteLine(line) {
        return {
            quoteLineId: line.quoteLineId,
            lineNo: line.lineNo,
            itemId: line.itemId,
            itemSnapshot: this.toItemSnapshot(line.itemSnapshot),
            salesConfigSnapshot: this.toSalesConfigSnapshot(line.salesConfigSnapshot),
            packagingRequirementSnapshot: this.toPackagingRequirementSnapshot(line.packagingRequirementSnapshot),
            priceQuantityDeliverySnapshot: this.toPriceQuantityDeliverySnapshot(line.priceQuantityDeliverySnapshot),
            customerItemSnapshot: this.toCustomerItemSnapshot(line.customerItemSnapshot)
        };
    }
    /** toItemSnapshot renders one frozen item summary snapshot. */
    static toItemSnapshot(snapshot) {
        return {
            itemCode: snapshot.itemCode,
            itemName: snapshot.itemName
        };
    }
    /** toSalesConfigSnapshot renders one frozen sales configuration snapshot. */
    static toSalesConfigSnapshot(snapshot) {
        return {
            salesUom: snapshot.salesUom,
            salesUnitLabel: snapshot.salesUnitLabel,
            notes: snapshot.notes
        };
    }
    /** toPackagingRequirementSnapshot renders one frozen packaging requirement snapshot. */
    static toPackagingRequirementSnapshot(snapshot) {
        return {
            packageMode: snapshot.packageMode,
            packageLabel: snapshot.packageLabel,
            specialInstructions: snapshot.specialInstructions
        };
    }
    /** toPriceQuantityDeliverySnapshot renders one frozen price, quantity, and delivery commitment snapshot. */
    static toPriceQuantityDeliverySnapshot(snapshot) {
        return {
            currencyCode: snapshot.currencyCode,
            unitPrice: snapshot.unitPrice,
            quantity: snapshot.quantity,
            deliveryTerm: snapshot.deliveryTerm,
            requestedDeliveryDate: snapshot.requestedDeliveryDate
        };
    }
    /** toCustomerItemSnapshot renders one customer-facing sku, model, and display summary snapshot. */
    static toCustomerItemSnapshot(snapshot) {
        return {
            customerSku: snapshot.customerSku,
            customerModel: snapshot.customerModel,
            customerDisplayName: snapshot.customerDisplayName
        };
    }
    /** toHandoffSummary renders the frozen sales-side handoff summary without implying physical release. */
    static toHandoffSummary(summary) {
        return {
            status: summary.status === sales_records_1.SalesFulfillmentHandoffStatus.SUBMITTED
                ? sales_service_1.FulfillmentHandoffStatusCode.FULFILLMENT_HANDOFF_STATUS_CODE_SUBMITTED
                : sales_service_1.FulfillmentHandoffStatusCode.FULFILLMENT_HANDOFF_STATUS_CODE_NOT_SUBMITTED,
            submittedAt: summary.submittedAt ?? ''
        };
    }
}
exports.SalesGrpcPresenter = SalesGrpcPresenter;
//# sourceMappingURL=sales-grpc.presenter.js.map