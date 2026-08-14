import { Injectable, OnModuleInit } from '@nestjs/common'
import { PROCUREMENT_MANAGEMENT_PERMISSION_CODES } from '@oes/common/authorization'
import {
  GetPurchaseOrderRequest,
  GetPurchaseOrderResponse,
  GetPurchaseRequestRequest,
  GetPurchaseRequestResponse,
  GetReceivingExpectationRequest,
  GetReceivingExpectationResponse,
  ListPurchaseOrderChangesRequest,
  ListPurchaseOrderChangesResponse,
  PurchaseOrderQueryServiceClient,
  PurchaseRequestQueryServiceClient,
  ReceivingExpectationQueryServiceClient,
  SearchPurchaseOrdersRequest,
  SearchPurchaseOrdersResponse,
  SearchPurchaseRequestsRequest,
  SearchPurchaseRequestsResponse,
  SearchReceivingExpectationsRequest,
  SearchReceivingExpectationsResponse
} from '@oes/common/generated/procurement_service'
import { safeGrpcCall, SafeGrpcCallOptions } from '@oes/common/transport'
import { Observable } from 'rxjs'
import { DownstreamRequestSource } from '../../../common/grpc/gateway-downstream-source.mapper'
import {
  GatewayProcurementGrpcClient,
  PROCUREMENT_TARGET_AUDIENCE
} from '../../../common/grpc/gateway-procurement-grpc.client'
import { GatewayTrustedGrpcExecutionProducer } from '../../../common/grpc/gateway-trusted-grpc-execution-producer'

const CALLER = 'api-gateway'

/** Proxies Procurement queries through one dedicated mTLS channel and exact BUSINESS tokens. */
@Injectable()
export class ProcurementQueryGrpcAdapter implements OnModuleInit {
  private purchaseOrderSvc!: PurchaseOrderQueryServiceClient
  private purchaseRequestSvc!: PurchaseRequestQueryServiceClient
  private receivingSvc!: ReceivingExpectationQueryServiceClient

  constructor(
    private readonly client: GatewayProcurementGrpcClient,
    private readonly producer: GatewayTrustedGrpcExecutionProducer
  ) {}

  onModuleInit(): void {
    this.purchaseRequestSvc = this.client.purchaseRequestQuery()
    this.purchaseOrderSvc = this.client.purchaseOrderQuery()
    this.receivingSvc = this.client.receivingExpectationQuery()
  }

  async searchPurchaseRequests(
    input: SearchPurchaseRequestsRequest,
    source: DownstreamRequestSource
  ): Promise<SearchPurchaseRequestsResponse> {
    return this.call(
      'searchPurchaseRequests',
      this.purchaseRequestSvc.searchPurchaseRequests(
        input,
        await this.metadata(source, PROCUREMENT_MANAGEMENT_PERMISSION_CODES.LIST_PURCHASE_REQUEST)
      )
    )
  }

  async getPurchaseRequest(
    input: GetPurchaseRequestRequest,
    source: DownstreamRequestSource
  ): Promise<GetPurchaseRequestResponse> {
    return this.call(
      'getPurchaseRequest',
      this.purchaseRequestSvc.getPurchaseRequest(
        input,
        await this.metadata(source, PROCUREMENT_MANAGEMENT_PERMISSION_CODES.GET_PURCHASE_REQUEST)
      )
    )
  }

  async searchPurchaseOrders(
    input: SearchPurchaseOrdersRequest,
    source: DownstreamRequestSource
  ): Promise<SearchPurchaseOrdersResponse> {
    return this.call(
      'searchPurchaseOrders',
      this.purchaseOrderSvc.searchPurchaseOrders(
        input,
        await this.metadata(source, PROCUREMENT_MANAGEMENT_PERMISSION_CODES.LIST_PURCHASE_ORDER)
      )
    )
  }

  async getPurchaseOrder(
    input: GetPurchaseOrderRequest,
    source: DownstreamRequestSource
  ): Promise<GetPurchaseOrderResponse> {
    return this.call(
      'getPurchaseOrder',
      this.purchaseOrderSvc.getPurchaseOrder(
        input,
        await this.metadata(source, PROCUREMENT_MANAGEMENT_PERMISSION_CODES.GET_PURCHASE_ORDER)
      )
    )
  }

  async listPurchaseOrderChanges(
    input: ListPurchaseOrderChangesRequest,
    source: DownstreamRequestSource
  ): Promise<ListPurchaseOrderChangesResponse> {
    return this.call(
      'listPurchaseOrderChanges',
      this.purchaseOrderSvc.listPurchaseOrderChanges(
        input,
        await this.metadata(
          source,
          PROCUREMENT_MANAGEMENT_PERMISSION_CODES.LIST_PURCHASE_ORDER_CHANGES
        )
      )
    )
  }

  async searchReceivingExpectations(
    input: SearchReceivingExpectationsRequest,
    source: DownstreamRequestSource
  ): Promise<SearchReceivingExpectationsResponse> {
    return this.call(
      'searchReceivingExpectations',
      this.receivingSvc.searchReceivingExpectations(
        input,
        await this.metadata(
          source,
          PROCUREMENT_MANAGEMENT_PERMISSION_CODES.LIST_RECEIVING_EXPECTATION
        )
      )
    )
  }

  async getReceivingExpectation(
    input: GetReceivingExpectationRequest,
    source: DownstreamRequestSource
  ): Promise<GetReceivingExpectationResponse> {
    return this.call(
      'getReceivingExpectation',
      this.receivingSvc.getReceivingExpectation(
        input,
        await this.metadata(
          source,
          PROCUREMENT_MANAGEMENT_PERMISSION_CODES.GET_RECEIVING_EXPECTATION
        )
      )
    )
  }

  /** Produces exact Procurement-audience metadata solely from the verified Gateway session. */
  private metadata(source: DownstreamRequestSource, code: string) {
    return this.producer.forBusinessCall(source, PROCUREMENT_TARGET_AUDIENCE, [code])
  }

  /** Wraps one generated Procurement query observable with the shared error contract. */
  private call<TResponse>(method: string, call$: Observable<TResponse>): Promise<TResponse> {
    return safeGrpcCall<TResponse>(call$, this.opts(method))
  }

  /** Identifies the Gateway/Procurement method pair without injecting authority. */
  private opts(method: string): SafeGrpcCallOptions {
    return { caller: CALLER, method }
  }
}
