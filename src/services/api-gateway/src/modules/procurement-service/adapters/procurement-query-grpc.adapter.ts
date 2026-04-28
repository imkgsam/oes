import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import {
  GetPurchaseOrderRequest,
  GetPurchaseOrderResponse,
  GetPurchaseRequestRequest,
  GetPurchaseRequestResponse,
  GetReceivingExpectationRequest,
  GetReceivingExpectationResponse,
  ListPurchaseOrderChangesRequest,
  ListPurchaseOrderChangesResponse,
  PURCHASE_ORDER_QUERY_SERVICE_NAME,
  PURCHASE_REQUEST_QUERY_SERVICE_NAME,
  PurchaseOrderQueryServiceClient,
  PurchaseRequestQueryServiceClient,
  RECEIVING_EXPECTATION_QUERY_SERVICE_NAME,
  ReceivingExpectationQueryServiceClient,
  SearchPurchaseOrdersRequest,
  SearchPurchaseOrdersResponse,
  SearchPurchaseRequestsRequest,
  SearchPurchaseRequestsResponse,
  SearchReceivingExpectationsRequest,
  SearchReceivingExpectationsResponse
} from '@oes/common/generated/procurement_service'
import {
  GRPC_METADATA_PROPAGATION_FACTORY,
  GrpcMetadataPropagationFactory
} from '@oes/common/authorization'
import { InjectGrpcClient, safeGrpcCall, SafeGrpcCallOptions } from '@oes/common/transport'
import { SERVICE_NAMES } from '@oes/common/constants'
import {
  DownstreamRequestSource,
  toOperatorScopedMetadataInput
} from '../../../common/grpc/gateway-downstream-source.mapper'
import {
  buildProcurementOperatorContext,
  buildProcurementTraceContext
} from './procurement-grpc-context'

const CALLER = 'api-gateway'

/** ProcurementQueryGrpcAdapter proxies the frozen phase 1 procurement query RPCs from api-gateway into procurement-service. */
@Injectable()
export class ProcurementQueryGrpcAdapter implements OnModuleInit {
  private purchaseOrderSvc!: PurchaseOrderQueryServiceClient
  private purchaseRequestSvc!: PurchaseRequestQueryServiceClient
  private receivingSvc!: ReceivingExpectationQueryServiceClient

  constructor(
    @InjectGrpcClient(SERVICE_NAMES.PROCUREMENT)
    private readonly client: ClientGrpc,
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory: GrpcMetadataPropagationFactory
  ) {}

  onModuleInit(): void {
    this.purchaseRequestSvc = this.client.getService<PurchaseRequestQueryServiceClient>(
      PURCHASE_REQUEST_QUERY_SERVICE_NAME
    )
    this.purchaseOrderSvc = this.client.getService<PurchaseOrderQueryServiceClient>(
      PURCHASE_ORDER_QUERY_SERVICE_NAME
    )
    this.receivingSvc = this.client.getService<ReceivingExpectationQueryServiceClient>(
      RECEIVING_EXPECTATION_QUERY_SERVICE_NAME
    )
  }

  /** searchPurchaseRequests forwards one tenant-scoped purchase request directory query. */
  searchPurchaseRequests(
    input: Omit<SearchPurchaseRequestsRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<SearchPurchaseRequestsResponse> {
    return this.call(
      'searchPurchaseRequests',
      this.purchaseRequestSvc.searchPurchaseRequests(
        {
          ...input,
          operatorContext: buildProcurementOperatorContext(source),
          traceContext: buildProcurementTraceContext(source)
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** getPurchaseRequest forwards one purchase request detail read. */
  getPurchaseRequest(
    input: Omit<GetPurchaseRequestRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<GetPurchaseRequestResponse> {
    return this.call(
      'getPurchaseRequest',
      this.purchaseRequestSvc.getPurchaseRequest(
        {
          ...input,
          operatorContext: buildProcurementOperatorContext(source),
          traceContext: buildProcurementTraceContext(source)
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** searchPurchaseOrders forwards one tenant-scoped purchase order directory query. */
  searchPurchaseOrders(
    input: Omit<SearchPurchaseOrdersRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<SearchPurchaseOrdersResponse> {
    return this.call(
      'searchPurchaseOrders',
      this.purchaseOrderSvc.searchPurchaseOrders(
        {
          ...input,
          operatorContext: buildProcurementOperatorContext(source),
          traceContext: buildProcurementTraceContext(source)
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** getPurchaseOrder forwards one purchase order detail read. */
  getPurchaseOrder(
    input: Omit<GetPurchaseOrderRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<GetPurchaseOrderResponse> {
    return this.call(
      'getPurchaseOrder',
      this.purchaseOrderSvc.getPurchaseOrder(
        {
          ...input,
          operatorContext: buildProcurementOperatorContext(source),
          traceContext: buildProcurementTraceContext(source)
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** listPurchaseOrderChanges forwards one purchase order change history read. */
  listPurchaseOrderChanges(
    input: Omit<ListPurchaseOrderChangesRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<ListPurchaseOrderChangesResponse> {
    return this.call(
      'listPurchaseOrderChanges',
      this.purchaseOrderSvc.listPurchaseOrderChanges(
        {
          ...input,
          operatorContext: buildProcurementOperatorContext(source),
          traceContext: buildProcurementTraceContext(source)
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** searchReceivingExpectations forwards one receiving expectation directory query. */
  searchReceivingExpectations(
    input: Omit<SearchReceivingExpectationsRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<SearchReceivingExpectationsResponse> {
    return this.call(
      'searchReceivingExpectations',
      this.receivingSvc.searchReceivingExpectations(
        {
          ...input,
          operatorContext: buildProcurementOperatorContext(source),
          traceContext: buildProcurementTraceContext(source)
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** getReceivingExpectation forwards one receiving expectation detail read. */
  getReceivingExpectation(
    input: Omit<GetReceivingExpectationRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<GetReceivingExpectationResponse> {
    return this.call(
      'getReceivingExpectation',
      this.receivingSvc.getReceivingExpectation(
        {
          ...input,
          operatorContext: buildProcurementOperatorContext(source),
          traceContext: buildProcurementTraceContext(source)
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** call wraps one gateway procurement query RPC with the shared safe gRPC transport helpers. */
  private call<TResponse>(method: string, call$: any): Promise<TResponse> {
    return safeGrpcCall<TResponse>(call$, this.opts(method))
  }

  /** opts builds the shared gateway caller metadata for one proxied procurement query. */
  private opts(method: string): SafeGrpcCallOptions {
    return { caller: CALLER, method }
  }
}
