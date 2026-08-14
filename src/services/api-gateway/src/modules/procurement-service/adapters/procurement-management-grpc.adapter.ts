import { Injectable, OnModuleInit } from '@nestjs/common'
import { PROCUREMENT_MANAGEMENT_PERMISSION_CODES } from '@oes/common/authorization'
import {
  ApplyPurchaseOrderChangeRequest,
  ApplyPurchaseOrderChangeResponse,
  CancelPurchaseOrderRequest,
  CancelPurchaseOrderResponse,
  CancelPurchaseRequestRequest,
  CancelPurchaseRequestResponse,
  ConfirmSupplierAcknowledgementRequest,
  ConfirmSupplierAcknowledgementResponse,
  ConvertPurchaseRequestToPurchaseOrderRequest,
  ConvertPurchaseRequestToPurchaseOrderResponse,
  CreatePurchaseOrderDraftRequest,
  CreatePurchaseOrderDraftResponse,
  CreatePurchaseRequestRequest,
  CreatePurchaseRequestResponse,
  CreateReceivingExpectationRequest,
  CreateReceivingExpectationResponse,
  DecidePurchaseRequestRequest,
  DecidePurchaseRequestResponse,
  IssuePurchaseOrderRequest,
  IssuePurchaseOrderResponse,
  PurchaseOrderManagementServiceClient,
  PurchaseRequestManagementServiceClient,
  ReceivingExpectationManagementServiceClient,
  RecordReceivingDiscrepancyResolutionRequest,
  RecordReceivingDiscrepancyResolutionResponse,
  SubmitPurchaseRequestRequest,
  SubmitPurchaseRequestResponse,
  UpdatePurchaseOrderDraftRequest,
  UpdatePurchaseOrderDraftResponse,
  UpdatePurchaseRequestDraftRequest,
  UpdatePurchaseRequestDraftResponse
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
type GatewayProcurementCommand<T> = T & {
  auditReason?: string
}

/** Proxies Procurement commands through one dedicated mTLS channel and exact BUSINESS tokens. */
@Injectable()
export class ProcurementManagementGrpcAdapter implements OnModuleInit {
  private purchaseOrderSvc!: PurchaseOrderManagementServiceClient
  private purchaseRequestSvc!: PurchaseRequestManagementServiceClient
  private receivingSvc!: ReceivingExpectationManagementServiceClient

  constructor(
    private readonly client: GatewayProcurementGrpcClient,
    private readonly producer: GatewayTrustedGrpcExecutionProducer
  ) {}

  onModuleInit(): void {
    this.purchaseRequestSvc = this.client.purchaseRequestManagement()
    this.purchaseOrderSvc = this.client.purchaseOrderManagement()
    this.receivingSvc = this.client.receivingExpectationManagement()
  }

  async createPurchaseRequest(
    input: GatewayProcurementCommand<CreatePurchaseRequestRequest>,
    source: DownstreamRequestSource
  ): Promise<CreatePurchaseRequestResponse> {
    return this.call(
      'createPurchaseRequest',
      this.purchaseRequestSvc.createPurchaseRequest(
        stripLocalAuthority(input),
        await this.metadata(source, PROCUREMENT_MANAGEMENT_PERMISSION_CODES.CREATE_PURCHASE_REQUEST)
      )
    )
  }

  async updatePurchaseRequestDraft(
    input: GatewayProcurementCommand<UpdatePurchaseRequestDraftRequest>,
    source: DownstreamRequestSource
  ): Promise<UpdatePurchaseRequestDraftResponse> {
    return this.call(
      'updatePurchaseRequestDraft',
      this.purchaseRequestSvc.updatePurchaseRequestDraft(
        stripLocalAuthority(input),
        await this.metadata(
          source,
          PROCUREMENT_MANAGEMENT_PERMISSION_CODES.UPDATE_PURCHASE_REQUEST_DRAFT
        )
      )
    )
  }

  async submitPurchaseRequest(
    input: GatewayProcurementCommand<SubmitPurchaseRequestRequest>,
    source: DownstreamRequestSource
  ): Promise<SubmitPurchaseRequestResponse> {
    return this.call(
      'submitPurchaseRequest',
      this.purchaseRequestSvc.submitPurchaseRequest(
        stripLocalAuthority(input),
        await this.metadata(source, PROCUREMENT_MANAGEMENT_PERMISSION_CODES.SUBMIT_PURCHASE_REQUEST)
      )
    )
  }

  async decidePurchaseRequest(
    input: GatewayProcurementCommand<DecidePurchaseRequestRequest>,
    source: DownstreamRequestSource
  ): Promise<DecidePurchaseRequestResponse> {
    return this.call(
      'decidePurchaseRequest',
      this.purchaseRequestSvc.decidePurchaseRequest(
        stripLocalAuthority(input),
        await this.metadata(source, PROCUREMENT_MANAGEMENT_PERMISSION_CODES.DECIDE_PURCHASE_REQUEST)
      )
    )
  }

  async cancelPurchaseRequest(
    input: GatewayProcurementCommand<CancelPurchaseRequestRequest>,
    source: DownstreamRequestSource
  ): Promise<CancelPurchaseRequestResponse> {
    return this.call(
      'cancelPurchaseRequest',
      this.purchaseRequestSvc.cancelPurchaseRequest(
        stripLocalAuthority(input),
        await this.metadata(source, PROCUREMENT_MANAGEMENT_PERMISSION_CODES.CANCEL_PURCHASE_REQUEST)
      )
    )
  }

  async convertPurchaseRequestToPurchaseOrder(
    input: GatewayProcurementCommand<ConvertPurchaseRequestToPurchaseOrderRequest>,
    source: DownstreamRequestSource
  ): Promise<ConvertPurchaseRequestToPurchaseOrderResponse> {
    return this.call(
      'convertPurchaseRequestToPurchaseOrder',
      this.purchaseRequestSvc.convertPurchaseRequestToPurchaseOrder(
        stripLocalAuthority(input),
        await this.metadata(
          source,
          PROCUREMENT_MANAGEMENT_PERMISSION_CODES.CONVERT_PURCHASE_REQUEST_TO_ORDER
        )
      )
    )
  }

  async createPurchaseOrderDraft(
    input: GatewayProcurementCommand<CreatePurchaseOrderDraftRequest>,
    source: DownstreamRequestSource
  ): Promise<CreatePurchaseOrderDraftResponse> {
    return this.call(
      'createPurchaseOrderDraft',
      this.purchaseOrderSvc.createPurchaseOrderDraft(
        stripLocalAuthority(input),
        await this.metadata(
          source,
          PROCUREMENT_MANAGEMENT_PERMISSION_CODES.CREATE_PURCHASE_ORDER_DRAFT
        )
      )
    )
  }

  async updatePurchaseOrderDraft(
    input: GatewayProcurementCommand<UpdatePurchaseOrderDraftRequest>,
    source: DownstreamRequestSource
  ): Promise<UpdatePurchaseOrderDraftResponse> {
    return this.call(
      'updatePurchaseOrderDraft',
      this.purchaseOrderSvc.updatePurchaseOrderDraft(
        stripLocalAuthority(input),
        await this.metadata(
          source,
          PROCUREMENT_MANAGEMENT_PERMISSION_CODES.UPDATE_PURCHASE_ORDER_DRAFT
        )
      )
    )
  }

  async issuePurchaseOrder(
    input: GatewayProcurementCommand<IssuePurchaseOrderRequest>,
    source: DownstreamRequestSource
  ): Promise<IssuePurchaseOrderResponse> {
    return this.call(
      'issuePurchaseOrder',
      this.purchaseOrderSvc.issuePurchaseOrder(
        stripLocalAuthority(input),
        await this.metadata(source, PROCUREMENT_MANAGEMENT_PERMISSION_CODES.ISSUE_PURCHASE_ORDER)
      )
    )
  }

  async confirmSupplierAcknowledgement(
    input: GatewayProcurementCommand<ConfirmSupplierAcknowledgementRequest>,
    source: DownstreamRequestSource
  ): Promise<ConfirmSupplierAcknowledgementResponse> {
    return this.call(
      'confirmSupplierAcknowledgement',
      this.purchaseOrderSvc.confirmSupplierAcknowledgement(
        stripLocalAuthority(input),
        await this.metadata(
          source,
          PROCUREMENT_MANAGEMENT_PERMISSION_CODES.CONFIRM_SUPPLIER_ACKNOWLEDGEMENT
        )
      )
    )
  }

  async applyPurchaseOrderChange(
    input: GatewayProcurementCommand<ApplyPurchaseOrderChangeRequest>,
    source: DownstreamRequestSource
  ): Promise<ApplyPurchaseOrderChangeResponse> {
    return this.call(
      'applyPurchaseOrderChange',
      this.purchaseOrderSvc.applyPurchaseOrderChange(
        stripLocalAuthority(input),
        await this.metadata(
          source,
          PROCUREMENT_MANAGEMENT_PERMISSION_CODES.APPLY_PURCHASE_ORDER_CHANGE
        )
      )
    )
  }

  async cancelPurchaseOrder(
    input: GatewayProcurementCommand<CancelPurchaseOrderRequest>,
    source: DownstreamRequestSource
  ): Promise<CancelPurchaseOrderResponse> {
    return this.call(
      'cancelPurchaseOrder',
      this.purchaseOrderSvc.cancelPurchaseOrder(
        stripLocalAuthority(input),
        await this.metadata(source, PROCUREMENT_MANAGEMENT_PERMISSION_CODES.CANCEL_PURCHASE_ORDER)
      )
    )
  }

  async createReceivingExpectation(
    input: GatewayProcurementCommand<CreateReceivingExpectationRequest>,
    source: DownstreamRequestSource
  ): Promise<CreateReceivingExpectationResponse> {
    return this.call(
      'createReceivingExpectation',
      this.receivingSvc.createReceivingExpectation(
        stripLocalAuthority(input),
        await this.metadata(
          source,
          PROCUREMENT_MANAGEMENT_PERMISSION_CODES.CREATE_RECEIVING_EXPECTATION
        )
      )
    )
  }

  async recordReceivingDiscrepancyResolution(
    input: GatewayProcurementCommand<RecordReceivingDiscrepancyResolutionRequest>,
    source: DownstreamRequestSource
  ): Promise<RecordReceivingDiscrepancyResolutionResponse> {
    return this.call(
      'recordReceivingDiscrepancyResolution',
      this.receivingSvc.recordReceivingDiscrepancyResolution(
        stripLocalAuthority(input),
        await this.metadata(
          source,
          PROCUREMENT_MANAGEMENT_PERMISSION_CODES.RECORD_RECEIVING_DISCREPANCY_RESOLUTION
        )
      )
    )
  }

  /** Produces exact Procurement-audience metadata solely from the verified Gateway session. */
  private metadata(source: DownstreamRequestSource, code: string) {
    return this.producer.forBusinessCall(source, PROCUREMENT_TARGET_AUDIENCE, [code])
  }

  /** Wraps one generated Procurement command observable with the shared error contract. */
  private call<TResponse>(method: string, call$: Observable<TResponse>): Promise<TResponse> {
    return safeGrpcCall<TResponse>(call$, this.opts(method))
  }

  /** Identifies the Gateway/Procurement method pair without injecting authority. */
  private opts(method: string): SafeGrpcCallOptions {
    return { caller: CALLER, method }
  }
}

/** Removes the non-wire HTTP audit hint before the Procurement wire call. */
function stripLocalAuthority<T>(input: GatewayProcurementCommand<T>): T {
  const { auditReason: _auditReason, ...request } = input
  return request as T
}
