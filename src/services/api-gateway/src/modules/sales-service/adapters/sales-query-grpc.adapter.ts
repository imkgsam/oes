import { Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import {
  GetQuoteRequest,
  GetQuoteResponse,
  GetQuoteVersionRequest,
  GetQuoteVersionResponse,
  GetSalesOrderRequest,
  GetSalesOrderResponse,
  ListQuoteVersionsRequest,
  ListQuoteVersionsResponse,
  SALES_QUERY_SERVICE_NAME,
  SalesQueryServiceClient,
  SearchQuotesRequest,
  SearchQuotesResponse,
  SearchSalesOrdersRequest,
  SearchSalesOrdersResponse
} from '@oes/common/generated/sales_service'
import { safeGrpcCall, SafeGrpcCallOptions } from '@oes/common/transport'
import { DownstreamRequestSource, GatewaySalesGrpcClient, GatewayTrustedGrpcExecutionProducer } from '../../../common/grpc'

const CALLER = 'api-gateway'
const SALES_AUDIENCE = 'urn:oes:service:sales-service'

@Injectable()
// Proxies the frozen phase 1 sales query RPCs from api-gateway into sales-service.
export class SalesQueryGrpcAdapter implements OnModuleInit {
  private svc!: SalesQueryServiceClient

  constructor(
    private readonly client: GatewaySalesGrpcClient,
    private readonly trustedExecution: GatewayTrustedGrpcExecutionProducer
  ) {}

  onModuleInit(): void {
    this.svc = this.client.getClient().getService<SalesQueryServiceClient>(SALES_QUERY_SERVICE_NAME)
  }

  /** searchQuotes forwards one tenant-scoped quote directory query with explicit operator and trace payloads. */
  async searchQuotes(
    input: any,
    source: DownstreamRequestSource
  ): Promise<SearchQuotesResponse> {
    return this.call(
      'searchQuotes',
      this.svc.searchQuotes(
        this.request(input), await this.metadata(source, ['sales.quote.list'])
      )
    )
  }

  /** getQuote forwards one current quote draft read. */
  async getQuote(
    input: any,
    source: DownstreamRequestSource
  ): Promise<GetQuoteResponse> {
    return this.call(
      'getQuote',
      this.svc.getQuote(
        this.request(input), await this.metadata(source, ['sales.quote.get_by_id'])
      )
    )
  }

  /** listQuoteVersions forwards one published quote history read. */
  async listQuoteVersions(
    input: any,
    source: DownstreamRequestSource
  ): Promise<ListQuoteVersionsResponse> {
    return this.call(
      'listQuoteVersions',
      this.svc.listQuoteVersions(
        this.request(input), await this.metadata(source, ['sales.quote.get_by_id'])
      )
    )
  }

  /** getQuoteVersion forwards one single published quote version read. */
  async getQuoteVersion(
    input: any,
    source: DownstreamRequestSource
  ): Promise<GetQuoteVersionResponse> {
    return this.call(
      'getQuoteVersion',
      this.svc.getQuoteVersion(
        this.request(input), await this.metadata(source, ['sales.quote.get_by_id'])
      )
    )
  }

  /** searchSalesOrders forwards one tenant-scoped sales order directory query. */
  async searchSalesOrders(
    input: any,
    source: DownstreamRequestSource
  ): Promise<SearchSalesOrdersResponse> {
    return this.call(
      'searchSalesOrders',
      this.svc.searchSalesOrders(
        this.request(input), await this.metadata(source, ['sales.order.list'])
      )
    )
  }

  /** getSalesOrder forwards one established sales order read. */
  async getSalesOrder(
    input: any,
    source: DownstreamRequestSource
  ): Promise<GetSalesOrderResponse> {
    return this.call(
      'getSalesOrder',
      this.svc.getSalesOrder(
        this.request(input), await this.metadata(source, ['sales.order.get_by_id'])
      )
    )
  }

  /** call wraps one gateway sales query RPC with the shared safe gRPC transport helpers. */
  private call<TResponse>(method: string, call$: any): Promise<TResponse> {
    return safeGrpcCall<TResponse>(call$, this.opts(method))
  }

  /** opts builds the shared gateway caller metadata for one proxied sales query. */
  private opts(method: string): SafeGrpcCallOptions {
    return { caller: CALLER, method }
  }

  /** Removes obsolete body authority fields before a Sales query crosses the process boundary. */
  private request(input: Record<string, unknown>): Record<string, unknown> {
    const { tenantId: _tenantId, operatorContext: _operatorContext, traceContext: _traceContext, ...request } = input
    return request
  }

  /** Exchanges the request-private HUMAN WEB source credential for an exact Sales audience token. */
  private metadata(source: DownstreamRequestSource, requiredCodes: string[]) {
    return this.trustedExecution.forBusinessCall(source, SALES_AUDIENCE, requiredCodes)
  }
}
