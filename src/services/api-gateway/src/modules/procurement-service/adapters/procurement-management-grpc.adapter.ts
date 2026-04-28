import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
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
  PURCHASE_ORDER_MANAGEMENT_SERVICE_NAME,
  PURCHASE_REQUEST_MANAGEMENT_SERVICE_NAME,
  PurchaseOrderManagementServiceClient,
  PurchaseRequestManagementServiceClient,
  RECEIVING_EXPECTATION_MANAGEMENT_SERVICE_NAME,
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
import {
  GRPC_METADATA_PROPAGATION_FACTORY,
  GrpcMetadataPropagationFactory
} from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import { InjectGrpcClient, safeGrpcCall, SafeGrpcCallOptions } from '@oes/common/transport'
import {
  DownstreamRequestSource,
  toOperatorScopedMetadataInput
} from '../../../common/grpc/gateway-downstream-source.mapper'
import {
  buildProcurementAuditContext,
  buildProcurementOperatorContext,
  buildProcurementTraceContext
} from './procurement-grpc-context'

const CALLER = 'api-gateway'

interface ManagementInputBase {
  auditReason?: string
}

/** ProcurementManagementGrpcAdapter proxies the frozen phase 1 procurement command RPCs from api-gateway into procurement-service. */
@Injectable()
export class ProcurementManagementGrpcAdapter implements OnModuleInit {
  private purchaseOrderSvc!: PurchaseOrderManagementServiceClient
  private purchaseRequestSvc!: PurchaseRequestManagementServiceClient
  private receivingSvc!: ReceivingExpectationManagementServiceClient

  constructor(
    @InjectGrpcClient(SERVICE_NAMES.PROCUREMENT)
    private readonly client: ClientGrpc,
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory: GrpcMetadataPropagationFactory
  ) {}

  onModuleInit(): void {
    this.purchaseRequestSvc = this.client.getService<PurchaseRequestManagementServiceClient>(
      PURCHASE_REQUEST_MANAGEMENT_SERVICE_NAME
    )
    this.purchaseOrderSvc = this.client.getService<PurchaseOrderManagementServiceClient>(
      PURCHASE_ORDER_MANAGEMENT_SERVICE_NAME
    )
    this.receivingSvc = this.client.getService<ReceivingExpectationManagementServiceClient>(
      RECEIVING_EXPECTATION_MANAGEMENT_SERVICE_NAME
    )
  }

  /** createPurchaseRequest forwards one purchase request draft creation command. */
  createPurchaseRequest(
    input: Omit<CreatePurchaseRequestRequest, 'auditContext' | 'operatorContext' | 'traceContext'> &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<CreatePurchaseRequestResponse> {
    return this.call(
      'createPurchaseRequest',
      this.purchaseRequestSvc.createPurchaseRequest(
        this.attachManagementContext(input, source, input.auditReason ?? 'create purchase request from api-gateway'),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** updatePurchaseRequestDraft forwards one purchase request draft mutation command. */
  updatePurchaseRequestDraft(
    input: Omit<
      UpdatePurchaseRequestDraftRequest,
      'auditContext' | 'operatorContext' | 'traceContext'
    > &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<UpdatePurchaseRequestDraftResponse> {
    return this.call(
      'updatePurchaseRequestDraft',
      this.purchaseRequestSvc.updatePurchaseRequestDraft(
        this.attachManagementContext(
          input,
          source,
          input.auditReason ?? 'update purchase request draft from api-gateway'
        ),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** submitPurchaseRequest forwards one explicit purchase request submission command. */
  submitPurchaseRequest(
    input: Omit<SubmitPurchaseRequestRequest, 'auditContext' | 'operatorContext' | 'traceContext'> &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<SubmitPurchaseRequestResponse> {
    return this.call(
      'submitPurchaseRequest',
      this.purchaseRequestSvc.submitPurchaseRequest(
        this.attachManagementContext(
          input,
          source,
          input.auditReason ?? 'submit purchase request from api-gateway'
        ),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** decidePurchaseRequest forwards one purchase request decision command. */
  decidePurchaseRequest(
    input: Omit<DecidePurchaseRequestRequest, 'auditContext' | 'operatorContext' | 'traceContext'> &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<DecidePurchaseRequestResponse> {
    return this.call(
      'decidePurchaseRequest',
      this.purchaseRequestSvc.decidePurchaseRequest(
        this.attachManagementContext(
          input,
          source,
          input.auditReason ?? 'decide purchase request from api-gateway'
        ),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** cancelPurchaseRequest forwards one purchase request cancellation command. */
  cancelPurchaseRequest(
    input: Omit<CancelPurchaseRequestRequest, 'auditContext' | 'operatorContext' | 'traceContext'> &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<CancelPurchaseRequestResponse> {
    return this.call(
      'cancelPurchaseRequest',
      this.purchaseRequestSvc.cancelPurchaseRequest(
        this.attachManagementContext(
          input,
          source,
          input.auditReason ?? 'cancel purchase request from api-gateway'
        ),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** convertPurchaseRequestToPurchaseOrder forwards one PR-to-PO draft conversion command. */
  convertPurchaseRequestToPurchaseOrder(
    input: Omit<
      ConvertPurchaseRequestToPurchaseOrderRequest,
      'auditContext' | 'operatorContext' | 'traceContext'
    > &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<ConvertPurchaseRequestToPurchaseOrderResponse> {
    return this.call(
      'convertPurchaseRequestToPurchaseOrder',
      this.purchaseRequestSvc.convertPurchaseRequestToPurchaseOrder(
        this.attachManagementContext(
          input,
          source,
          input.auditReason ?? 'convert purchase request to purchase order from api-gateway'
        ),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** createPurchaseOrderDraft forwards one purchase order draft creation command. */
  createPurchaseOrderDraft(
    input: Omit<
      CreatePurchaseOrderDraftRequest,
      'auditContext' | 'operatorContext' | 'traceContext'
    > &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<CreatePurchaseOrderDraftResponse> {
    return this.call(
      'createPurchaseOrderDraft',
      this.purchaseOrderSvc.createPurchaseOrderDraft(
        this.attachManagementContext(
          input,
          source,
          input.auditReason ?? 'create purchase order draft from api-gateway'
        ),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** updatePurchaseOrderDraft forwards one purchase order draft mutation command. */
  updatePurchaseOrderDraft(
    input: Omit<
      UpdatePurchaseOrderDraftRequest,
      'auditContext' | 'operatorContext' | 'traceContext'
    > &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<UpdatePurchaseOrderDraftResponse> {
    return this.call(
      'updatePurchaseOrderDraft',
      this.purchaseOrderSvc.updatePurchaseOrderDraft(
        this.attachManagementContext(
          input,
          source,
          input.auditReason ?? 'update purchase order draft from api-gateway'
        ),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** issuePurchaseOrder forwards one explicit purchase order issue command. */
  issuePurchaseOrder(
    input: Omit<IssuePurchaseOrderRequest, 'auditContext' | 'operatorContext' | 'traceContext'> &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<IssuePurchaseOrderResponse> {
    return this.call(
      'issuePurchaseOrder',
      this.purchaseOrderSvc.issuePurchaseOrder(
        this.attachManagementContext(
          input,
          source,
          input.auditReason ?? 'issue purchase order from api-gateway'
        ),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** confirmSupplierAcknowledgement forwards one supplier acknowledgement summary command. */
  confirmSupplierAcknowledgement(
    input: Omit<
      ConfirmSupplierAcknowledgementRequest,
      'auditContext' | 'operatorContext' | 'traceContext'
    > &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<ConfirmSupplierAcknowledgementResponse> {
    return this.call(
      'confirmSupplierAcknowledgement',
      this.purchaseOrderSvc.confirmSupplierAcknowledgement(
        this.attachManagementContext(
          input,
          source,
          input.auditReason ?? 'confirm supplier acknowledgement from api-gateway'
        ),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** applyPurchaseOrderChange forwards one applied purchase order change command. */
  applyPurchaseOrderChange(
    input: Omit<
      ApplyPurchaseOrderChangeRequest,
      'auditContext' | 'operatorContext' | 'traceContext'
    > &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<ApplyPurchaseOrderChangeResponse> {
    return this.call(
      'applyPurchaseOrderChange',
      this.purchaseOrderSvc.applyPurchaseOrderChange(
        this.attachManagementContext(
          input,
          source,
          input.auditReason ?? 'apply purchase order change from api-gateway'
        ),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** cancelPurchaseOrder forwards one purchase order cancellation command. */
  cancelPurchaseOrder(
    input: Omit<CancelPurchaseOrderRequest, 'auditContext' | 'operatorContext' | 'traceContext'> &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<CancelPurchaseOrderResponse> {
    return this.call(
      'cancelPurchaseOrder',
      this.purchaseOrderSvc.cancelPurchaseOrder(
        this.attachManagementContext(
          input,
          source,
          input.auditReason ?? 'cancel purchase order from api-gateway'
        ),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** createReceivingExpectation forwards one purchase-side receiving expectation creation command. */
  createReceivingExpectation(
    input: Omit<
      CreateReceivingExpectationRequest,
      'auditContext' | 'operatorContext' | 'traceContext'
    > &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<CreateReceivingExpectationResponse> {
    return this.call(
      'createReceivingExpectation',
      this.receivingSvc.createReceivingExpectation(
        this.attachManagementContext(
          input,
          source,
          input.auditReason ?? 'create receiving expectation from api-gateway'
        ),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** recordReceivingDiscrepancyResolution forwards one discrepancy resolution summary command. */
  recordReceivingDiscrepancyResolution(
    input: Omit<
      RecordReceivingDiscrepancyResolutionRequest,
      'auditContext' | 'operatorContext' | 'traceContext'
    > &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<RecordReceivingDiscrepancyResolutionResponse> {
    return this.call(
      'recordReceivingDiscrepancyResolution',
      this.receivingSvc.recordReceivingDiscrepancyResolution(
        this.attachManagementContext(
          input,
          source,
          input.auditReason ?? 'record receiving discrepancy resolution from api-gateway'
        ),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** attachManagementContext injects the explicit operator, trace, and audit payloads frozen in the procurement contract. */
  private attachManagementContext<TInput extends object>(
    input: TInput,
    source: DownstreamRequestSource,
    reason: string
  ) {
    return {
      ...input,
      operatorContext: buildProcurementOperatorContext(source),
      traceContext: buildProcurementTraceContext(source),
      auditContext: buildProcurementAuditContext(source, reason)
    }
  }

  /** call wraps one gateway procurement command RPC with the shared safe gRPC transport helpers. */
  private call<TResponse>(method: string, call$: any): Promise<TResponse> {
    return safeGrpcCall<TResponse>(call$, this.opts(method))
  }

  /** opts builds the shared gateway caller metadata for one proxied procurement command. */
  private opts(method: string): SafeGrpcCallOptions {
    return { caller: CALLER, method }
  }
}
