import { Controller, UseFilters } from '@nestjs/common'
import { GrpcRequestContextStore } from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import { ValidatingCommandBus } from '@oes/common/cqrs'
import { GrpcExceptionFilter } from '@oes/common/filters'
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
  PurchaseOrderManagementServiceController,
  PurchaseOrderManagementServiceControllerMethods,
  PurchaseRequestDecision as ProtoPurchaseRequestDecision,
  PurchaseRequestLineType as ProtoPurchaseRequestLineType,
  PurchaseRequestManagementServiceController,
  PurchaseRequestManagementServiceControllerMethods,
  PurchaseRequestType as ProtoPurchaseRequestType,
  ReceivingExpectationManagementServiceController,
  ReceivingExpectationManagementServiceControllerMethods,
  ReceivingResolutionCode as ProtoReceivingResolutionCode,
  RecordReceivingDiscrepancyResolutionRequest,
  RecordReceivingDiscrepancyResolutionResponse,
  SubmitPurchaseRequestRequest,
  SubmitPurchaseRequestResponse,
  UpdatePurchaseOrderDraftRequest,
  UpdatePurchaseOrderDraftResponse,
  UpdatePurchaseRequestDraftRequest,
  UpdatePurchaseRequestDraftResponse,
  IssuePurchaseOrderRequest,
  IssuePurchaseOrderResponse,
  DecidePurchaseRequestRequest,
  DecidePurchaseRequestResponse
} from '@oes/common/generated/procurement_service'
import { CreatePurchaseRequestCommand } from '../../application/commands/create-purchase-request.command'
import { UpdatePurchaseRequestDraftCommand } from '../../application/commands/update-purchase-request-draft.command'
import { SubmitPurchaseRequestCommand } from '../../application/commands/submit-purchase-request.command'
import { DecidePurchaseRequestCommand } from '../../application/commands/decide-purchase-request.command'
import { CancelPurchaseRequestCommand } from '../../application/commands/cancel-purchase-request.command'
import { ConvertPurchaseRequestToPurchaseOrderCommand } from '../../application/commands/convert-purchase-request-to-purchase-order.command'
import { CreatePurchaseOrderDraftCommand } from '../../application/commands/create-purchase-order-draft.command'
import { UpdatePurchaseOrderDraftCommand } from '../../application/commands/update-purchase-order-draft.command'
import { IssuePurchaseOrderCommand } from '../../application/commands/issue-purchase-order.command'
import { ConfirmSupplierAcknowledgementCommand } from '../../application/commands/confirm-supplier-acknowledgement.command'
import { ApplyPurchaseOrderChangeCommand } from '../../application/commands/apply-purchase-order-change.command'
import { CancelPurchaseOrderCommand } from '../../application/commands/cancel-purchase-order.command'
import { CreateReceivingExpectationCommand } from '../../application/commands/create-receiving-expectation.command'
import { RecordReceivingDiscrepancyResolutionCommand } from '../../application/commands/record-receiving-discrepancy-resolution.command'
import { ProcurementAuditService } from '../../application/services/procurement-audit.service'
import { normalizeOptionalString } from '../../application/support/procurement-assertions'
import {
  PurchaseOrderLineAllocationType,
  PurchaseOrderSupplierAcknowledgementStatus,
  PurchaseRequestDecision,
  PurchaseRequestLineType,
  PurchaseRequestType,
  ReceivingResolutionCode
} from '../../domain/models/procurement-records'
import { ProcurementGrpcPresenter } from './procurement-grpc.presenter'
import { ProcurementRpcContextValidator } from './procurement-rpc-context.validator'

/** ProcurementManagementGrpcController exposes the phase 1 procurement command contract with local audit envelope recording. */
@UseFilters(GrpcExceptionFilter)
@Controller()
@PurchaseRequestManagementServiceControllerMethods()
@PurchaseOrderManagementServiceControllerMethods()
@ReceivingExpectationManagementServiceControllerMethods()
export class ProcurementManagementGrpcController
  implements
    PurchaseRequestManagementServiceController,
    PurchaseOrderManagementServiceController,
    ReceivingExpectationManagementServiceController
{
  constructor(
    private readonly commandBus: ValidatingCommandBus,
    private readonly auditService: ProcurementAuditService,
    private readonly requestContextStore: GrpcRequestContextStore
  ) {}

  async createPurchaseRequest(request: CreatePurchaseRequestRequest): Promise<CreatePurchaseRequestResponse> {
    const context = ProcurementRpcContextValidator.assertManagementContext(request)
    return this.runWithContext(context, () =>
      this.auditService.recordCommand(
        {
          tenantId: context.tenantId,
          operatorContext: context.operatorContext,
          traceContext: context.traceContext,
          auditContext: context.auditContext,
          commandName: 'CreatePurchaseRequest',
          resourceType: 'purchase_request',
          targetId: null,
          requestSummary: {
            requestType: request.requestType ?? 0,
            lineCount: request.lines?.length ?? 0
          }
        },
        async () => {
          const record = await this.commandBus.execute(
            new CreatePurchaseRequestCommand({
              tenantId: request.tenantId ?? '',
              orgId: request.orgId ?? undefined,
              requester: {
                operatorId: request.operatorContext?.operatorId ?? '',
                displayName: request.operatorContext?.operatorId ?? ''
              },
              requestType: toDomainPurchaseRequestType(request.requestType),
              title: request.title ?? undefined,
              reason: request.reason ?? undefined,
              lines: (request.lines ?? []).map((line) => ({
                lineType: toDomainPurchaseRequestLineType(line.lineType),
                itemId: line.itemId ?? undefined,
                description: line.description ?? '',
                requestedQuantity: line.requestedQuantity ?? '',
                uom: line.uom ?? '',
                neededByDate: line.neededByDate ?? undefined,
                demandReferenceType: line.demandReferenceType ?? undefined,
                demandReferenceId: line.demandReferenceId ?? undefined
              }))
            })
          )

          return ProcurementGrpcPresenter.toCreatePurchaseRequestResponse(record)
        }
      )
    )
  }

  async updatePurchaseRequestDraft(
    request: UpdatePurchaseRequestDraftRequest
  ): Promise<UpdatePurchaseRequestDraftResponse> {
    const context = ProcurementRpcContextValidator.assertManagementContext(request)
    return this.runWithContext(context, () =>
      this.auditService.recordCommand(
        {
          tenantId: context.tenantId,
          operatorContext: context.operatorContext,
          traceContext: context.traceContext,
          auditContext: context.auditContext,
          commandName: 'UpdatePurchaseRequestDraft',
          resourceType: 'purchase_request',
          targetId: request.purchaseRequestId ?? null,
          requestSummary: {
            purchaseRequestId: request.purchaseRequestId ?? '',
            lineCount: request.lines?.length ?? 0
          }
        },
        async () => {
          const record = await this.commandBus.execute(
            new UpdatePurchaseRequestDraftCommand({
              tenantId: request.tenantId ?? '',
              purchaseRequestId: request.purchaseRequestId ?? '',
              title: request.title ?? undefined,
              reason: request.reason ?? undefined,
              lines: (request.lines ?? []).map((line) => ({
                lineType: toDomainPurchaseRequestLineType(line.lineType),
                itemId: line.itemId ?? undefined,
                description: line.description ?? '',
                requestedQuantity: line.requestedQuantity ?? '',
                uom: line.uom ?? '',
                neededByDate: line.neededByDate ?? undefined,
                demandReferenceType: line.demandReferenceType ?? undefined,
                demandReferenceId: line.demandReferenceId ?? undefined
              }))
            })
          )

          return ProcurementGrpcPresenter.toUpdatePurchaseRequestDraftResponse(record)
        }
      )
    )
  }

  async submitPurchaseRequest(request: SubmitPurchaseRequestRequest): Promise<SubmitPurchaseRequestResponse> {
    const context = ProcurementRpcContextValidator.assertManagementContext(request)
    return this.runWithContext(context, () =>
      this.auditService.recordCommand(
        {
          tenantId: context.tenantId,
          operatorContext: context.operatorContext,
          traceContext: context.traceContext,
          auditContext: context.auditContext,
          commandName: 'SubmitPurchaseRequest',
          resourceType: 'purchase_request',
          targetId: request.purchaseRequestId ?? null,
          requestSummary: {
            purchaseRequestId: request.purchaseRequestId ?? ''
          }
        },
        async () =>
          ProcurementGrpcPresenter.toSubmitPurchaseRequestResponse(
            await this.commandBus.execute(
              new SubmitPurchaseRequestCommand({
                tenantId: request.tenantId ?? '',
                purchaseRequestId: request.purchaseRequestId ?? '',
                submissionComment: request.submissionComment ?? undefined
              })
            )
          )
      )
    )
  }

  async decidePurchaseRequest(request: DecidePurchaseRequestRequest): Promise<DecidePurchaseRequestResponse> {
    const context = ProcurementRpcContextValidator.assertManagementContext(request)
    return this.runWithContext(context, () =>
      this.auditService.recordCommand(
        {
          tenantId: context.tenantId,
          operatorContext: context.operatorContext,
          traceContext: context.traceContext,
          auditContext: context.auditContext,
          commandName: 'DecidePurchaseRequest',
          resourceType: 'purchase_request',
          targetId: request.purchaseRequestId ?? null,
          requestSummary: {
            purchaseRequestId: request.purchaseRequestId ?? '',
            decision: request.decision ?? 0
          }
        },
        async () =>
          ProcurementGrpcPresenter.toUpdatePurchaseRequestDraftResponse(
            await this.commandBus.execute(
              new DecidePurchaseRequestCommand({
                tenantId: request.tenantId ?? '',
                purchaseRequestId: request.purchaseRequestId ?? '',
                decision: toDomainPurchaseRequestDecision(request.decision),
                comment: request.comment ?? undefined,
                approvalReference: request.approvalReference ?? undefined,
                decidedBy: {
                  operatorId: request.operatorContext?.operatorId ?? '',
                  displayName: request.operatorContext?.operatorId ?? ''
                }
              })
            )
          )
      )
    )
  }

  async cancelPurchaseRequest(request: CancelPurchaseRequestRequest): Promise<CancelPurchaseRequestResponse> {
    const context = ProcurementRpcContextValidator.assertManagementContext(request)
    return this.runWithContext(context, () =>
      this.auditService.recordCommand(
        {
          tenantId: context.tenantId,
          operatorContext: context.operatorContext,
          traceContext: context.traceContext,
          auditContext: context.auditContext,
          commandName: 'CancelPurchaseRequest',
          resourceType: 'purchase_request',
          targetId: request.purchaseRequestId ?? null,
          requestSummary: {
            purchaseRequestId: request.purchaseRequestId ?? ''
          }
        },
        async () =>
          ProcurementGrpcPresenter.toCancelPurchaseRequestResponse(
            await this.commandBus.execute(
              new CancelPurchaseRequestCommand({
                tenantId: request.tenantId ?? '',
                purchaseRequestId: request.purchaseRequestId ?? '',
                cancelReason: request.cancelReason ?? ''
              })
            )
          )
      )
    )
  }

  async convertPurchaseRequestToPurchaseOrder(
    request: ConvertPurchaseRequestToPurchaseOrderRequest
  ): Promise<ConvertPurchaseRequestToPurchaseOrderResponse> {
    const context = ProcurementRpcContextValidator.assertManagementContext(request)
    return this.runWithContext(context, () =>
      this.auditService.recordCommand(
        {
          tenantId: context.tenantId,
          operatorContext: context.operatorContext,
          traceContext: context.traceContext,
          auditContext: context.auditContext,
          commandName: 'ConvertPurchaseRequestToPurchaseOrder',
          resourceType: 'purchase_order',
          targetId: request.purchaseRequestId ?? null,
          requestSummary: {
            purchaseRequestId: request.purchaseRequestId ?? '',
            supplierId: request.supplierId ?? '',
            lineCount: request.selectedLines?.length ?? 0
          }
        },
        async () =>
          ProcurementGrpcPresenter.toConvertPurchaseRequestToPurchaseOrderResponse(
            await this.commandBus.execute(
              new ConvertPurchaseRequestToPurchaseOrderCommand({
                tenantId: request.tenantId ?? '',
                purchaseRequestId: request.purchaseRequestId ?? '',
                supplierId: request.supplierId ?? '',
                currencyCode: request.currencyCode ?? '',
                selectedLines: (request.selectedLines ?? []).map((line) => ({
                  purchaseRequestLineId: line.purchaseRequestLineId ?? '',
                  purchaseOrderQuantity: line.purchaseOrderQuantity ?? '',
                  orderedUnitPrice: line.orderedUnitPrice ?? undefined,
                  generalStockExcessReason: line.generalStockExcessReason ?? undefined
                }))
              })
            )
          )
      )
    )
  }

  async createPurchaseOrderDraft(request: CreatePurchaseOrderDraftRequest): Promise<CreatePurchaseOrderDraftResponse> {
    const context = ProcurementRpcContextValidator.assertManagementContext(request)
    return this.runWithContext(context, () =>
      this.auditService.recordCommand(
        {
          tenantId: context.tenantId,
          operatorContext: context.operatorContext,
          traceContext: context.traceContext,
          auditContext: context.auditContext,
          commandName: 'CreatePurchaseOrderDraft',
          resourceType: 'purchase_order',
          targetId: null,
          requestSummary: {
            supplierId: request.supplierId ?? '',
            lineCount: request.lines?.length ?? 0
          }
        },
        async () =>
          ProcurementGrpcPresenter.toCreatePurchaseOrderDraftResponse(
            await this.commandBus.execute(
              new CreatePurchaseOrderDraftCommand({
                tenantId: request.tenantId ?? '',
                orgId: request.orgId ?? undefined,
                supplierId: request.supplierId ?? '',
                currencyCode: request.currencyCode ?? '',
                sourcePurchaseRequestIds: request.sourcePurchaseRequestIds ?? [],
                lines: (request.lines ?? []).map((line) => this.toPurchaseOrderLineInput(line))
              })
            )
          )
      )
    )
  }

  async updatePurchaseOrderDraft(request: UpdatePurchaseOrderDraftRequest): Promise<UpdatePurchaseOrderDraftResponse> {
    const context = ProcurementRpcContextValidator.assertManagementContext(request)
    return this.runWithContext(context, () =>
      this.auditService.recordCommand(
        {
          tenantId: context.tenantId,
          operatorContext: context.operatorContext,
          traceContext: context.traceContext,
          auditContext: context.auditContext,
          commandName: 'UpdatePurchaseOrderDraft',
          resourceType: 'purchase_order',
          targetId: request.purchaseOrderId ?? null,
          requestSummary: {
            purchaseOrderId: request.purchaseOrderId ?? '',
            lineCount: request.lines?.length ?? 0
          }
        },
        async () =>
          ProcurementGrpcPresenter.toUpdatePurchaseOrderDraftResponse(
            await this.commandBus.execute(
              new UpdatePurchaseOrderDraftCommand({
                tenantId: request.tenantId ?? '',
                purchaseOrderId: request.purchaseOrderId ?? '',
                supplierId: request.supplierId ?? '',
                currencyCode: request.currencyCode ?? '',
                sourcePurchaseRequestIds: request.sourcePurchaseRequestIds ?? [],
                lines: (request.lines ?? []).map((line) => this.toPurchaseOrderLineInput(line))
              })
            )
          )
      )
    )
  }

  async issuePurchaseOrder(request: IssuePurchaseOrderRequest): Promise<IssuePurchaseOrderResponse> {
    const context = ProcurementRpcContextValidator.assertManagementContext(request)
    return this.runWithContext(context, () =>
      this.auditService.recordCommand(
        {
          tenantId: context.tenantId,
          operatorContext: context.operatorContext,
          traceContext: context.traceContext,
          auditContext: context.auditContext,
          commandName: 'IssuePurchaseOrder',
          resourceType: 'purchase_order',
          targetId: request.purchaseOrderId ?? null,
          requestSummary: {
            purchaseOrderId: request.purchaseOrderId ?? ''
          }
        },
        async () =>
          ProcurementGrpcPresenter.toCreatePurchaseOrderDraftResponse(
            await this.commandBus.execute(
              new IssuePurchaseOrderCommand({
                tenantId: request.tenantId ?? '',
                purchaseOrderId: request.purchaseOrderId ?? '',
                issueComment: request.issueComment ?? undefined
              })
            )
          )
      )
    )
  }

  async confirmSupplierAcknowledgement(
    request: ConfirmSupplierAcknowledgementRequest
  ): Promise<ConfirmSupplierAcknowledgementResponse> {
    const context = ProcurementRpcContextValidator.assertManagementContext(request)
    return this.runWithContext(context, () =>
      this.auditService.recordCommand(
        {
          tenantId: context.tenantId,
          operatorContext: context.operatorContext,
          traceContext: context.traceContext,
          auditContext: context.auditContext,
          commandName: 'ConfirmSupplierAcknowledgement',
          resourceType: 'purchase_order',
          targetId: request.purchaseOrderId ?? null,
          requestSummary: {
            purchaseOrderId: request.purchaseOrderId ?? ''
          }
        },
        async () =>
          ProcurementGrpcPresenter.toConfirmSupplierAcknowledgementResponse(
            await this.commandBus.execute(
              new ConfirmSupplierAcknowledgementCommand({
                tenantId: request.tenantId ?? '',
                purchaseOrderId: request.purchaseOrderId ?? '',
                externalReference: request.externalReference ?? undefined,
                comment: request.comment ?? undefined,
                acknowledgedAt: request.acknowledgedAt ?? undefined
              })
            )
          )
      )
    )
  }

  async applyPurchaseOrderChange(
    request: ApplyPurchaseOrderChangeRequest
  ): Promise<ApplyPurchaseOrderChangeResponse> {
    const context = ProcurementRpcContextValidator.assertManagementContext(request)
    return this.runWithContext(context, () =>
      this.auditService.recordCommand(
        {
          tenantId: context.tenantId,
          operatorContext: context.operatorContext,
          traceContext: context.traceContext,
          auditContext: context.auditContext,
          commandName: 'ApplyPurchaseOrderChange',
          resourceType: 'purchase_order_change',
          targetId: request.purchaseOrderId ?? null,
          requestSummary: {
            purchaseOrderId: request.purchaseOrderId ?? '',
            changeType: request.changeType ?? ''
          }
        },
        async () =>
          ProcurementGrpcPresenter.toApplyPurchaseOrderChangeResponse(
            await this.commandBus.execute(
              new ApplyPurchaseOrderChangeCommand({
                tenantId: request.tenantId ?? '',
                purchaseOrderId: request.purchaseOrderId ?? '',
                changeType: request.changeType ?? '',
                changeReason: request.changeReason ?? '',
                appliedBy: {
                  operatorId: request.operatorContext?.operatorId ?? '',
                  displayName: request.operatorContext?.operatorId ?? ''
                },
                targetState: {
                  lines: (request.targetState?.lines ?? []).map((line) => this.toPurchaseOrderLineInput(line)),
                  supplierAcknowledgement: request.targetState?.supplierAcknowledgement
                    ? {
                        acknowledgementStatus:
                          normalizeOptionalString(`${request.targetState.supplierAcknowledgement.acknowledgementStatus ?? ''}`) ??
                          undefined,
                        acknowledgedAt: request.targetState.supplierAcknowledgement.acknowledgedAt ?? undefined,
                        externalReference:
                          request.targetState.supplierAcknowledgement.externalReference ?? undefined,
                        comment: request.targetState.supplierAcknowledgement.comment ?? undefined
                      }
                    : undefined
                }
              })
            )
          )
      )
    )
  }

  async cancelPurchaseOrder(request: CancelPurchaseOrderRequest): Promise<CancelPurchaseOrderResponse> {
    const context = ProcurementRpcContextValidator.assertManagementContext(request)
    return this.runWithContext(context, () =>
      this.auditService.recordCommand(
        {
          tenantId: context.tenantId,
          operatorContext: context.operatorContext,
          traceContext: context.traceContext,
          auditContext: context.auditContext,
          commandName: 'CancelPurchaseOrder',
          resourceType: 'purchase_order',
          targetId: request.purchaseOrderId ?? null,
          requestSummary: {
            purchaseOrderId: request.purchaseOrderId ?? ''
          }
        },
        async () =>
          ProcurementGrpcPresenter.toCancelPurchaseOrderResponse(
            await this.commandBus.execute(
              new CancelPurchaseOrderCommand({
                tenantId: request.tenantId ?? '',
                purchaseOrderId: request.purchaseOrderId ?? '',
                cancelReason: request.cancelReason ?? ''
              })
            )
          )
      )
    )
  }

  async createReceivingExpectation(
    request: CreateReceivingExpectationRequest
  ): Promise<CreateReceivingExpectationResponse> {
    const context = ProcurementRpcContextValidator.assertManagementContext(request)
    return this.runWithContext(context, () =>
      this.auditService.recordCommand(
        {
          tenantId: context.tenantId,
          operatorContext: context.operatorContext,
          traceContext: context.traceContext,
          auditContext: context.auditContext,
          commandName: 'CreateReceivingExpectation',
          resourceType: 'receiving_expectation',
          targetId: request.purchaseOrderLineId ?? null,
          requestSummary: {
            purchaseOrderId: request.purchaseOrderId ?? '',
            purchaseOrderLineId: request.purchaseOrderLineId ?? ''
          }
        },
        async () =>
          ProcurementGrpcPresenter.toCreateReceivingExpectationResponse(
            await this.commandBus.execute(
              new CreateReceivingExpectationCommand({
                tenantId: request.tenantId ?? '',
                purchaseOrderId: request.purchaseOrderId ?? '',
                purchaseOrderLineId: request.purchaseOrderLineId ?? '',
                expectedQuantity: request.expectedQuantity ?? '',
                expectedReceiptDate: request.expectedReceiptDate ?? undefined
              })
            )
          )
      )
    )
  }

  async recordReceivingDiscrepancyResolution(
    request: RecordReceivingDiscrepancyResolutionRequest
  ): Promise<RecordReceivingDiscrepancyResolutionResponse> {
    const context = ProcurementRpcContextValidator.assertManagementContext(request)
    return this.runWithContext(context, () =>
      this.auditService.recordCommand(
        {
          tenantId: context.tenantId,
          operatorContext: context.operatorContext,
          traceContext: context.traceContext,
          auditContext: context.auditContext,
          commandName: 'RecordReceivingDiscrepancyResolution',
          resourceType: 'receiving_discrepancy',
          targetId: request.receivingDiscrepancyId ?? null,
          requestSummary: {
            receivingExpectationId: request.receivingExpectationId ?? '',
            receivingDiscrepancyId: request.receivingDiscrepancyId ?? ''
          }
        },
        async () =>
          ProcurementGrpcPresenter.toRecordReceivingDiscrepancyResolutionResponse(
            await this.commandBus.execute(
              new RecordReceivingDiscrepancyResolutionCommand({
                tenantId: request.tenantId ?? '',
                receivingExpectationId: request.receivingExpectationId ?? '',
                receivingDiscrepancyId: request.receivingDiscrepancyId ?? '',
                resolutionCode: toDomainReceivingResolutionCode(request.resolutionCode),
                resolutionNote: request.resolutionNote ?? undefined
              })
            )
          )
      )
    )
  }

  private toPurchaseOrderLineInput(line: {
    purchaseOrderLineId?: string | null
    lineType?: number | undefined
    itemId?: string | null
    description?: string | null
    orderedQuantity?: string | null
    uom?: string | null
    orderedUnitPrice?: string | null
    sourcePurchaseRequestLineId?: string | null
    generalStockExcessReason?: string | null
    allocations?: Array<{
      allocationType?: number | undefined
      referenceId?: string | null
      quantity?: string | null
      reason?: string | null
    }> | null
  }) {
    return {
      purchaseOrderLineId: line.purchaseOrderLineId ?? undefined,
      lineType: toDomainPurchaseRequestLineType(line.lineType),
      itemId: line.itemId ?? undefined,
      description: line.description ?? '',
      orderedQuantity: line.orderedQuantity ?? '',
      uom: line.uom ?? '',
      orderedUnitPrice: line.orderedUnitPrice ?? undefined,
      sourcePurchaseRequestLineId: line.sourcePurchaseRequestLineId ?? undefined,
      generalStockExcessReason: line.generalStockExcessReason ?? undefined,
      allocations: (line.allocations ?? []).map((allocation) => ({
        allocationType: toDomainPurchaseOrderAllocationType(allocation.allocationType),
        referenceId: allocation.referenceId ?? undefined,
        quantity: allocation.quantity ?? '',
        reason: allocation.reason ?? undefined
      }))
    }
  }

  private runWithContext<T>(
    context: {
      tenantId: string
      operatorContext: {
        operatorId: string
        operatorType: string
        orgId?: string | null
      }
      traceContext: {
        requestId: string
        traceId: string
      }
    },
    work: () => Promise<T>
  ): Promise<T> {
    return this.requestContextStore.run(buildDownstreamRequestContext(context), work)
  }
}

function toDomainPurchaseRequestType(value?: ProtoPurchaseRequestType): PurchaseRequestType {
  switch (value) {
    case ProtoPurchaseRequestType.PURCHASE_REQUEST_TYPE_SALES_DEDICATED:
      return PurchaseRequestType.SALES_DEDICATED
    case ProtoPurchaseRequestType.PURCHASE_REQUEST_TYPE_PRODUCTION_PACKAGING:
      return PurchaseRequestType.PRODUCTION_PACKAGING
    case ProtoPurchaseRequestType.PURCHASE_REQUEST_TYPE_MAINTENANCE:
      return PurchaseRequestType.MAINTENANCE
    case ProtoPurchaseRequestType.PURCHASE_REQUEST_TYPE_SAMPLE:
      return PurchaseRequestType.SAMPLE
    default:
      return PurchaseRequestType.DEPARTMENTAL
  }
}

function toDomainPurchaseRequestLineType(value?: ProtoPurchaseRequestLineType): PurchaseRequestLineType {
  return value === ProtoPurchaseRequestLineType.PURCHASE_REQUEST_LINE_TYPE_TEXT
    ? PurchaseRequestLineType.TEXT
    : PurchaseRequestLineType.STANDARD_ITEM
}

function toDomainPurchaseRequestDecision(value?: ProtoPurchaseRequestDecision): PurchaseRequestDecision {
  return value === ProtoPurchaseRequestDecision.PURCHASE_REQUEST_DECISION_REJECTED
    ? PurchaseRequestDecision.REJECTED
    : PurchaseRequestDecision.APPROVED
}

function toDomainPurchaseOrderAllocationType(value?: number): PurchaseOrderLineAllocationType {
  if (value === 1) {
    return PurchaseOrderLineAllocationType.SALES_ORDER_LINE
  }
  if (value === 2) {
    return PurchaseOrderLineAllocationType.FULFILLMENT_DEMAND
  }
  return PurchaseOrderLineAllocationType.GENERAL_STOCK
}

function toDomainReceivingResolutionCode(value?: ProtoReceivingResolutionCode): ReceivingResolutionCode {
  switch (value) {
    case ProtoReceivingResolutionCode.RECEIVING_RESOLUTION_CODE_ACCEPT_SHORT_CLOSE:
      return ReceivingResolutionCode.ACCEPT_SHORT_CLOSE
    case ProtoReceivingResolutionCode.RECEIVING_RESOLUTION_CODE_RETURN_OR_REJECT_EXCESS:
      return ReceivingResolutionCode.RETURN_OR_REJECT_EXCESS
    case ProtoReceivingResolutionCode.RECEIVING_RESOLUTION_CODE_MANUAL_FOLLOW_UP:
      return ReceivingResolutionCode.MANUAL_FOLLOW_UP
    default:
      return ReceivingResolutionCode.WAIT_REDELIVERY
  }
}

function buildDownstreamRequestContext(context: {
  tenantId: string
  operatorContext: {
    operatorId: string
    operatorType: string
    orgId?: string | null
  }
  traceContext: {
    requestId: string
    traceId: string
  }
}) {
  const issuedAt = new Date()
  return {
    internalServiceName: SERVICE_NAMES.PROCUREMENT,
    requestId: context.traceContext.requestId,
    traceId: context.traceContext.traceId,
    operatorContext: {
      operator_id: context.operatorContext.operatorId,
      operator_type: context.operatorContext.operatorType,
      tenant_id: context.tenantId,
      org_id: context.operatorContext.orgId ?? undefined,
      issued_at: issuedAt.toISOString(),
      expires_at: new Date(issuedAt.getTime() + 5 * 60 * 1000).toISOString(),
      issuer: SERVICE_NAMES.PROCUREMENT,
      signature: 'procurement-runtime-context'
    }
  }
}
