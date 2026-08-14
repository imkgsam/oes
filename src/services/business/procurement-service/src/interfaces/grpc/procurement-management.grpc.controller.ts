import { Controller, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common'
import {
  AuthorizeBusinessRpc,
  GrpcRequestContextInterceptor,
  PROCUREMENT_MANAGEMENT_PERMISSION_CODES
} from '@oes/common/authorization'
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
import { ProcurementTrustedBusinessExecutionGuard } from '../../modules/procurement-trusted-execution.module'

/** ProcurementManagementGrpcController exposes the phase 1 procurement command contract with local audit envelope recording. */
@UseFilters(GrpcExceptionFilter)
@UseGuards(ProcurementTrustedBusinessExecutionGuard, ProcurementRpcContextValidator)
@UseInterceptors(GrpcRequestContextInterceptor)
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
    private readonly auditService: ProcurementAuditService
  ) {}

  async createPurchaseRequest(
    request: CreatePurchaseRequestRequest
  ): Promise<CreatePurchaseRequestResponse> {
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
              tenantId: context.tenantId,
              orgId: context.operatorContext.orgId ?? undefined,
              requester: {
                operatorId: context.operatorContext.operatorId,
                displayName: context.operatorContext.operatorId
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
              tenantId: context.tenantId,
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

  async submitPurchaseRequest(
    request: SubmitPurchaseRequestRequest
  ): Promise<SubmitPurchaseRequestResponse> {
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
                tenantId: context.tenantId,
                purchaseRequestId: request.purchaseRequestId ?? '',
                submissionComment: request.submissionComment ?? undefined
              })
            )
          )
      )
    )
  }

  async decidePurchaseRequest(
    request: DecidePurchaseRequestRequest
  ): Promise<DecidePurchaseRequestResponse> {
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
                tenantId: context.tenantId,
                purchaseRequestId: request.purchaseRequestId ?? '',
                decision: toDomainPurchaseRequestDecision(request.decision),
                comment: request.comment ?? undefined,
                approvalReference: request.approvalReference ?? undefined,
                decidedBy: {
                  operatorId: context.operatorContext.operatorId,
                  displayName: context.operatorContext.operatorId
                }
              })
            )
          )
      )
    )
  }

  async cancelPurchaseRequest(
    request: CancelPurchaseRequestRequest
  ): Promise<CancelPurchaseRequestResponse> {
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
                tenantId: context.tenantId,
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
          targetId:
            request.targetPurchaseOrderId ?? request.sourceLines?.[0]?.purchaseRequestId ?? null,
          requestSummary: {
            purchaseRequestId: request.sourceLines?.[0]?.purchaseRequestId ?? '',
            supplierId: request.supplierId ?? '',
            lineCount: request.sourceLines?.length ?? 0
          }
        },
        async () =>
          ProcurementGrpcPresenter.toConvertPurchaseRequestToPurchaseOrderResponse(
            await this.commandBus.execute(
              new ConvertPurchaseRequestToPurchaseOrderCommand({
                tenantId: context.tenantId,
                targetPurchaseOrderId: request.targetPurchaseOrderId ?? undefined,
                supplierId: request.supplierId ?? undefined,
                currencyCode: request.currencyCode ?? undefined,
                paymentTermsSnapshot: request.paymentTermsSnapshot
                  ? {
                      paymentTermsCode: request.paymentTermsSnapshot.paymentTermsCode ?? undefined,
                      paymentTermsText: request.paymentTermsSnapshot.paymentTermsText ?? undefined
                    }
                  : undefined,
                supplierCommercialTermsSnapshot: request.supplierCommercialTermsSnapshot
                  ? {
                      incotermCode:
                        request.supplierCommercialTermsSnapshot.incotermCode ?? undefined,
                      commercialTermsText:
                        request.supplierCommercialTermsSnapshot.commercialTermsText ?? undefined
                    }
                  : undefined,
                sourceLines: (request.sourceLines ?? []).map((line) => ({
                  purchaseRequestId: line.purchaseRequestId ?? '',
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

  async createPurchaseOrderDraft(
    request: CreatePurchaseOrderDraftRequest
  ): Promise<CreatePurchaseOrderDraftResponse> {
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
                tenantId: context.tenantId,
                orgId: context.operatorContext.orgId ?? undefined,
                supplierId: request.supplierId ?? '',
                currencyCode: request.currencyCode ?? '',
                paymentTermsSnapshot: request.paymentTermsSnapshot
                  ? {
                      paymentTermsCode: request.paymentTermsSnapshot.paymentTermsCode ?? undefined,
                      paymentTermsText: request.paymentTermsSnapshot.paymentTermsText ?? undefined
                    }
                  : undefined,
                supplierCommercialTermsSnapshot: request.supplierCommercialTermsSnapshot
                  ? {
                      incotermCode:
                        request.supplierCommercialTermsSnapshot.incotermCode ?? undefined,
                      commercialTermsText:
                        request.supplierCommercialTermsSnapshot.commercialTermsText ?? undefined
                    }
                  : undefined,
                sourcePurchaseRequestIds: request.sourcePurchaseRequestIds ?? [],
                lines: (request.lines ?? []).map((line) => this.toPurchaseOrderLineInput(line))
              })
            )
          )
      )
    )
  }

  async updatePurchaseOrderDraft(
    request: UpdatePurchaseOrderDraftRequest
  ): Promise<UpdatePurchaseOrderDraftResponse> {
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
                tenantId: context.tenantId,
                purchaseOrderId: request.purchaseOrderId ?? '',
                supplierId: request.supplierId ?? '',
                currencyCode: request.currencyCode ?? '',
                paymentTermsSnapshot: request.paymentTermsSnapshot
                  ? {
                      paymentTermsCode: request.paymentTermsSnapshot.paymentTermsCode ?? undefined,
                      paymentTermsText: request.paymentTermsSnapshot.paymentTermsText ?? undefined
                    }
                  : undefined,
                supplierCommercialTermsSnapshot: request.supplierCommercialTermsSnapshot
                  ? {
                      incotermCode:
                        request.supplierCommercialTermsSnapshot.incotermCode ?? undefined,
                      commercialTermsText:
                        request.supplierCommercialTermsSnapshot.commercialTermsText ?? undefined
                    }
                  : undefined,
                sourcePurchaseRequestIds: request.sourcePurchaseRequestIds ?? [],
                lines: (request.lines ?? []).map((line) => this.toPurchaseOrderLineInput(line))
              })
            )
          )
      )
    )
  }

  async issuePurchaseOrder(
    request: IssuePurchaseOrderRequest
  ): Promise<IssuePurchaseOrderResponse> {
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
                tenantId: context.tenantId,
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
                tenantId: context.tenantId,
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
                tenantId: context.tenantId,
                purchaseOrderId: request.purchaseOrderId ?? '',
                changeType: request.changeType ?? '',
                changeReason: request.changeReason ?? '',
                appliedBy: {
                  operatorId: context.operatorContext.operatorId,
                  displayName: context.operatorContext.operatorId
                },
                targetState: {
                  lines: (request.targetState?.lines ?? []).map((line) =>
                    this.toPurchaseOrderLineInput(line)
                  ),
                  supplierAcknowledgement: request.targetState?.supplierAcknowledgement
                    ? {
                        acknowledgementStatus:
                          normalizeOptionalString(
                            `${request.targetState.supplierAcknowledgement.acknowledgementStatus ?? ''}`
                          ) ?? undefined,
                        acknowledgedAt:
                          request.targetState.supplierAcknowledgement.acknowledgedAt ?? undefined,
                        externalReference:
                          request.targetState.supplierAcknowledgement.externalReference ??
                          undefined,
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

  async cancelPurchaseOrder(
    request: CancelPurchaseOrderRequest
  ): Promise<CancelPurchaseOrderResponse> {
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
                tenantId: context.tenantId,
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
                tenantId: context.tenantId,
                purchaseOrderId: request.purchaseOrderId ?? '',
                purchaseOrderLineId: request.purchaseOrderLineId ?? '',
                allocationGroupingKey: request.allocationGroupingKey ?? '',
                sourceAllocationIds: request.sourceAllocationIds ?? [],
                targetWarehouseId: request.targetWarehouseId ?? undefined,
                targetReceivingAddressId: request.targetReceivingAddressId ?? undefined,
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
                tenantId: context.tenantId,
                receivingExpectationId: request.receivingExpectationId ?? '',
                receivingDiscrepancyId: request.receivingDiscrepancyId ?? '',
                resolutionCode: toDomainReceivingResolutionCode(request.resolutionCode),
                resolutionNote: request.resolutionNote ?? undefined,
                resolutionReferences: (request.resolutionReferences ?? []).map((reference) => ({
                  referenceType: reference.referenceType ?? '',
                  referenceId: reference.referenceId ?? ''
                }))
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
      sourceReferenceId?: string | null
      quantity?: string | null
      reason?: string | null
      targetWarehouseId?: string | null
      targetReceivingAddressId?: string | null
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
        sourceReferenceId: allocation.sourceReferenceId ?? undefined,
        quantity: allocation.quantity ?? '',
        reason: allocation.reason ?? undefined,
        targetWarehouseId: allocation.targetWarehouseId ?? undefined,
        targetReceivingAddressId: allocation.targetReceivingAddressId ?? undefined
      }))
    }
  }

  /** Runs within the interceptor-established verified request scope without manufacturing local authority. */
  private runWithContext<T>(
    _context: {
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
    return work()
  }
}

/** Registers the frozen Procurement HUMAN/WEB Code matrix for every BUSINESS command RPC. */
for (const [method, code] of Object.entries({
  createPurchaseRequest: PROCUREMENT_MANAGEMENT_PERMISSION_CODES.CREATE_PURCHASE_REQUEST,
  updatePurchaseRequestDraft: PROCUREMENT_MANAGEMENT_PERMISSION_CODES.UPDATE_PURCHASE_REQUEST_DRAFT,
  submitPurchaseRequest: PROCUREMENT_MANAGEMENT_PERMISSION_CODES.SUBMIT_PURCHASE_REQUEST,
  decidePurchaseRequest: PROCUREMENT_MANAGEMENT_PERMISSION_CODES.DECIDE_PURCHASE_REQUEST,
  cancelPurchaseRequest: PROCUREMENT_MANAGEMENT_PERMISSION_CODES.CANCEL_PURCHASE_REQUEST,
  convertPurchaseRequestToPurchaseOrder:
    PROCUREMENT_MANAGEMENT_PERMISSION_CODES.CONVERT_PURCHASE_REQUEST_TO_ORDER,
  createPurchaseOrderDraft: PROCUREMENT_MANAGEMENT_PERMISSION_CODES.CREATE_PURCHASE_ORDER_DRAFT,
  updatePurchaseOrderDraft: PROCUREMENT_MANAGEMENT_PERMISSION_CODES.UPDATE_PURCHASE_ORDER_DRAFT,
  issuePurchaseOrder: PROCUREMENT_MANAGEMENT_PERMISSION_CODES.ISSUE_PURCHASE_ORDER,
  confirmSupplierAcknowledgement:
    PROCUREMENT_MANAGEMENT_PERMISSION_CODES.CONFIRM_SUPPLIER_ACKNOWLEDGEMENT,
  applyPurchaseOrderChange: PROCUREMENT_MANAGEMENT_PERMISSION_CODES.APPLY_PURCHASE_ORDER_CHANGE,
  cancelPurchaseOrder: PROCUREMENT_MANAGEMENT_PERMISSION_CODES.CANCEL_PURCHASE_ORDER,
  createReceivingExpectation: PROCUREMENT_MANAGEMENT_PERMISSION_CODES.CREATE_RECEIVING_EXPECTATION,
  recordReceivingDiscrepancyResolution:
    PROCUREMENT_MANAGEMENT_PERMISSION_CODES.RECORD_RECEIVING_DISCREPANCY_RESOLUTION
})) {
  AuthorizeBusinessRpc({ all: [code] }, { principalType: 'HUMAN', sessionTerminal: 'WEB' })(
    ProcurementManagementGrpcController.prototype,
    method,
    Object.getOwnPropertyDescriptor(ProcurementManagementGrpcController.prototype, method)
  )
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

function toDomainPurchaseRequestLineType(
  value?: ProtoPurchaseRequestLineType
): PurchaseRequestLineType {
  return value === ProtoPurchaseRequestLineType.PURCHASE_REQUEST_LINE_TYPE_TEXT
    ? PurchaseRequestLineType.TEXT
    : PurchaseRequestLineType.STANDARD_ITEM
}

function toDomainPurchaseRequestDecision(
  value?: ProtoPurchaseRequestDecision
): PurchaseRequestDecision {
  return value === ProtoPurchaseRequestDecision.PURCHASE_REQUEST_DECISION_REJECTED
    ? PurchaseRequestDecision.REJECTED
    : PurchaseRequestDecision.APPROVED
}

function toDomainPurchaseOrderAllocationType(value?: number): PurchaseOrderLineAllocationType {
  if (value === 1) {
    return PurchaseOrderLineAllocationType.PURCHASE_REQUEST_LINE
  }
  if (value === 2) {
    return PurchaseOrderLineAllocationType.SALES_ORDER_LINE
  }
  if (value === 3) {
    return PurchaseOrderLineAllocationType.FULFILLMENT_DEMAND
  }
  return PurchaseOrderLineAllocationType.GENERAL_STOCK
}

function toDomainReceivingResolutionCode(
  value?: ProtoReceivingResolutionCode
): ReceivingResolutionCode {
  switch (value) {
    case ProtoReceivingResolutionCode.RECEIVING_RESOLUTION_CODE_CLOSE_UNRECEIVED:
      return ReceivingResolutionCode.CLOSE_UNRECEIVED
    case ProtoReceivingResolutionCode.RECEIVING_RESOLUTION_CODE_REQUEST_RESEND:
      return ReceivingResolutionCode.REQUEST_RESEND
    case ProtoReceivingResolutionCode.RECEIVING_RESOLUTION_CODE_ACCEPT_WITH_PO_CHANGE:
      return ReceivingResolutionCode.ACCEPT_WITH_PO_CHANGE
    case ProtoReceivingResolutionCode.RECEIVING_RESOLUTION_CODE_REJECT_EXCESS:
      return ReceivingResolutionCode.REJECT_EXCESS
    case ProtoReceivingResolutionCode.RECEIVING_RESOLUTION_CODE_TEMP_HOLD:
      return ReceivingResolutionCode.TEMP_HOLD
    case ProtoReceivingResolutionCode.RECEIVING_RESOLUTION_CODE_REJECT_DAMAGED:
      return ReceivingResolutionCode.REJECT_DAMAGED
    case ProtoReceivingResolutionCode.RECEIVING_RESOLUTION_CODE_RECEIVE_WITH_RESTRICTION:
      return ReceivingResolutionCode.RECEIVE_WITH_RESTRICTION
    case ProtoReceivingResolutionCode.RECEIVING_RESOLUTION_CODE_CLAIM:
      return ReceivingResolutionCode.CLAIM
    case ProtoReceivingResolutionCode.RECEIVING_RESOLUTION_CODE_REJECT_WRONG_ITEM:
      return ReceivingResolutionCode.REJECT_WRONG_ITEM
    case ProtoReceivingResolutionCode.RECEIVING_RESOLUTION_CODE_TEMP_RECEIVE_PENDING_DECISION:
      return ReceivingResolutionCode.TEMP_RECEIVE_PENDING_DECISION
    case ProtoReceivingResolutionCode.RECEIVING_RESOLUTION_CODE_ACCEPT_WITH_CONTROLLED_CHANGE:
      return ReceivingResolutionCode.ACCEPT_WITH_CONTROLLED_CHANGE
    case ProtoReceivingResolutionCode.RECEIVING_RESOLUTION_CODE_WAIT_INSPECTION:
      return ReceivingResolutionCode.WAIT_INSPECTION
    case ProtoReceivingResolutionCode.RECEIVING_RESOLUTION_CODE_ACCEPT_WITH_ALLOWANCE:
      return ReceivingResolutionCode.ACCEPT_WITH_ALLOWANCE
    case ProtoReceivingResolutionCode.RECEIVING_RESOLUTION_CODE_RETURN_TO_SUPPLIER:
      return ReceivingResolutionCode.RETURN_TO_SUPPLIER
    default:
      return ReceivingResolutionCode.WAIT_REDELIVERY
  }
}
