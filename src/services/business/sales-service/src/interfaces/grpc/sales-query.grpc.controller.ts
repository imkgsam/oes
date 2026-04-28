import { Controller, UseFilters } from '@nestjs/common'
import { ValidatingQueryBus } from '@oes/common/cqrs'
import { GrpcExceptionFilter } from '@oes/common/filters'
import {
  GetQuoteRequest,
  GetQuoteResponse,
  GetQuoteVersionRequest,
  GetQuoteVersionResponse,
  GetSalesOrderRequest,
  GetSalesOrderResponse,
  ListQuoteVersionsRequest,
  ListQuoteVersionsResponse,
  SearchQuotesRequest,
  SearchQuotesResponse,
  SearchSalesOrdersRequest,
  SearchSalesOrdersResponse,
  SalesQueryServiceController,
  SalesQueryServiceControllerMethods
} from '@oes/common/generated/sales_service'
import { GetQuoteQuery } from '../../application/queries/get-quote.query'
import { SearchQuotesQuery } from '../../application/queries/search-quotes.query'
import { GetQuoteVersionQuery } from '../../application/queries/get-quote-version.query'
import { ListQuoteVersionsQuery } from '../../application/queries/list-quote-versions.query'
import { GetSalesOrderQuery } from '../../application/queries/get-sales-order.query'
import { SearchSalesOrdersQuery } from '../../application/queries/search-sales-orders.query'
import { SalesOrderSearchInput, SalesQuoteStatus } from '../../domain/models/sales-records'
import { SalesGrpcPresenter } from './sales-grpc.presenter'
import { SalesRpcContextValidator } from './sales-rpc-context.validator'

/** SalesQueryGrpcController exposes the phase 1 read-only sales query contract. */
@UseFilters(GrpcExceptionFilter)
@Controller()
@SalesQueryServiceControllerMethods()
export class SalesQueryGrpcController implements SalesQueryServiceController {
  constructor(private readonly queryBus: ValidatingQueryBus) {}

  async getQuote(request: GetQuoteRequest): Promise<GetQuoteResponse> {
    SalesRpcContextValidator.assertQueryContext(request)
    const quote = await this.queryBus.execute(new GetQuoteQuery(request.tenantId ?? '', request.quoteId ?? ''))
    return SalesGrpcPresenter.toGetQuoteResponse(quote)
  }

  async searchQuotes(request: SearchQuotesRequest): Promise<SearchQuotesResponse> {
    SalesRpcContextValidator.assertQueryContext(request)
    const result = await this.queryBus.execute(
      new SearchQuotesQuery({
        tenantId: request.tenantId ?? '',
        keyword: request.keyword ?? undefined,
        customerTenantPartyId: request.customerTenantPartyId ?? undefined,
        status: toDomainQuoteStatus(request.status),
        page: request.page ?? undefined,
        pageSize: request.pageSize ?? undefined
      })
    )

    return SalesGrpcPresenter.toSearchQuotesResponse(result)
  }

  async getQuoteVersion(request: GetQuoteVersionRequest): Promise<GetQuoteVersionResponse> {
    SalesRpcContextValidator.assertQueryContext(request)
    const quoteVersion = await this.queryBus.execute(
      new GetQuoteVersionQuery(request.tenantId ?? '', request.quoteVersionId ?? '')
    )

    return SalesGrpcPresenter.toGetQuoteVersionResponse(quoteVersion)
  }

  async listQuoteVersions(request: ListQuoteVersionsRequest): Promise<ListQuoteVersionsResponse> {
    SalesRpcContextValidator.assertQueryContext(request)
    const result = await this.queryBus.execute(
      new ListQuoteVersionsQuery({
        tenantId: request.tenantId ?? '',
        quoteId: request.quoteId ?? '',
        page: request.page ?? undefined,
        pageSize: request.pageSize ?? undefined
      })
    )

    return SalesGrpcPresenter.toListQuoteVersionsResponse(result)
  }

  async getSalesOrder(request: GetSalesOrderRequest): Promise<GetSalesOrderResponse> {
    SalesRpcContextValidator.assertQueryContext(request)
    const order = await this.queryBus.execute(
      new GetSalesOrderQuery(request.tenantId ?? '', request.salesOrderId ?? '')
    )

    return SalesGrpcPresenter.toGetSalesOrderResponse(order)
  }

  async searchSalesOrders(request: SearchSalesOrdersRequest): Promise<SearchSalesOrdersResponse> {
    SalesRpcContextValidator.assertQueryContext(request)
    const input: SalesOrderSearchInput = {
      tenantId: request.tenantId ?? '',
      keyword: request.keyword ?? undefined,
      customerTenantPartyId: request.customerTenantPartyId ?? undefined,
      quoteVersionId: request.quoteVersionId ?? undefined,
      productionGate: request.productionGate,
      stockingGate: request.stockingGate,
      shippingGate: request.shippingGate,
      page: request.page ?? undefined,
      pageSize: request.pageSize ?? undefined
    }
    const result = await this.queryBus.execute(new SearchSalesOrdersQuery(input))
    return SalesGrpcPresenter.toSearchSalesOrdersResponse(result)
  }
}

/** toDomainQuoteStatus maps the generated enum filter into the minimal domain quote search filter. */
function toDomainQuoteStatus(value?: number): SalesQuoteStatus | undefined {
  if (value === 1) {
    return SalesQuoteStatus.DRAFT
  }
  if (value === 2) {
    return SalesQuoteStatus.PUBLISHED
  }
  return undefined
}
