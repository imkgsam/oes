import { ValidatingQueryBus } from '@oes/common/cqrs';
import { GetQuoteRequest, GetQuoteResponse, GetQuoteVersionRequest, GetQuoteVersionResponse, GetSalesOrderRequest, GetSalesOrderResponse, ListQuoteVersionsRequest, ListQuoteVersionsResponse, SearchQuotesRequest, SearchQuotesResponse, SearchSalesOrdersRequest, SearchSalesOrdersResponse, SalesQueryServiceController } from '@oes/common/generated/sales_service';
/** SalesQueryGrpcController exposes the phase 1 read-only sales query contract. */
export declare class SalesQueryGrpcController implements SalesQueryServiceController {
    private readonly queryBus;
    constructor(queryBus: ValidatingQueryBus);
    getQuote(request: GetQuoteRequest): Promise<GetQuoteResponse>;
    searchQuotes(request: SearchQuotesRequest): Promise<SearchQuotesResponse>;
    getQuoteVersion(request: GetQuoteVersionRequest): Promise<GetQuoteVersionResponse>;
    listQuoteVersions(request: ListQuoteVersionsRequest): Promise<ListQuoteVersionsResponse>;
    getSalesOrder(request: GetSalesOrderRequest): Promise<GetSalesOrderResponse>;
    searchSalesOrders(request: SearchSalesOrdersRequest): Promise<SearchSalesOrdersResponse>;
}
