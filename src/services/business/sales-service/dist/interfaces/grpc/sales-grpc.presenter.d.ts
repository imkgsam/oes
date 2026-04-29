import { ConvertQuoteVersionToOrderResponse, CreateQuoteResponse, GetQuoteResponse, GetQuoteVersionResponse, GetSalesOrderResponse, ListQuoteVersionsResponse, PublishQuoteResponse, Quote, QuoteVersion, SalesOrder, SearchQuotesResponse, SearchSalesOrdersResponse, SetOrderCommercialGateResponse, SubmitFulfillmentHandoffResponse } from '@oes/common/generated/sales_service';
import { QuoteRecord, QuoteVersionRecord, SalesOrderRecord } from '../../domain/models/sales-records';
import { ListQuoteVersionsResult } from '../../application/queries/list-quote-versions.handler';
import { PublishQuoteResult } from '../../application/commands/publish-quote.handler';
import { SearchQuotesResult } from '../../application/queries/search-quotes.handler';
import { SearchSalesOrdersResult } from '../../application/queries/search-sales-orders.handler';
/** SalesGrpcPresenter maps sales domain records into the frozen phase 1 gRPC response shapes. */
export declare class SalesGrpcPresenter {
    /** toQuote renders one current quote draft carrier into the query and management response shape. */
    static toQuote(quote: QuoteRecord): Quote;
    /** toQuoteVersion renders one immutable published quote version record. */
    static toQuoteVersion(quoteVersion: QuoteVersionRecord): QuoteVersion;
    /** toSalesOrder renders one established order with gate and sales-side handoff summaries. */
    static toSalesOrder(order: SalesOrderRecord): SalesOrder;
    /** toGetQuoteResponse renders one GetQuote success payload. */
    static toGetQuoteResponse(quote: QuoteRecord): GetQuoteResponse;
    /** toSearchQuotesResponse renders one SearchQuotes success payload. */
    static toSearchQuotesResponse(result: SearchQuotesResult): SearchQuotesResponse;
    /** toGetQuoteVersionResponse renders one GetQuoteVersion success payload. */
    static toGetQuoteVersionResponse(quoteVersion: QuoteVersionRecord): GetQuoteVersionResponse;
    /** toListQuoteVersionsResponse renders one paged quote version history payload. */
    static toListQuoteVersionsResponse(result: ListQuoteVersionsResult): ListQuoteVersionsResponse;
    /** toGetSalesOrderResponse renders one GetSalesOrder success payload. */
    static toGetSalesOrderResponse(order: SalesOrderRecord): GetSalesOrderResponse;
    /** toSearchSalesOrdersResponse renders one SearchSalesOrders success payload. */
    static toSearchSalesOrdersResponse(result: SearchSalesOrdersResult): SearchSalesOrdersResponse;
    /** toCreateQuoteResponse renders one CreateQuote success payload. */
    static toCreateQuoteResponse(quote: QuoteRecord): CreateQuoteResponse;
    /** toPublishQuoteResponse renders one PublishQuote success payload with both version and current quote summary. */
    static toPublishQuoteResponse(result: PublishQuoteResult): PublishQuoteResponse;
    /** toConvertQuoteVersionToOrderResponse renders one ConvertQuoteVersionToOrder success payload. */
    static toConvertQuoteVersionToOrderResponse(order: SalesOrderRecord): ConvertQuoteVersionToOrderResponse;
    /** toSetOrderCommercialGateResponse renders one gate update success payload. */
    static toSetOrderCommercialGateResponse(order: SalesOrderRecord): SetOrderCommercialGateResponse;
    /** toSubmitFulfillmentHandoffResponse renders one handoff submission success payload. */
    static toSubmitFulfillmentHandoffResponse(order: SalesOrderRecord): SubmitFulfillmentHandoffResponse;
    /** toQuoteLine renders one quote line record into the shared gRPC shape reused by quotes and quote versions. */
    private static toQuoteLine;
    /** toItemSnapshot renders one frozen item summary snapshot. */
    private static toItemSnapshot;
    /** toSalesConfigSnapshot renders one frozen sales configuration snapshot. */
    private static toSalesConfigSnapshot;
    /** toPackagingRequirementSnapshot renders one frozen packaging requirement snapshot. */
    private static toPackagingRequirementSnapshot;
    /** toPriceQuantityDeliverySnapshot renders one frozen price, quantity, and delivery commitment snapshot. */
    private static toPriceQuantityDeliverySnapshot;
    /** toCustomerItemSnapshot renders one customer-facing sku, model, and display summary snapshot. */
    private static toCustomerItemSnapshot;
    /** toPriceSnapshot renders one resolved pricing baseline snapshot. */
    private static toPriceSnapshot;
    /** toMoqSnapshot renders one resolved MOQ baseline snapshot. */
    private static toMoqSnapshot;
    /** toExchangeRateSnapshot renders one finance-owned FX snapshot as frozen on the sales side. */
    private static toExchangeRateSnapshot;
    /** toExceptionPlaceholder renders a pricing exception placeholder without implying workflow implementation. */
    private static toExceptionPlaceholder;
    /** toHandoffSummary renders the frozen sales-side handoff summary without implying physical release. */
    private static toHandoffSummary;
}
