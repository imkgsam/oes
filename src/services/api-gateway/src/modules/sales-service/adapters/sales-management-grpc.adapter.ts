import { Injectable, OnModuleInit } from '@nestjs/common'
import {
  ConvertQuoteVersionToOrderRequest, ConvertQuoteVersionToOrderResponse, CreateQuoteRequest, CreateQuoteResponse,
  PublishQuoteRequest, PublishQuoteResponse, SALES_MANAGEMENT_SERVICE_NAME, SalesManagementServiceClient,
  SetOrderCommercialGateRequest, SetOrderCommercialGateResponse,
  SubmitFulfillmentHandoffRequest, SubmitFulfillmentHandoffResponse, UpdateQuoteDraftRequest, UpdateQuoteDraftResponse
} from '@oes/common/generated/sales_service'
import { safeGrpcCall } from '@oes/common/transport'
import { DownstreamRequestSource, GatewaySalesGrpcClient, GatewayTrustedGrpcExecutionProducer } from '../../../common/grpc'

const CALLER = 'api-gateway'
const SALES_AUDIENCE = 'urn:oes:service:sales-service'

/** Proxies Sales commands with an exact HUMAN WEB ExecutionToken and no body authority fields. */
@Injectable()
export class SalesManagementGrpcAdapter implements OnModuleInit {
  private svc!: SalesManagementServiceClient
  constructor(private readonly client: GatewaySalesGrpcClient, private readonly trustedExecution: GatewayTrustedGrpcExecutionProducer) {}
  onModuleInit(): void { this.svc = this.client.getClient().getService<SalesManagementServiceClient>(SALES_MANAGEMENT_SERVICE_NAME) }
  async createQuote(input: any, source: DownstreamRequestSource): Promise<CreateQuoteResponse> { return this.call('createQuote', this.svc.createQuote(
        this.request(input), await this.metadata(source, ['sales.quote.create']))) }
  async updateQuoteDraft(input: any, source: DownstreamRequestSource): Promise<UpdateQuoteDraftResponse> { return this.call('updateQuoteDraft', this.svc.updateQuoteDraft(
        this.request(input), await this.metadata(source, ['sales.quote.update_draft']))) }
  async publishQuote(input: any, source: DownstreamRequestSource): Promise<PublishQuoteResponse> { return this.call('publishQuote', this.svc.publishQuote(
        this.request(input), await this.metadata(source, ['sales.quote.publish']))) }
  async convertQuoteVersionToOrder(input: any, source: DownstreamRequestSource): Promise<ConvertQuoteVersionToOrderResponse> { return this.call('convertQuoteVersionToOrder', this.svc.convertQuoteVersionToOrder(
        this.request(input), await this.metadata(source, ['sales.quote.convert_to_order']))) }
  async setOrderCommercialGate(input: any, source: DownstreamRequestSource): Promise<SetOrderCommercialGateResponse> { return this.call('setOrderCommercialGate', this.svc.setOrderCommercialGate(
        this.request(input), await this.metadata(source, ['sales.order.set_commercial_gate']))) }
  async submitFulfillmentHandoff(input: any, source: DownstreamRequestSource): Promise<SubmitFulfillmentHandoffResponse> { return this.call('submitFulfillmentHandoff', this.svc.submitFulfillmentHandoff(
        this.request(input), await this.metadata(source, ['sales.order.submit_fulfillment_handoff']))) }
  /** Maps transport failures consistently for all Sales management methods. */
  private call<T>(method: string, call$: any): Promise<T> { return safeGrpcCall<T>(call$, { caller: CALLER, method }) }
  /** Removes obsolete body authority while retaining the bounded business reason. */
  private request(input: Record<string, unknown>): Record<string, unknown> {
    const { tenantId: _tenantId, auditReason, operatorContext: _operatorContext, traceContext: _traceContext, auditContext: _auditContext, ...request } = input
    return auditReason === undefined ? request : { ...request, reason: auditReason }
  }
  /** Mints the exact Sales audience token from verified Gateway session state. */
  private metadata(source: DownstreamRequestSource, codes: string[]) { return this.trustedExecution.forBusinessCall(source, SALES_AUDIENCE, codes) }
}
