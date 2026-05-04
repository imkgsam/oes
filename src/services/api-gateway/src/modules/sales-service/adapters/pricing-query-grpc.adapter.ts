import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import {
  GetActiveCustomerPriceAgreementRequest,
  GetActiveCustomerPriceAgreementResponse,
  GetCustomerPriceAgreementRequest,
  GetCustomerPriceAgreementResponse,
  GetPriceListLinesRequest,
  GetPriceListLinesResponse,
  GetPriceListRequest,
  GetPriceListResponse,
  ListCustomerPriceAgreementVersionsRequest,
  ListCustomerPriceAgreementVersionsResponse,
  PreviewQuoteLinePricingRequest,
  PreviewQuoteLinePricingResponse,
  PRICING_QUERY_SERVICE_NAME,
  PricingQueryServiceClient,
  SearchPriceListsRequest,
  SearchPriceListsResponse
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
// Proxies the frozen phase 1 pricing query RPCs from api-gateway into sales-service.
export class PricingQueryGrpcAdapter implements OnModuleInit {
  private svc!: PricingQueryServiceClient

  constructor(
    @InjectGrpcClient(SALES_SERVICE_TOKEN)
    private readonly client: ClientGrpc,
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory: GrpcMetadataPropagationFactory
  ) {}

  onModuleInit(): void {
    this.svc = this.client.getService<PricingQueryServiceClient>(PRICING_QUERY_SERVICE_NAME)
  }

  /** searchPriceLists forwards one tenant-scoped price-list catalog query. */
  searchPriceLists(
    input: Omit<SearchPriceListsRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<SearchPriceListsResponse> {
    return this.call(
      'searchPriceLists',
      this.svc.searchPriceLists(
        {
          ...input,
          operatorContext: buildSalesOperatorContext(source),
          traceContext: buildSalesTraceContext(source)
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** getPriceList forwards one single price-list read. */
  getPriceList(
    input: Omit<GetPriceListRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<GetPriceListResponse> {
    return this.call(
      'getPriceList',
      this.svc.getPriceList(
        {
          ...input,
          operatorContext: buildSalesOperatorContext(source),
          traceContext: buildSalesTraceContext(source)
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** getPriceListLines forwards one price-list line page read. */
  getPriceListLines(
    input: Omit<GetPriceListLinesRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<GetPriceListLinesResponse> {
    return this.call(
      'getPriceListLines',
      this.svc.getPriceListLines(
        {
          ...input,
          operatorContext: buildSalesOperatorContext(source),
          traceContext: buildSalesTraceContext(source)
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** getActiveCustomerPriceAgreement forwards one active-agreement lookup. */
  getActiveCustomerPriceAgreement(
    input: Omit<GetActiveCustomerPriceAgreementRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<GetActiveCustomerPriceAgreementResponse> {
    return this.call(
      'getActiveCustomerPriceAgreement',
      this.svc.getActiveCustomerPriceAgreement(
        {
          ...input,
          operatorContext: buildSalesOperatorContext(source),
          traceContext: buildSalesTraceContext(source)
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** getCustomerPriceAgreement forwards one agreement head-or-version read. */
  getCustomerPriceAgreement(
    input: Omit<GetCustomerPriceAgreementRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<GetCustomerPriceAgreementResponse> {
    return this.call(
      'getCustomerPriceAgreement',
      this.svc.getCustomerPriceAgreement(
        {
          ...input,
          operatorContext: buildSalesOperatorContext(source),
          traceContext: buildSalesTraceContext(source)
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** listCustomerPriceAgreementVersions forwards one paged agreement version directory read. */
  listCustomerPriceAgreementVersions(
    input: Omit<
      ListCustomerPriceAgreementVersionsRequest,
      'operatorContext' | 'traceContext'
    >,
    source: DownstreamRequestSource
  ): Promise<ListCustomerPriceAgreementVersionsResponse> {
    return this.call(
      'listCustomerPriceAgreementVersions',
      this.svc.listCustomerPriceAgreementVersions(
        {
          ...input,
          operatorContext: buildSalesOperatorContext(source),
          traceContext: buildSalesTraceContext(source)
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** previewQuoteLinePricing forwards one non-mutating quote-line pricing preview. */
  previewQuoteLinePricing(
    input: Omit<PreviewQuoteLinePricingRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<PreviewQuoteLinePricingResponse> {
    return this.call(
      'previewQuoteLinePricing',
      this.svc.previewQuoteLinePricing(
        {
          ...input,
          operatorContext: buildSalesOperatorContext(source),
          traceContext: buildSalesTraceContext(source)
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** call wraps one gateway pricing query RPC with the shared safe gRPC transport helpers. */
  private call<TResponse>(method: string, call$: any): Promise<TResponse> {
    return safeGrpcCall<TResponse>(call$, this.opts(method))
  }

  /** opts builds the shared gateway caller metadata for one proxied pricing query. */
  private opts(method: string): SafeGrpcCallOptions {
    return { caller: CALLER, method }
  }
}
