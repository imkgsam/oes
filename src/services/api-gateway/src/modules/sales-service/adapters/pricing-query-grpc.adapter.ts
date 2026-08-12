import { Injectable, OnModuleInit } from '@nestjs/common'
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
import { safeGrpcCall, SafeGrpcCallOptions } from '@oes/common/transport'
import {
  DownstreamRequestSource,
  GatewaySalesGrpcClient,
  GatewayTrustedGrpcExecutionProducer
} from '../../../common/grpc'

const CALLER = 'api-gateway'
const SALES_AUDIENCE = 'urn:oes:service:sales-service'

/** Proxies Sales pricing reads with an exact HUMAN WEB ExecutionToken. */
@Injectable()
export class PricingQueryGrpcAdapter implements OnModuleInit {
  private svc!: PricingQueryServiceClient

  constructor(
    private readonly client: GatewaySalesGrpcClient,
    private readonly trustedExecution: GatewayTrustedGrpcExecutionProducer
  ) {}

  onModuleInit(): void {
    this.svc = this.client.getClient().getService<PricingQueryServiceClient>(PRICING_QUERY_SERVICE_NAME)
  }

  async searchPriceLists(input: any, source: DownstreamRequestSource): Promise<SearchPriceListsResponse> {
    return this.call('searchPriceLists', this.svc.searchPriceLists(
        this.request(input), await this.metadata(source, ['sales.pricing.price_list.read'])))
  }

  async getPriceList(input: any, source: DownstreamRequestSource): Promise<GetPriceListResponse> {
    return this.call('getPriceList', this.svc.getPriceList(
        this.request(input), await this.metadata(source, ['sales.pricing.price_list.read'])))
  }

  async getPriceListLines(input: any, source: DownstreamRequestSource): Promise<GetPriceListLinesResponse> {
    return this.call('getPriceListLines', this.svc.getPriceListLines(
        this.request(input), await this.metadata(source, ['sales.pricing.price_list.read'])))
  }

  async getActiveCustomerPriceAgreement(input: any, source: DownstreamRequestSource): Promise<GetActiveCustomerPriceAgreementResponse> {
    return this.call('getActiveCustomerPriceAgreement', this.svc.getActiveCustomerPriceAgreement(
        this.request(input), await this.metadata(source, ['sales.pricing.customer_agreement.read'])))
  }

  async getCustomerPriceAgreement(input: any, source: DownstreamRequestSource): Promise<GetCustomerPriceAgreementResponse> {
    return this.call('getCustomerPriceAgreement', this.svc.getCustomerPriceAgreement(
        this.request(input), await this.metadata(source, ['sales.pricing.customer_agreement.read'])))
  }

  async listCustomerPriceAgreementVersions(input: any, source: DownstreamRequestSource): Promise<ListCustomerPriceAgreementVersionsResponse> {
    return this.call('listCustomerPriceAgreementVersions', this.svc.listCustomerPriceAgreementVersions(
        this.request(input), await this.metadata(source, ['sales.pricing.customer_agreement.read'])))
  }

  async previewQuoteLinePricing(input: any, source: DownstreamRequestSource): Promise<PreviewQuoteLinePricingResponse> {
    return this.call('previewQuoteLinePricing', this.svc.previewQuoteLinePricing(
        this.request(input), await this.metadata(source, ['sales.pricing.preview_quote_line'])))
  }

  /** Wraps each pricing RPC with standard Gateway error mapping. */
  private call<TResponse>(method: string, call$: any): Promise<TResponse> {
    return safeGrpcCall<TResponse>(call$, { caller: CALLER, method })
  }

  /** Removes obsolete body authority fields before a Sales pricing query crosses the process boundary. */
  private request(input: Record<string, unknown>): Record<string, unknown> {
    const { tenantId: _tenantId, operatorContext: _operatorContext, traceContext: _traceContext, ...request } = input
    return request
  }

  /** Exchanges the request-private HUMAN WEB source credential for an exact Sales token. */
  private metadata(source: DownstreamRequestSource, requiredCodes: string[]): ReturnType<GatewayTrustedGrpcExecutionProducer['forBusinessCall']> {
    return this.trustedExecution.forBusinessCall(source, SALES_AUDIENCE, requiredCodes)
  }
}
