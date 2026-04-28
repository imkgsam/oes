import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
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
import {
  GRPC_METADATA_PROPAGATION_FACTORY,
  GrpcMetadataPropagationFactory
} from '@oes/common/authorization'
import { InjectGrpcClient, safeGrpcCall, SafeGrpcCallOptions } from '@oes/common/transport'
import {
  DownstreamRequestSource,
  toOperatorScopedMetadataInput
} from '../../../common/grpc/gateway-downstream-source.mapper'
import { buildSalesOperatorContext, buildSalesTraceContext } from './sales-grpc-context'

const CALLER = 'api-gateway'
const SALES_SERVICE_TOKEN = 'sales-service'

@Injectable()
// Proxies the frozen phase 1 sales query RPCs from api-gateway into sales-service.
export class SalesQueryGrpcAdapter implements OnModuleInit {
  private svc!: SalesQueryServiceClient

  constructor(
    @InjectGrpcClient(SALES_SERVICE_TOKEN)
    private readonly client: ClientGrpc,
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory: GrpcMetadataPropagationFactory
  ) {}

  onModuleInit(): void {
    this.svc = this.client.getService<SalesQueryServiceClient>(SALES_QUERY_SERVICE_NAME)
  }

  /** searchQuotes forwards one tenant-scoped quote directory query with explicit operator and trace payloads. */
  searchQuotes(
    input: Omit<SearchQuotesRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<SearchQuotesResponse> {
    return this.call(
      'searchQuotes',
      this.svc.searchQuotes(
        {
          ...input,
          operatorContext: buildSalesOperatorContext(source),
          traceContext: buildSalesTraceContext(source)
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** getQuote forwards one current quote draft read. */
  getQuote(
    input: Omit<GetQuoteRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<GetQuoteResponse> {
    return this.call(
      'getQuote',
      this.svc.getQuote(
        {
          ...input,
          operatorContext: buildSalesOperatorContext(source),
          traceContext: buildSalesTraceContext(source)
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** listQuoteVersions forwards one published quote history read. */
  listQuoteVersions(
    input: Omit<ListQuoteVersionsRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<ListQuoteVersionsResponse> {
    return this.call(
      'listQuoteVersions',
      this.svc.listQuoteVersions(
        {
          ...input,
          operatorContext: buildSalesOperatorContext(source),
          traceContext: buildSalesTraceContext(source)
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** getQuoteVersion forwards one single published quote version read. */
  getQuoteVersion(
    input: Omit<GetQuoteVersionRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<GetQuoteVersionResponse> {
    return this.call(
      'getQuoteVersion',
      this.svc.getQuoteVersion(
        {
          ...input,
          operatorContext: buildSalesOperatorContext(source),
          traceContext: buildSalesTraceContext(source)
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** searchSalesOrders forwards one tenant-scoped sales order directory query. */
  searchSalesOrders(
    input: Omit<SearchSalesOrdersRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<SearchSalesOrdersResponse> {
    return this.call(
      'searchSalesOrders',
      this.svc.searchSalesOrders(
        {
          ...input,
          operatorContext: buildSalesOperatorContext(source),
          traceContext: buildSalesTraceContext(source)
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** getSalesOrder forwards one established sales order read. */
  getSalesOrder(
    input: Omit<GetSalesOrderRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<GetSalesOrderResponse> {
    return this.call(
      'getSalesOrder',
      this.svc.getSalesOrder(
        {
          ...input,
          operatorContext: buildSalesOperatorContext(source),
          traceContext: buildSalesTraceContext(source)
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
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
}
