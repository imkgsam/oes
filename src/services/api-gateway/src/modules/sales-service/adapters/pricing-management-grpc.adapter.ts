import { Injectable, OnModuleInit } from '@nestjs/common'
import {
  ChangePriceListStatusRequest, ChangePriceListStatusResponse, CreateCustomerPriceAgreementFromSalesOrderLineRequest,
  CreateCustomerPriceAgreementFromSalesOrderLineResponse, CreateCustomerPriceAgreementRequest, CreateCustomerPriceAgreementResponse,
  CreatePriceListRequest, CreatePriceListResponse, PRICING_MANAGEMENT_SERVICE_NAME, PricingManagementServiceClient,
  PublishCustomerPriceAgreementVersionRequest, PublishCustomerPriceAgreementVersionResponse, ReplacePriceListLinesRequest,
  ReplacePriceListLinesResponse, UpdateCustomerPriceAgreementDraftRequest, UpdateCustomerPriceAgreementDraftResponse,
  UpdatePriceListRequest, UpdatePriceListResponse
} from '@oes/common/generated/sales_service'
import { safeGrpcCall } from '@oes/common/transport'
import { DownstreamRequestSource, GatewaySalesGrpcClient, GatewayTrustedGrpcExecutionProducer } from '../../../common/grpc'

const CALLER = 'api-gateway'
const SALES_AUDIENCE = 'urn:oes:service:sales-service'
const PRICE_LIST_MANAGE = ['sales.pricing.price_list.manage']
const AGREEMENT_MANAGE = ['sales.pricing.customer_agreement.manage']

/** Proxies Sales pricing commands with exact HUMAN WEB target-bound credentials. */
@Injectable()
export class PricingManagementGrpcAdapter implements OnModuleInit {
  private svc!: PricingManagementServiceClient
  constructor(private readonly client: GatewaySalesGrpcClient, private readonly trustedExecution: GatewayTrustedGrpcExecutionProducer) {}
  onModuleInit(): void { this.svc = this.client.getClient().getService<PricingManagementServiceClient>(PRICING_MANAGEMENT_SERVICE_NAME) }
  async createPriceList(input: any, source: DownstreamRequestSource): Promise<CreatePriceListResponse> { return this.call('createPriceList', this.svc.createPriceList(
        this.request(input), await this.metadata(source, PRICE_LIST_MANAGE))) }
  async updatePriceList(input: any, source: DownstreamRequestSource): Promise<UpdatePriceListResponse> { return this.call('updatePriceList', this.svc.updatePriceList(
        this.request(input), await this.metadata(source, PRICE_LIST_MANAGE))) }
  async replacePriceListLines(input: any, source: DownstreamRequestSource): Promise<ReplacePriceListLinesResponse> { return this.call('replacePriceListLines', this.svc.replacePriceListLines(
        this.request(input), await this.metadata(source, PRICE_LIST_MANAGE))) }
  async changePriceListStatus(input: any, source: DownstreamRequestSource): Promise<ChangePriceListStatusResponse> { return this.call('changePriceListStatus', this.svc.changePriceListStatus(
        this.request(input), await this.metadata(source, PRICE_LIST_MANAGE))) }
  async createCustomerPriceAgreement(input: any, source: DownstreamRequestSource): Promise<CreateCustomerPriceAgreementResponse> { return this.call('createCustomerPriceAgreement', this.svc.createCustomerPriceAgreement(
        this.request(input), await this.metadata(source, AGREEMENT_MANAGE))) }
  async updateCustomerPriceAgreementDraft(input: any, source: DownstreamRequestSource): Promise<UpdateCustomerPriceAgreementDraftResponse> { return this.call('updateCustomerPriceAgreementDraft', this.svc.updateCustomerPriceAgreementDraft(
        this.request(input), await this.metadata(source, AGREEMENT_MANAGE))) }
  async publishCustomerPriceAgreementVersion(input: any, source: DownstreamRequestSource): Promise<PublishCustomerPriceAgreementVersionResponse> { return this.call('publishCustomerPriceAgreementVersion', this.svc.publishCustomerPriceAgreementVersion(
        this.request(input), await this.metadata(source, AGREEMENT_MANAGE))) }
  async createCustomerPriceAgreementFromSalesOrderLine(input: any, source: DownstreamRequestSource): Promise<CreateCustomerPriceAgreementFromSalesOrderLineResponse> { return this.call('createCustomerPriceAgreementFromSalesOrderLine', this.svc.createCustomerPriceAgreementFromSalesOrderLine(
        this.request(input), await this.metadata(source, AGREEMENT_MANAGE))) }
  /** Maps transport failures consistently for all Sales pricing management methods. */
  private call<T>(method: string, call$: any): Promise<T> { return safeGrpcCall<T>(call$, { caller: CALLER, method }) }
  /** Removes obsolete body authority while retaining the bounded business reason. */
  private request(input: Record<string, unknown>): Record<string, unknown> {
    const { tenantId: _tenantId, auditReason, operatorContext: _operatorContext, traceContext: _traceContext, auditContext: _auditContext, ...request } = input
    return auditReason === undefined ? request : { ...request, reason: auditReason }
  }
  /** Mints the exact Sales audience token from verified Gateway session state. */
  private metadata(source: DownstreamRequestSource, codes: string[]) { return this.trustedExecution.forBusinessCall(source, SALES_AUDIENCE, codes) }
}
